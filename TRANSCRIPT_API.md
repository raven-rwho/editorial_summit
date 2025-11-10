# Text Transcript Processing API

Automatically convert text transcripts into published articles using AI content generation and transformation.

## Overview

The Transcript API accepts text-based transcripts, transforms them using Anthropic's Claude into well-written articles, adds relevant images, and publishes them to your repository - all automatically!

## Features

- **AI Content Transformation**: Convert raw transcripts into polished articles using Anthropic Claude API
- **Auto Title Generation**: AI generates article titles from transcript content
- **Automatic Image Selection**: Fetches and adds relevant images to articles
- **Auto Summary**: Generates short summaries for article metadata
- **Password Protected**: Secure API endpoint
- **Dual Mode**: Works locally (git) and on Vercel (GitHub API)

## API Endpoint

### POST `/api/process-transcript`

Upload a text transcript and automatically generate and publish an article.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Headers:
  - `x-api-password`: Your API password

**Request Body:**
```json
{
  "transcript": "Your text transcript content here...",
  "title": "Optional custom title",
  "password": "your_password_here"
}
```

**Fields:**
- `transcript` (required): The text transcript to process
- `title` (optional): Custom article title (auto-generated if not provided)
- `password` (optional): API password (can also be sent via `x-api-password` header)

**Response:**
```json
{
  "success": true,
  "message": "Transcript processed and committed successfully",
  "data": {
    "title": "Generated Article Title",
    "filePath": "data/posts/article-slug.mdx",
    "commitHash": "abc123...",
    "previewContent": "First 500 characters...",
    "image": {
      "url": "/static/images/generated/article-1234567890.jpg",
      "alt": "Image description",
      "credit": "Photo by... on Unsplash"
    }
  }
}
```

### GET `/api/process-transcript`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Transcript processing API is running",
  "timestamp": "2025-11-10T19:30:00.000Z"
}
```

## Setup

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Required
ANTHROPIC_API_KEY='your_anthropic_api_key'
TRANSCRIPT_API_PASSWORD='your_secure_password'

# For GitHub API (Vercel deployment)
GITHUB_TOKEN='your_github_token'
GITHUB_OWNER='your_username'
GITHUB_REPO='your_repo'
GITHUB_BRANCH='main'

# Optional: Image services
UNSPLASH_ACCESS_KEY='your_unsplash_key'
PEXELS_API_KEY='your_pexels_key'
```

### 2. Test Locally

```bash
# Start dev server
npm run dev

# In another terminal, test with curl
curl -X POST http://localhost:3000/api/process-transcript \
  -H "Content-Type: application/json" \
  -H "x-api-password: your_password" \
  -d '{
    "transcript": "Your meeting notes or transcript content here...",
    "title": "Meeting Summary"
  }'
```

### 3. Deploy to Vercel

The API automatically detects the Vercel environment and uses GitHub API for commits.

1. Push your code to GitHub
2. Deploy to Vercel
3. Add environment variables in Vercel dashboard
4. Test the production endpoint

## Usage Examples

### Example 1: Basic cURL Request

```bash
curl -X POST http://localhost:3000/api/process-transcript \
  -H "Content-Type: application/json" \
  -H "x-api-password: your_password_here" \
  -d '{
    "transcript": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\nExcepteur sint occaetat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.\n\nEaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.\n\nNemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
    "title": "Lorem Ipsum Discussion Notes"
  }'
```

### Example 2: Auto-Generated Title

```bash
curl -X POST https://your-app.vercel.app/api/process-transcript \
  -H "Content-Type: application/json" \
  -H "x-api-password: your_password_here" \
  -d '{
    "transcript": "Today we discussed the Q4 roadmap. The team agreed to focus on three key features: user authentication, payment integration, and mobile responsiveness. Sarah will lead the authentication work, while Mike handles payments. The mobile team will start with responsive design patterns."
  }'
```

### Example 3: Password in Body

```bash
curl -X POST https://your-app.vercel.app/api/process-transcript \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Meeting notes from today...",
    "title": "Team Standup",
    "password": "your_password_here"
  }'
```

### Example 4: Python Script

```python
import requests

url = "https://your-app.vercel.app/api/process-transcript"
headers = {
    "Content-Type": "application/json",
    "x-api-password": "your_password_here"
}
data = {
    "transcript": "Your transcript content here...",
    "title": "Optional Title"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

### Example 5: JavaScript/Node.js

```javascript
const fetch = require('node-fetch');

async function processTranscript() {
  const response = await fetch('https://your-app.vercel.app/api/process-transcript', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-password': 'your_password_here',
    },
    body: JSON.stringify({
      transcript: 'Your transcript content here...',
      title: 'Optional Title',
    }),
  });

  const result = await response.json();
  console.log(result);
}

processTranscript();
```

## Processing Flow

1. **Upload Transcript** → Text content sent to API endpoint
2. **Title Generation** → AI generates article title (or uses provided)
3. **Content Transform** → Transcript converted to polished article format
4. **Image Fetching** → Relevant image found and downloaded
5. **Summary Creation** → Short summary generated for metadata
6. **Publication** → Article committed to repository (local git or GitHub API)
7. **Response** → Success with article details

## Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "error": "Invalid or missing password"
}
```
Solution: Check your API password header or body field

**400 Bad Request - Missing Transcript**
```json
{
  "error": "Transcript is required"
}
```
Solution: Ensure you're sending the transcript in the request body

**500 Internal Server Error - API Key**
```json
{
  "error": "Anthropic API key not configured"
}
```
Solution: Add ANTHROPIC_API_KEY to your environment variables

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "details": "Failed to transform transcript"
}
```
Solution: Check logs, verify Anthropic API key and quota

## Security

- Password-protected endpoint
- Secure cookie-based sessions
- HTTPS required in production
- Environment variable based configuration

**Best Practices:**
- Use strong API passwords
- Rotate passwords regularly
- Monitor API usage
- Keep Anthropic API key secret
- Use environment variables (never commit secrets)
- Enable HTTPS in production

## Integration Options

### Google Apps Script

See [GOOGLE_DRIVE_AUTOMATION.md](GOOGLE_DRIVE_AUTOMATION.md) for automatic processing of Google Docs.

### Audio Files

For audio transcripts, see [AUDIO_API.md](AUDIO_API.md) which handles audio transcription before processing.

### Custom Integrations

The API accepts any text content, making it easy to integrate with:
- Voice transcription services
- Meeting recording tools
- Note-taking apps
- Content management systems
- Chat applications

## Tips & Best Practices

### Content Quality
- **Longer transcripts work better** - More content gives AI better context
- **Structure helps** - Clear sections and paragraphs improve output
- **Speaker labels** - Help AI understand conversation flow
- **Context matters** - Add meeting context or background info

### Performance
- Processing time varies with transcript length
- Typical processing: 15-30 seconds
- Monitor API quotas and rate limits

### Cost Optimization
- Longer transcripts use more API tokens
- Consider summarizing very long meetings first
- Batch process similar content together

## Troubleshooting

### Poor Article Quality

**Problem**: Generated article doesn't match expectations

**Solutions**:
- Provide more context in the transcript
- Use custom titles for better framing
- Ensure transcript is well-structured
- Add speaker labels for conversations

### Timeout Errors

**Problem**: Request times out

**Solutions**:
- Reduce transcript length
- Increase timeout in Vercel settings (max 60s on hobby plan)
- Consider upgrading Vercel plan for longer timeouts

### Image Issues

**Problem**: No image or incorrect image

**Solutions**:
- Verify UNSPLASH_ACCESS_KEY or PEXELS_API_KEY
- Check API quota limits
- Images are selected based on title/content keywords

## Related Documentation

- [Audio API Documentation](AUDIO_API.md) - For audio file processing
- [Google Drive Automation](GOOGLE_DRIVE_AUTOMATION.md) - Automatic Google Docs processing
- [Image Setup Guide](IMAGE_SETUP.md) - Configure image services

## Summary

The Text Transcript API makes it easy to turn any text content into published articles:

1. **Write** or capture your content
2. **Send** to the API endpoint
3. **Wait** for automatic processing
4. **Published** article appears in your repository

Fully automated content transformation powered by AI!