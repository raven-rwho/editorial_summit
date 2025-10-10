/**
 * Utility functions for generating markdown content with images
 */

interface ImageData {
  url: string
  alt: string
  credit: string
  localPath?: string
}

/**
 * Insert an image into markdown content after the first H1 heading
 */
export function insertImageIntoMarkdown(markdown: string, imageData: ImageData): string {
  const imagePath = imageData.localPath || imageData.url
  const imageMarkdown = `\n![${imageData.alt}](${imagePath})\n\n*${imageData.credit}*\n`

  // Split markdown into lines
  const lines = markdown.split('\n')
  let insertIndex = -1

  // Find the first H1 heading
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      insertIndex = i + 1
      // Skip any empty lines after the heading
      while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
        insertIndex++
      }
      break
    }
  }

  // Insert the image
  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, imageMarkdown)
    return lines.join('\n')
  } else {
    // If no H1 found, insert at the beginning
    return imageMarkdown + markdown
  }
}

/**
 * Generate frontmatter for a markdown file
 */
export function generateFrontMatter(
  title: string,
  summary: string,
  imageData?: ImageData,
  additionalFields?: Record<string, any>
): string {
  const date = new Date().toISOString()
  const imageFields = imageData ? `images: ['${imageData.localPath || imageData.url}']` : ''

  const frontMatter = `---
title: "${title}"
date: "${date}"
tags: ["Summit", "transcript"]
draft: false
summary: "${summary}"
${imageFields}${additionalFields ? '\n' + Object.entries(additionalFields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n') : ''}
---

`

  return frontMatter
}

/**
 * Generate complete markdown file with frontmatter and content
 */
export function generateCompleteMarkdown(
  markdown: string,
  title: string,
  summary: string,
  imageData?: ImageData,
  additionalFields?: Record<string, any>
): string {
  // Insert image into the markdown content if provided
  let content = markdown
  if (imageData) {
    content = insertImageIntoMarkdown(markdown, imageData)
  }

  // Add frontmatter
  const frontMatter = generateFrontMatter(title, summary, imageData, additionalFields)

  return frontMatter + content
}

/**
 * Extract title from markdown content (first H1 heading)
 */
export function extractTitleFromMarkdown(markdown: string): string | null {
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  return titleMatch ? titleMatch[1] : null
}

/**
 * Generate a slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
