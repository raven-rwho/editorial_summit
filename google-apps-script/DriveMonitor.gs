/**
 * Google Apps Script for automatically processing new Google Docs
 * when they match a specific naming pattern
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com/
 * 2. Create a new project (not bound to a document)
 * 3. Paste this code
 * 4. Update CONFIG with your settings
 * 5. Run 'setupTrigger' function once to set up automatic monitoring
 * 6. Grant permissions when prompted
 *
 * HOW IT WORKS:
 * - Runs every 5 minutes (configurable)
 * - Checks for new files matching your pattern in a specific folder
 * - Sends matching documents to your API
 * - Marks processed files (adds property to prevent re-processing)
 */

// ===== CONFIGURATION =====
const CONFIG = {
  // Your Vercel API endpoint
  apiUrl: 'https://your-app.vercel.app/api/process-transcript',

  // Your API password (same as TRANSCRIPT_API_PASSWORD in your .env)
  apiPassword: 'your_secure_password_here',

  // Regex pattern to match file names (e.g., "notes by gemini")
  fileNamePattern: /notes by gemini/i,  // 'i' makes it case-insensitive

  // Optional: Specific folder ID to monitor (leave empty to monitor all accessible files)
  // Get folder ID from URL: https://drive.google.com/drive/folders/FOLDER_ID_HERE
  folderId: '',

  // How many minutes to look back for new files
  lookbackMinutes: 10,

  // Trigger interval in minutes (minimum 5 for Apps Script)
  triggerIntervalMinutes: 5,
};

/**
 * Main function that runs on a schedule to check for new files
 */
function checkForNewDocuments() {
  Logger.log('=== Starting document check ===');
  Logger.log('Time: ' + new Date().toISOString());

  try {
    // Calculate the time window to check
    const now = new Date();
    const lookbackTime = new Date(now.getTime() - CONFIG.lookbackMinutes * 60 * 1000);

    Logger.log('Looking for files created after: ' + lookbackTime.toISOString());

    // Build search query
    let query = `mimeType='application/vnd.google-apps.document' and createdDate >= '${lookbackTime.toISOString()}'`;

    // Add folder restriction if specified
    if (CONFIG.folderId) {
      query += ` and '${CONFIG.folderId}' in parents`;
    }

    // Add "not trashed" condition
    query += ` and trashed=false`;

    Logger.log('Search query: ' + query);

    // Search for files
    const files = DriveApp.searchFiles(query);
    let processedCount = 0;
    let skippedCount = 0;

    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();

      Logger.log('Found file: ' + fileName);

      // Check if file name matches pattern
      if (!CONFIG.fileNamePattern.test(fileName)) {
        Logger.log('  → Skipped: Name does not match pattern');
        skippedCount++;
        continue;
      }

      // Check if already processed
      if (isAlreadyProcessed(file)) {
        Logger.log('  → Skipped: Already processed');
        skippedCount++;
        continue;
      }

      // Process the document
      Logger.log('  → Processing...');
      const success = processDocument(file);

      if (success) {
        markAsProcessed(file);
        processedCount++;
        Logger.log('  → ✅ Success');
      } else {
        Logger.log('  → ❌ Failed');
      }
    }

    Logger.log('=== Check complete ===');
    Logger.log('Processed: ' + processedCount + ', Skipped: ' + skippedCount);

  } catch (error) {
    Logger.log('ERROR in checkForNewDocuments: ' + error.toString());
    // Send email notification on error (optional)
    // MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Drive Monitor Error', error.toString());
  }
}

/**
 * Process a single document by sending it to the API
 */
function processDocument(file) {
  try {
    const fileId = file.getId();
    const fileName = file.getName();

    Logger.log('    Fetching content for: ' + fileName);

    // Open the document and get its content
    const doc = DocumentApp.openById(fileId);
    const body = doc.getBody();
    const text = body.getText();

    // Validate content
    if (!text || text.trim().length < 100) {
      Logger.log('    Document too short or empty');
      return false;
    }

    Logger.log('    Content length: ' + text.length + ' characters');

    // Prepare the request payload
    const payload = {
      transcript: text,
      password: CONFIG.apiPassword,
      // Optional: Include metadata
      // title: fileName.replace(/notes by gemini/i, '').trim(),
    };

    // Configure the HTTP request
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    Logger.log('    Sending to API...');

    // Send request to your API
    const response = UrlFetchApp.fetch(CONFIG.apiUrl, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('    Response status: ' + statusCode);

    // Parse the response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      Logger.log('    Invalid JSON response: ' + responseText);
      return false;
    }

    // Check if successful
    if (statusCode === 200 && result.success) {
      Logger.log('    Article generated: ' + (result.data.title || 'Unknown'));
      Logger.log('    Commit hash: ' + (result.data.commitHash || 'N/A'));

      // Optional: Add a comment to the Google Doc
      addProcessingComment(file, result);

      return true;
    } else {
      Logger.log('    API error: ' + (result.error || result.details || 'Unknown error'));
      return false;
    }

  } catch (error) {
    Logger.log('    ERROR processing document: ' + error.toString());
    return false;
  }
}

/**
 * Check if a file has already been processed
 */
function isAlreadyProcessed(file) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const processedFiles = properties.getProperty('processedFiles') || '{}';
    const processedObj = JSON.parse(processedFiles);

    return processedObj[file.getId()] === true;
  } catch (error) {
    Logger.log('    Error checking processed status: ' + error.toString());
    return false;
  }
}

/**
 * Mark a file as processed to avoid re-processing
 */
function markAsProcessed(file) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const processedFiles = properties.getProperty('processedFiles') || '{}';
    const processedObj = JSON.parse(processedFiles);

    processedObj[file.getId()] = true;

    properties.setProperty('processedFiles', JSON.stringify(processedObj));
    Logger.log('    Marked as processed');
  } catch (error) {
    Logger.log('    Error marking as processed: ' + error.toString());
  }
}

/**
 * Optional: Add a comment to the Google Doc indicating it was processed
 */
function addProcessingComment(file, result) {
  try {
    const doc = DocumentApp.openById(file.getId());
    const body = doc.getBody();

    // Add a note at the end
    const timestamp = new Date().toLocaleString();
    const title = result.data.title || 'Article';
    const commitHash = result.data.commitHash || 'N/A';

    body.appendParagraph('\n---');
    body.appendParagraph(`✅ Automatically processed on ${timestamp}`);
    body.appendParagraph(`Generated article: "${title}"`);
    body.appendParagraph(`Commit: ${commitHash}`);

    Logger.log('    Added processing comment to document');
  } catch (error) {
    Logger.log('    Could not add comment: ' + error.toString());
  }
}

/**
 * Setup function - Run this ONCE to create the time-based trigger
 */
function setupTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkForNewDocuments') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger
  ScriptApp.newTrigger('checkForNewDocuments')
    .timeBased()
    .everyMinutes(CONFIG.triggerIntervalMinutes)
    .create();

  Logger.log('✅ Trigger created! Will check for new documents every ' + CONFIG.triggerIntervalMinutes + ' minutes');
  Logger.log('File name pattern: ' + CONFIG.fileNamePattern);

  // Send confirmation email
  const email = Session.getActiveUser().getEmail();
  MailApp.sendEmail(
    email,
    'Drive Monitor Setup Complete',
    `Your Google Drive monitor is now active!\n\n` +
    `- Checking every ${CONFIG.triggerIntervalMinutes} minutes\n` +
    `- Looking for files matching: ${CONFIG.fileNamePattern}\n` +
    `- Folder: ${CONFIG.folderId || 'All accessible folders'}\n\n` +
    `You'll receive article generation notifications via your API.`
  );
}

/**
 * Remove all triggers - Run this to stop monitoring
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkForNewDocuments') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  Logger.log('✅ All triggers removed. Monitoring stopped.');
}

/**
 * Clear the processed files list - Run this to re-process all files
 */
function clearProcessedFiles() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty('processedFiles');
  Logger.log('✅ Processed files list cleared');
}

/**
 * Test function - Run this to test the configuration
 */
function testConfiguration() {
  Logger.log('=== Configuration Test ===');
  Logger.log('API URL: ' + CONFIG.apiUrl);
  Logger.log('API Password set: ' + (CONFIG.apiPassword ? 'Yes' : 'No'));
  Logger.log('File name pattern: ' + CONFIG.fileNamePattern);
  Logger.log('Folder ID: ' + (CONFIG.folderId || 'All folders'));
  Logger.log('Lookback minutes: ' + CONFIG.lookbackMinutes);
  Logger.log('Trigger interval: ' + CONFIG.triggerIntervalMinutes + ' minutes');

  // Test API connection
  try {
    const response = UrlFetchApp.fetch(CONFIG.apiUrl, { method: 'get', muteHttpExceptions: true });
    Logger.log('\nAPI Health Check:');
    Logger.log('Status: ' + response.getResponseCode());
    Logger.log('Response: ' + response.getContentText());
  } catch (e) {
    Logger.log('\nAPI Health Check Failed: ' + e.toString());
  }

  // Test file search
  Logger.log('\n=== Testing file search ===');
  checkForNewDocuments();
}
