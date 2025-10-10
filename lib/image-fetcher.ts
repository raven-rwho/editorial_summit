import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

interface UnsplashImage {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
  }
  user: {
    name: string
    username: string
  }
  description: string | null
  alt_description: string | null
}

interface PexelsImage {
  id: number
  src: {
    original: string
    large2x: string
    large: string
    medium: string
  }
  photographer: string
  photographer_url: string
  alt: string
}

/**
 * Fetch an image from Unsplash based on keywords
 */
export async function fetchUnsplashImage(
  keywords: string
): Promise<{ url: string; alt: string; credit: string } | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY

  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY not configured, skipping Unsplash')
    return null
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keywords)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Unsplash API error:', response.statusText)
      return null
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      console.log('No Unsplash images found for keywords:', keywords)
      return null
    }

    const image: UnsplashImage = data.results[0]

    return {
      url: image.urls.regular,
      alt: image.alt_description || image.description || keywords,
      credit: `Photo by ${image.user.name} on Unsplash`,
    }
  } catch (error) {
    console.error('Error fetching from Unsplash:', error)
    return null
  }
}

/**
 * Fetch an image from Pexels based on keywords
 */
export async function fetchPexelsImage(
  keywords: string
): Promise<{ url: string; alt: string; credit: string } | null> {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    console.warn('PEXELS_API_KEY not configured, skipping Pexels')
    return null
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    )

    if (!response.ok) {
      console.error('Pexels API error:', response.statusText)
      return null
    }

    const data = await response.json()

    if (!data.photos || data.photos.length === 0) {
      console.log('No Pexels images found for keywords:', keywords)
      return null
    }

    const image: PexelsImage = data.photos[0]

    return {
      url: image.src.large,
      alt: image.alt || keywords,
      credit: `Photo by ${image.photographer} on Pexels`,
    }
  } catch (error) {
    console.error('Error fetching from Pexels:', error)
    return null
  }
}

/**
 * Download an image from a URL and save it to the public directory
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  fileName: string
): Promise<string | null> {
  try {
    // Create the static/images directory if it doesn't exist
    const imagesDir = path.join(process.cwd(), 'public', 'static', 'images', 'generated')
    if (!existsSync(imagesDir)) {
      await fs.mkdir(imagesDir, { recursive: true })
    }

    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error('Failed to download image:', response.statusText)
      return null
    }

    const buffer = await response.arrayBuffer()

    // Save the image
    const imagePath = path.join(imagesDir, fileName)
    await fs.writeFile(imagePath, Buffer.from(buffer))

    // Return the relative path for use in markdown
    return `/static/images/generated/${fileName}`
  } catch (error) {
    console.error('Error downloading and saving image:', error)
    return null
  }
}

/**
 * Extract keywords from content using Claude
 */
export async function extractKeywordsFromContent(content: string): Promise<string> {
  // Simple extraction: get the first few meaningful words
  // For better results, you could use Claude API here
  const words = content
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5)

  return words.join(' ')
}

/**
 * Main function to fetch and prepare an image for content
 * Tries Unsplash first, falls back to Pexels
 */
export async function fetchImageForContent(
  keywords: string,
  slug: string,
  downloadImage = true
): Promise<{
  url: string
  alt: string
  credit: string
  localPath?: string
} | null> {
  console.log(`Fetching image for keywords: ${keywords}`)

  // Try Unsplash first
  let imageData = await fetchUnsplashImage(keywords)

  // Fallback to Pexels if Unsplash fails
  if (!imageData) {
    console.log('Trying Pexels as fallback...')
    imageData = await fetchPexelsImage(keywords)
  }

  if (!imageData) {
    console.log('No images found from any source')
    return null
  }

  // Optionally download the image to local storage
  if (downloadImage) {
    const extension = 'jpg'
    const fileName = `${slug}-${Date.now()}.${extension}`
    const localPath = await downloadAndSaveImage(imageData.url, fileName)

    if (localPath) {
      return {
        ...imageData,
        localPath,
      }
    }
  }

  return imageData
}
