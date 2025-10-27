import { NextRequest, NextResponse } from 'next/server'
import {
  transformTranscriptToMarkdown,
  generateShortSummary,
  generateTitle,
} from '@/lib/anthropic-client'
import { commitMarkdownToRepo } from '@/lib/git-operations'
import { commitMarkdownToGitHub } from '@/lib/github-operations'
import { extractTitleFromMarkdown, generateSlug } from '@/lib/markdown-generator'

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

    // Generate title if not provided
    console.log('Generating title...')
    let title = body.title
    if (!title) {
      title = await generateTitle(body.transcript)
    }

    // Generate slug early for image fetching
    const slug = generateSlug(title)

    // Transform the transcript using Anthropic
    console.log('Transforming transcript with Anthropic...')
    const { markdown, imageData } = await transformTranscriptToMarkdown(body.transcript, {
      includeImage: true,
      slug: slug,
    })

    // Generate short summary for frontmatter
    console.log('Generating summary...')
    const summary = await generateShortSummary(body.transcript)

    // Use GitHub API on Vercel, local git operations otherwise
    // const isVercel = process.env.VERCEL === '1'
    const isVercel = true

    let commitResult
  
      console.log('Running on Vercel - using GitHub API for commit...')
      commitResult = await commitMarkdownToGitHub(markdown, title, summary, imageData || undefined)
    // } else {
    //   console.log('Running locally - using git operations...')
    //   commitResult = await commitMarkdownToRepo(markdown, title, summary, imageData || undefined)
    // }

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
        image: imageData
          ? {
              url: imageData.localPath || imageData.url,
              alt: imageData.alt,
              credit: imageData.credit,
            }
          : null,
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
