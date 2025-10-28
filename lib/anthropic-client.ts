import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { fetchImageForContent } from './image-fetcher'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Transcribe audio using OpenAI Whisper API
 * Supports various audio formats
 */
export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  filename?: string
): Promise<string> {
  console.log('=== AUDIO TRANSCRIPTION START ===')
  console.log(`Audio format: ${mimeType}`)
  console.log(`Filename: ${filename}`)
  console.log(`Audio size: ${audioBase64.length} bytes (base64)`)

  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64')

    // Determine file extension from filename or MIME type
    let extension = 'mp3'
    let correctedMimeType = mimeType

    if (filename) {
      // Extract extension from filename
      const match = filename.match(/\.([^.]+)$/i)
      if (match) {
        extension = match[1].toLowerCase()
      }
    } else {
      // Map MIME type to file extension
      const extensionMap: Record<string, string> = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/webm': 'webm',
        'audio/ogg': 'ogg',
        'audio/flac': 'flac',
        'audio/m4a': 'm4a',
        'audio/mp4': 'mp4',
        'audio/x-m4a': 'm4a',
        'audio/aac': 'aac',
      }
      extension = extensionMap[mimeType] || 'mp3'
    }

    // Map extension to proper MIME type
    const mimeTypeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      webm: 'audio/webm',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      m4a: 'audio/mp4',
      mp4: 'audio/mp4',
      aac: 'audio/aac',
      mpga: 'audio/mpeg',
      oga: 'audio/ogg',
    }

    correctedMimeType = mimeTypeMap[extension] || 'audio/mpeg'

    console.log(`Detected extension: ${extension}`)
    console.log(`Using MIME type: ${correctedMimeType}`)

    // Create a File-like object for the OpenAI API
    const audioFile = new File([audioBuffer], `audio.${extension}`, { type: correctedMimeType })

    console.log('Sending audio to OpenAI Whisper API...')
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
    })

    const transcript = response.trim()
    console.log(`=== TRANSCRIPTION COMPLETED ===`)
    console.log(`Transcript length: ${transcript.length} characters`)
    console.log('=== END TRANSCRIPTION ===\n')
    return transcript
  } catch (error) {
    console.error('Error transcribing audio:', error)
    throw new Error('Failed to transcribe audio using OpenAI Whisper API')
  }
}

/**
 * Generate a short title for the article based on the transcript
 */
export async function generateTitle(transcript: string): Promise<string> {
  const prompt = `Please generate a very short, concise title for this meeting transcript. The title should be 3-8 words maximum and capture the main topic. Do not use quotes or punctuation at the end.

Meeting transcript:
${transcript}`

  console.log('=== TITLE GENERATION PROMPT ===')
  console.log(prompt)
  console.log('=== END TITLE PROMPT ===\n')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 50,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const title = content.text.trim().replace(/^["']|["']$/g, '')
      console.log('=== GENERATED TITLE ===')
      console.log(title)
      console.log('=== END GENERATED TITLE ===\n')
      return title
    }

    throw new Error('Unexpected response format from Anthropic API')
  } catch (error) {
    console.error('Error generating title:', error)
    throw new Error('Failed to generate title using Anthropic API')
  }
}

export async function generateShortSummary(transcript: string): Promise<string> {
  const prompt = `Please generate a very short one-sentence summary of this meeting transcript. The summary should capture the main topic or purpose of the meeting in a concise way suitable as a teaser for a news article.

Meeting transcript:
${transcript}`

  console.log('=== TEASER PROMPT ===')
  console.log(prompt)
  console.log('=== END TEASER PROMPT ===\n')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 100,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text.trim()
    }

    throw new Error('Unexpected response format from Anthropic API')
  } catch (error) {
    console.error('Error generating summary:', error)
    throw new Error('Failed to generate summary using Anthropic API')
  }
}

/**
 * Extract keywords for image search from the transcript
 */
export async function extractImageKeywords(transcript: string): Promise<string> {
  const prompt = `From the following meeting transcript, extract 2-4 keywords that would be good for searching stock photos. Focus on visual concepts, themes, or settings mentioned in the discussion. Return only the keywords separated by spaces.

Meeting transcript:
${transcript.substring(0, 1000)}...`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 50,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const keywords = content.text.trim()
      console.log('=== EXTRACTED IMAGE KEYWORDS ===')
      console.log(keywords)
      console.log('=== END KEYWORDS ===\n')
      return keywords
    }

    throw new Error('Unexpected response format from Anthropic API')
  } catch (error) {
    console.error('Error extracting keywords:', error)
    // Fallback to simple keyword extraction
    const fallbackKeywords = transcript.split(/\s+/).slice(0, 3).join(' ')
    console.log('=== FALLBACK IMAGE KEYWORDS ===')
    console.log(fallbackKeywords)
    console.log('=== END KEYWORDS ===\n')
    return fallbackKeywords
  }
}

export async function transformTranscriptToMarkdown(
  transcript: string,
  options?: { includeImage?: boolean; slug?: string }
): Promise<{
  markdown: string
  imageData?: { url: string; alt: string; credit: string; localPath?: string }
}> {
  const prompt = `Please transform the following meeting transcript into a well-structured written story in markdown format.

Key requirements:
- Create an engaging narrative that captures the key points and discussions from the meeting
- Use proper markdown formatting with headers, lists, and emphasis where appropriate
- Organize the content with clear sections and subsections
- Include a compelling title and brief summary at the beginning
- Make it readable and engaging for a news article audience
- Preserve important quotes and decisions from the meeting
- try to avoid bullet points and instead write in full sentences and paragraphs

Meeting transcript:
${transcript}`

  console.log('=== ARTICLE GENERATION PROMPT ===')
  console.log(prompt)
  console.log('=== END ARTICLE PROMPT ===\n')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Anthropic API')
    }

    const markdown = content.text

    // Optionally fetch an image for the content
    let imageData
    if (options?.includeImage !== false) {
      console.log('Extracting keywords for image search...')
      const keywords = await extractImageKeywords(transcript)
      console.log('Keywords extracted:', keywords)

      const slug = options?.slug || 'meeting'
      imageData = await fetchImageForContent(keywords, slug, true)

      if (imageData) {
        console.log('Image fetched successfully:', imageData.localPath || imageData.url)
      }
    }

    return {
      markdown,
      imageData,
    }
  } catch (error) {
    console.error('Error transforming transcript:', error)
    throw new Error('Failed to transform transcript using Anthropic API')
  }
}
