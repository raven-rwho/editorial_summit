# Audio Processing API

Automatically convert audio recordings into published articles using AI transcription and content generation.

## 🎯 Overview

The Audio API accepts audio files, transcribes them using Anthropic's Claude, transforms the transcript into a well-written article, adds images, and publishes it to your repository - all automatically!

## 🚀 Features

- **Audio Transcription**: Convert audio files to text using Anthropic Claude API
- **Multiple Formats**: Supports MP3, WAV, WebM, OGG, FLAC, M4A, MP4
- **Large Files**: Up to 25MB file size
- **Auto-Processing**: Same pipeline as text transcripts (title, images, publication)
- **Password Protected**: Secure API endpoint
- **Dual Mode**: Works locally (git) and on Vercel (GitHub API)

## 📋 API Endpoint

### POST `/api/process-audio`

Upload an audio file and automatically generate and publish an article.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers:
  - `x-api-password`: Your API password

**Form Data:**
- `audio` (required): Audio file (max 25MB)
- `title` (optional): Custom article title (auto-generated if not provided)

**Response:**
```json
{
  "success": true,
  "message": "Audio processed and committed successfully",
  "data": {
    "title": "Generated Article Title",
    "filePath": "data/posts/article-slug.mdx",
    "commitHash": "abc123...",
    "transcriptLength": 5432,
    "previewContent": "First 500 characters...",
    "image": {
      "url": "/static/images/generated/article-1234567890.jpg",
      "alt": "Image description",
      "credit": "Photo by... on Unsplash"
    }
  }
}
```

### GET `/api/process-audio`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Audio processing API is running",
  "maxFileSize": "25MB",
  "supportedFormats": ["mp3", "wav", "webm", "ogg", "flac", "m4a", "mp4"],
  "timestamp": "2025-10-27T19:30:00.000Z"
}
```

## 🔧 Setup

### 1. Environment Variables

The audio API uses the same environment variables as the text API:

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
yarn dev

# In another terminal, test with curl
curl -X POST http://localhost:3000/api/process-audio \
  -H "x-api-password: your_password" \
  -F "audio=@path/to/your/audio.mp3" \
  -F "title=My Meeting Notes"
```

### 3. Deploy to Vercel

The API automatically detects the Vercel environment and uses GitHub API for commits.

1. Push your code to GitHub
2. Deploy to Vercel
3. Add environment variables in Vercel dashboard
4. Test the production endpoint

## 📝 Usage Examples

### Example 1: cURL with Audio File

```bash
curl -X POST https://your-app.vercel.app/api/process-audio \
  -H "x-api-password: your_password_here" \
  -F "audio=@meeting-recording.mp3"
```

### Example 2: cURL with Custom Title

```bash
curl -X POST https://your-app.vercel.app/api/process-audio \
  -H "x-api-password: your_password_here" \
  -F "audio=@interview.wav" \
  -F "title=Product Strategy Discussion"
```

### Example 3: Python Script

```python
import requests

url = "https://your-app.vercel.app/api/process-audio"
headers = {"x-api-password": "your_password_here"}

with open("recording.mp3", "rb") as audio_file:
    files = {"audio": audio_file}
    data = {"title": "Team Standup"}

    response = requests.post(url, headers=headers, files=files, data=data)
    print(response.json())
```

### Example 4: JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function processAudio() {
  const form = new FormData();
  form.append('audio', fs.createReadStream('recording.mp3'));
  form.append('title', 'Weekly Review');

  const response = await fetch('https://your-app.vercel.app/api/process-audio', {
    method: 'POST',
    headers: {
      'x-api-password': 'your_password_here',
    },
    body: form,
  });

  const result = await response.json();
  console.log(result);
}

processAudio();
```

## 🎬 Processing Flow

1. **Upload Audio** → Audio file sent to API endpoint
2. **Transcription** → Anthropic Claude transcribes audio to text
3. **Title Generation** → AI generates article title (or uses provided)
4. **Content Transform** → Transcript converted to article format
5. **Image Fetching** → Relevant image found and downloaded
6. **Summary Creation** → Short summary generated for metadata
7. **Publication** → Article committed to repository (local git or GitHub API)
8. **Response** → Success with article details

## 🎤 Supported Audio Formats

| Format | MIME Type | Extension | Notes |
|--------|-----------|-----------|-------|
| MP3 | audio/mpeg | .mp3 | Most common, good compression |
| WAV | audio/wav | .wav | Uncompressed, high quality |
| WebM | audio/webm | .webm | Modern web format |
| OGG | audio/ogg | .ogg | Open format |
| FLAC | audio/flac | .flac | Lossless compression |
| M4A | audio/m4a | .m4a | Apple format |
| MP4 | audio/mp4 | .mp4 | Container format |

**Maximum file size**: 25MB

## ⚠️ Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "error": "Invalid or missing password"
}
```
Solution: Check your API password header

**400 Bad Request - Missing Audio**
```json
{
  "error": "Audio file is required"
}
```
Solution: Ensure you're sending the audio file in the form data

**400 Bad Request - File Too Large**
```json
{
  "error": "File too large. Maximum size is 25MB"
}
```
Solution: Compress your audio file or split into smaller segments

**400 Bad Request - Invalid File Type**
```json
{
  "error": "Invalid file type. Please upload an audio file."
}
```
Solution: Use a supported audio format (MP3, WAV, etc.)

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "details": "Failed to transcribe audio using Anthropic API"
}
```
Solution: Check logs, verify Anthropic API key and quota

## 🔒 Security

- ✅ Password-protected endpoint
- ✅ File size limits (25MB)
- ✅ File type validation
- ✅ Secure cookie-based sessions
- ✅ HTTPS required in production

**Best Practices:**
- Use strong API passwords
- Rotate passwords regularly
- Monitor API usage
- Keep Anthropic API key secret
- Use environment variables (never commit secrets)

## 📊 Comparison: Text vs Audio API

| Feature | Text API | Audio API |
|---------|----------|-----------|
| Input | Text transcript | Audio file |
| Transcription | Not needed | ✅ Automatic |
| File Upload | ❌ | ✅ |
| Max Input Size | Unlimited text | 25MB audio |
| Processing Time | ~15-30s | ~30-60s |
| Cost | Lower | Higher (transcription) |
| Use Case | Pre-transcribed content | Raw audio recordings |

## 💡 Tips & Best Practices

### Audio Quality
- **Use good microphones** - Better audio = better transcription
- **Minimize background noise** - Clearer audio = fewer errors
- **Single speaker is easier** - Multi-speaker needs labels

### File Size Optimization
- **Use MP3 format** - Good quality, smaller size
- **Reduce bitrate** - 64-128 kbps is usually fine for speech
- **Mono audio** - Speech doesn't need stereo
- **Cut silence** - Remove long pauses

### Processing Time
- Audio API takes longer than text API (transcription step)
- Longer audio = more processing time
- Monitor timeouts for very long files

### Cost Optimization
- Audio transcription uses more API tokens
- Pre-process audio to remove silence
- Consider batch processing for multiple files

## 🐛 Troubleshooting

### Transcription Quality Issues

**Problem**: Poor transcription accuracy

**Solutions**:
- Improve audio quality (better microphone, less noise)
- Ensure clear speech (not too fast, good articulation)
- Check supported languages (Anthropic supports major languages)

### Timeout Errors

**Problem**: Request times out for long audio files

**Solutions**:
- Split long recordings into shorter segments
- Increase timeout in Vercel settings (max 60s on hobby plan)
- Consider upgrading Vercel plan for longer timeouts

### Memory Issues

**Problem**: Out of memory errors

**Solutions**:
- Reduce audio file size
- Use lower bitrate/sample rate
- Upgrade to higher Vercel plan

## 🔗 Integration with Google Apps Script

You can combine this with the Google Drive automation to process audio files automatically!

```javascript
// In DriveMonitor.gs, add audio file pattern:
const CONFIG = {
  fileNamePattern: /\.mp3$|\.wav$/i,  // Match audio files
  // ... rest of config
};

// Modify processDocument to handle audio files:
function processAudioFile(file) {
  const audioBlob = file.getBlob();
  const audioBase64 = Utilities.base64Encode(audioBlob.getBytes());

  // Send to audio API endpoint
  const response = UrlFetchApp.fetch(CONFIG.apiUrl.replace('process-transcript', 'process-audio'), {
    method: 'post',
    payload: {
      audio: audioBlob,
      title: file.getName()
    },
    headers: {
      'x-api-password': CONFIG.apiPassword
    }
  });

  return JSON.parse(response.getContentText());
}
```

## 📚 Related Documentation

- [Main API Documentation](GOOGLE_DRIVE_AUTOMATION.md)
- [Password Protection Setup](PASSWORD_PROTECTION.md)
- [Image Integration Guide](IMAGE_SETUP.md)

## 🎉 Summary

The Audio API makes it incredibly easy to turn audio recordings into published articles:

1. **Record** your meeting/interview/podcast
2. **Upload** the audio file to the API
3. **Wait** for automatic processing
4. **Published** article appears in your repository

No manual transcription. No manual writing. Fully automated! 🚀
