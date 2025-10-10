# Automatic Image Integration Setup

This project now automatically fetches and adds relevant images to generated articles from meeting transcripts.

## How It Works

1. **Keyword Extraction**: Claude analyzes the transcript and extracts 2-4 visual keywords
2. **Image Search**: The system searches Unsplash (primary) and Pexels (fallback) for relevant images
3. **Image Download**: Images are downloaded to `public/static/images/generated/`
4. **Automatic Attribution**: Image credits are added to the article frontmatter
5. **Git Commit**: Both the article and image are committed together

## Setup Instructions

### 1. Get an Unsplash API Key (Recommended)

1. Go to [https://unsplash.com/developers](https://unsplash.com/developers)
2. Sign up for a free account
3. Create a new application
4. Copy your **Access Key**
5. Add to `.env`:
   ```
   UNSPLASH_ACCESS_KEY='your_access_key_here'
   ```

**Limits**: 50 requests/hour (free tier)

### 2. Get a Pexels API Key (Optional Fallback)

1. Go to [https://www.pexels.com/api/](https://www.pexels.com/api/)
2. Sign up for a free account
3. Copy your **API Key**
4. Add to `.env`:
   ```
   PEXELS_API_KEY='your_api_key_here'
   ```

**Limits**: 200 requests/hour (free tier)

### 3. Verify Setup

Test the API:

```bash
curl -X GET http://localhost:3000/api/process-transcript
```

Process a transcript with automatic image:

```bash
curl -X POST http://localhost:3000/api/process-transcript \
  -H "Content-Type: application/json" \
  -H "x-api-password: YOUR_PASSWORD" \
  -d '{
    "transcript": "We discussed the future of renewable energy and solar panels...",
    "title": "The Future of Renewable Energy"
  }'
```

## Image Storage

- **Downloaded images**: `public/static/images/generated/`
- **Frontmatter field**: `images: ['/static/images/generated/filename.jpg']`
- **Credit field**: `imageCredit: "Photo by Author Name on Unsplash"`

## Disabling Images

If you want to process a transcript without fetching an image, the feature gracefully falls back when API keys are not configured. Simply don't set the `UNSPLASH_ACCESS_KEY` or `PEXELS_API_KEY` environment variables.

## API Response

Successful responses now include image information:

```json
{
  "success": true,
  "message": "Transcript processed and committed successfully",
  "data": {
    "title": "Article Title",
    "filePath": "data/posts/article-slug.mdx",
    "commitHash": "abc123...",
    "previewContent": "...",
    "image": {
      "url": "/static/images/generated/article-slug-123456.jpg",
      "alt": "Solar panels on a rooftop",
      "credit": "Photo by Example User on Unsplash"
    }
  }
}
```

## Troubleshooting

### No images are being fetched

1. Check that API keys are set in `.env`
2. Verify API keys are valid
3. Check console logs for errors
4. Ensure you haven't exceeded rate limits

### Images not displaying

1. Verify image was downloaded to `public/static/images/generated/`
2. Check frontmatter has correct `images` field
3. Ensure your theme/layout supports the `images` frontmatter field

### Rate limit issues

- Unsplash: 50 requests/hour
- Pexels: 200 requests/hour
- Consider implementing caching or using both services as fallbacks
