# Automatic Google Docs to Article Pipeline

This system automatically detects new Google Docs matching a specific name pattern (e.g., "notes by gemini") and sends them to your Vercel API to generate articles.

## 🎯 How It Works

1. **Google Apps Script runs every 5 minutes** (configurable)
2. **Searches for new Google Docs** with names matching your pattern
3. **Extracts the content** and sends it to your API
4. **Article is generated** and committed to your repository
5. **File is marked as processed** to avoid duplicates

**Zero manual intervention required!** 🎉

---

## 📋 Prerequisites

- Vercel app deployed with `/api/process-transcript` endpoint working
- Your `TRANSCRIPT_API_PASSWORD` from `.env`
- A personal Google account (free Gmail account works!)

---

## 🚀 Setup Instructions

### Step 1: Create the Apps Script Project

1. Go to **https://script.google.com/**
2. Click **New Project**
3. You'll see a code editor with `function myFunction() {}`

### Step 2: Add the Script

1. Delete the default code
2. Copy the entire content from `google-apps-script/DriveMonitor.gs`
3. Paste it into the editor
4. Click the **Save** icon (💾)
5. Name your project: "Drive Article Monitor"

### Step 3: Configure Settings

Find the `CONFIG` object at the top and update it:

```javascript
const CONFIG = {
  // Your Vercel API endpoint
  apiUrl: 'https://your-app.vercel.app/api/process-transcript',

  // Your API password
  apiPassword: 'your_secure_password_here',

  // Pattern to match file names
  fileNamePattern: /notes by gemini/i,

  // Optional: Monitor specific folder only
  folderId: '',

  // How far back to check (in minutes)
  lookbackMinutes: 10,

  // Check interval (minimum 5 minutes)
  triggerIntervalMinutes: 5,
};
```

**Update these fields:**
- `apiUrl`: Your Vercel deployment URL + `/api/process-transcript`
- `apiPassword`: Your `TRANSCRIPT_API_PASSWORD` from Vercel
- `fileNamePattern`: Regex to match file names (current: matches "notes by gemini", case-insensitive)
- `folderId`: **(Optional)** If you want to monitor only a specific folder:
  1. Open the folder in Google Drive
  2. Copy the ID from URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
  3. Paste it as: `folderId: 'FOLDER_ID_HERE'`

### Step 4: Test Configuration

1. In the toolbar, select **testConfiguration** from the function dropdown
2. Click **Run** (▶️)
3. You'll be prompted to grant permissions:
   - Click **Review Permissions**
   - Select your Google account
   - Click **Advanced** → **Go to Drive Article Monitor (unsafe)**
   - Click **Allow**
4. Check the **Execution log** (bottom panel) to see if everything works

### Step 5: Set Up Automatic Monitoring

1. In the toolbar, select **setupTrigger** from the function dropdown
2. Click **Run** (▶️)
3. Check the execution log - you should see: "✅ Trigger created!"
4. You'll receive a confirmation email

**That's it!** Your system is now monitoring for new files.

---

## 🎬 Usage

### Automatic Processing

1. Create a new Google Doc (or let Gemini create it)
2. Name it something like: "Meeting notes by gemini"
3. Wait up to 5 minutes
4. The script will automatically:
   - Detect the new file
   - Extract content
   - Send to your API
   - Generate and commit the article
   - Add a note to the bottom of the doc

### Monitor a Specific Folder

If you want to only process files from a specific folder:

1. Create a folder in Google Drive (e.g., "Meeting Transcripts")
2. Copy the folder ID from the URL
3. Update `folderId` in CONFIG
4. Save and re-run `setupTrigger`

### Adjust the File Name Pattern

Current pattern: `/notes by gemini/i`
- Matches: "notes by gemini", "Notes By Gemini", "meeting notes by gemini"
- Case-insensitive due to the `i` flag

**Examples of other patterns:**

```javascript
// Match any file starting with "transcript"
fileNamePattern: /^transcript/i,

// Match files ending with "gemini notes"
fileNamePattern: /gemini notes$/i,

// Match files containing "meeting" AND "notes"
fileNamePattern: /meeting.*notes|notes.*meeting/i,

// Match exact phrase only
fileNamePattern: /^notes by gemini$/i,
```

---

## 🔧 Management Functions

### View Execution History

1. In Apps Script editor, click **Executions** (📊 icon in left sidebar)
2. See all runs, successes, and failures

### View Active Triggers

1. Click **Triggers** (⏰ icon in left sidebar)
2. See your scheduled trigger

### Stop Monitoring

1. Select **removeTriggers** function
2. Click **Run**

### Re-process All Files

If you want to process files again:

1. Select **clearProcessedFiles** function
2. Click **Run**
3. Files will be processed again on the next check

---

## 📊 What Happens

### When a Matching File is Found:

```
1. Script detects: "Project meeting notes by gemini"
2. Extracts full text content
3. Sends to: POST https://your-app.vercel.app/api/process-transcript
4. API generates article using Anthropic
5. Article committed to repository
6. Script adds note to doc:
   ✅ Automatically processed on [timestamp]
   Generated article: "Project Meeting Summary"
   Commit: abc123
```

### Processed Files Tracking:

Files are tracked by their Google Drive ID to prevent duplicate processing. The script maintains a list in its properties storage.

---

## 🐛 Troubleshooting

### No files being processed

**Check:**
1. Is the file name matching your pattern?
   - Run `testConfiguration` to see what pattern is active
2. Is the trigger active?
   - Check **Triggers** panel in Apps Script
3. Check execution logs for errors

### "Permission denied" errors

**Solution:**
1. Re-authorize the script: Run `testConfiguration` again
2. Make sure you granted all permissions

### "API authentication failed"

**Solution:**
- Check your API password matches your Vercel environment variable
- Test manually:
  ```bash
  curl -X POST https://your-app.vercel.app/api/process-transcript \
    -H "Content-Type: application/json" \
    -d '{"transcript": "test", "password": "your_password"}'
  ```

### Files processed multiple times

**Solution:**
- Run `clearProcessedFiles` only when intentional
- Check if you have multiple triggers active (remove duplicates)

### View Detailed Logs

1. Click **Executions** in left sidebar
2. Click on any execution
3. View full logs and errors

---

## 🔒 Security & Privacy

- **Script runs under your Google account** - only you have access
- **Your API password** is stored in the script (only visible to you)
- **File content** is transmitted over HTTPS to your Vercel endpoint
- **No third-party services** - direct communication between Google and your API

---

## ⚙️ Advanced Configuration

### Change Check Frequency

Minimum is 5 minutes (Google Apps Script limitation):

```javascript
triggerIntervalMinutes: 5,  // Check every 5 minutes
```

### Adjust Lookback Window

```javascript
lookbackMinutes: 10,  // Check files created in last 10 minutes
```

💡 **Tip**: Set `lookbackMinutes` slightly higher than `triggerIntervalMinutes` to avoid missing files.

### Send Email Notifications

Add to the `processDocument` function after successful processing:

```javascript
MailApp.sendEmail(
  Session.getActiveUser().getEmail(),
  'Article Generated',
  `Successfully processed: ${fileName}\nTitle: ${result.data.title}`
);
```

---

## 📝 Example Workflow

**Real-world usage:**

1. **Morning meeting** recorded and transcribed by Gemini
2. **Gemini saves** transcript as "Daily standup notes by gemini"
3. **Within 5 minutes**, script detects it
4. **Article generated** automatically
5. **You receive** the article in your repository
6. **Deploy** or let auto-deploy handle it

**Zero manual work!** ⚡

---

## 🎉 You're Done!

Your automatic article generation pipeline is now active. Every new Google Doc matching your pattern will be automatically processed and turned into an article.

**Next steps:**
- Test by creating a doc named "Test notes by gemini"
- Check execution logs after 5 minutes
- Watch your repository for the new article commit
