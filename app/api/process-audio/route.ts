import { NextRequest, NextResponse } from 'next/server'
import {
  transformTranscriptToMarkdown,
  generateShortSummary,
  generateTitle,
  transcribeAudio,
} from '@/lib/anthropic-client'
import { commitMarkdownToRepo } from '@/lib/git-operations'
import { commitMarkdownToGitHub } from '@/lib/github-operations'
import { generateSlug } from '@/lib/markdown-generator'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB limit

export async function POST(request: NextRequest) {
  try {
    // Check password protection
    const expectedPassword = process.env.TRANSCRIPT_API_PASSWORD
    if (!expectedPassword) {
      return NextResponse.json({ error: 'API password not configured' }, { status: 500 })
    }

    const providedPassword = request.headers.get('x-api-password')
    if (!providedPassword || providedPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid or missing password' }, { status: 401 })
    }

    // Validate environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const title = formData.get('title') as string | null

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    // Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Check file type (audio formats)
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
      'audio/m4a',
      'audio/mp4',
      'audio/x-m4a',
      'audio/aac',
    ]

    console.log(`[AUDIO] Received: ${audioFile.name} (${audioFile.type}, ${audioFile.size} bytes)`)

    // Check if file type starts with 'audio/' or matches allowed types
    const isAudioFile = audioFile.type.startsWith('audio/') || allowedTypes.includes(audioFile.type)

    // Also check file extension as fallback (in case MIME type is not set correctly)
    const fileName = audioFile.name.toLowerCase()
    const hasAudioExtension = /\.(mp3|wav|webm|ogg|flac|m4a|mp4)$/i.test(fileName)

    if (!isAudioFile && !hasAudioExtension) {
      return NextResponse.json(
        { error: `Invalid file type. Received: ${audioFile.type}. Please upload an audio file.` },
        { status: 400 }
      )
    }

    // Convert audio file to buffer
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    // Transcribe audio using OpenAI Whisper
    console.log('[AUDIO] Transcribing audio with OpenAI Whisper...')
    const transcript = await transcribeAudio(audioBase64, audioFile.type, audioFile.name)
    console.log(`[AUDIO] Transcription completed (${transcript.length} characters)`)

    // Generate title if not provided
    console.log('[AUDIO] Generating title...')
    let generatedTitle = title
    if (!generatedTitle) {
      generatedTitle = await generateTitle(transcript)
    }

    // Generate slug early for image fetching
    const slug = generateSlug(generatedTitle)

    // Transform the transcript using Anthropic
    console.log('[AUDIO] Transforming transcript to article...')
    const { markdown, imageData } = await transformTranscriptToMarkdown(transcript, {
      includeImage: true,
      slug: slug,
    })

    // Generate short summary for frontmatter
    console.log('[AUDIO] Generating summary...')
    const summary = await generateShortSummary(transcript)

    // Use GitHub API on Vercel, local git operations otherwise
    const isVercel = process.env.VERCEL === '1'

    let commitResult

    if (isVercel) {
      console.log('[AUDIO] Running on Vercel - using GitHub API for commit...')
      commitResult = await commitMarkdownToGitHub(
        markdown,
        generatedTitle,
        summary,
        imageData || undefined
      )
    } else {
      console.log('[AUDIO] Running locally - using git operations...')
      commitResult = await commitMarkdownToRepo(
        markdown,
        generatedTitle,
        summary,
        imageData || undefined
      )
    }

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
      message: 'Audio processed and committed successfully',
      data: {
        title: generatedTitle,
        filePath: commitResult.filePath,
        commitHash: commitResult.commitHash,
        transcriptLength: transcript.length,
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
    console.error('[AUDIO] Error processing audio:', error)

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
    message: 'Audio processing API is running',
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    supportedFormats: ['mp3', 'wav', 'webm', 'ogg', 'flac', 'm4a', 'mp4'],
    timestamp: new Date().toISOString(),
  })
}
