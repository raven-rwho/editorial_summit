import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateShortSummary(transcript: string): Promise<string> {
  const prompt = `Please generate a very short one-sentence summary of this meeting transcript. The summary should capture the main topic or purpose of the meeting in a concise way suitable as a teaser for a news article.

Meeting transcript:
${transcript}`

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

export async function transformTranscriptToMarkdown(transcript: string): Promise<string> {
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
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format from Anthropic API')
  } catch (error) {
    console.error('Error transforming transcript:', error)
    throw new Error('Failed to transform transcript using Anthropic API')
  }
}
