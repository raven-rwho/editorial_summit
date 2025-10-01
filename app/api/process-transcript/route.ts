import { NextRequest, NextResponse } from 'next/server'
import { transformTranscriptToMarkdown } from '@/lib/anthropic-client'
import { commitMarkdownToRepo } from '@/lib/git-operations'

interface RequestBody {
  transcript: string
  title?: string
  password?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: RequestBody = await request.json()

    // Check password protection
    const expectedPassword = process.env.TRANSCRIPT_API_PASSWORD
    if (!expectedPassword) {
      return NextResponse.json({ error: 'API password not configured' }, { status: 500 })
    }

    const providedPassword = body.password || request.headers.get('x-api-password')
    if (!providedPassword || providedPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid or missing password' }, { status: 401 })
    }

    if (!body.transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    // Transform the transcript using Anthropic
    console.log('Transforming transcript with Anthropic...')
    const markdown = await transformTranscriptToMarkdown(body.transcript)

    // Extract title from the generated markdown if not provided
    let title = body.title
    if (!title) {
      // Try to extract title from the first H1 header in the markdown
      const titleMatch = markdown.match(/^#\s+(.+)$/m)
      title = titleMatch ? titleMatch[1] : `Meeting Summary - ${new Date().toLocaleDateString()}`
    }

    // Commit the markdown to the repository
    console.log('Committing to repository...')
    const commitResult = await commitMarkdownToRepo(markdown, title)

    if (!commitResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to commit to repository',
          details: commitResult.error,
        },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Transcript processed and committed successfully',
      data: {
        title,
        filePath: commitResult.filePath,
        commitHash: commitResult.commitHash,
        previewContent: markdown.substring(0, 500) + '...',
      },
    })
  } catch (error) {
    console.error('Error processing transcript:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Transcript processing API is running',
    timestamp: new Date().toISOString(),
  })
}
