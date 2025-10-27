/**
 * Google Apps Script for sending Google Doc content to your Vercel API
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Doc with the meeting transcript
 * 2. Go to Extensions > Apps Script
 * 3. Delete any default code and paste this entire script
 * 4. Update the CONFIG object below with your settings
 * 5. Save the script (Ctrl/Cmd + S)
 * 6. Refresh your Google Doc
 * 7. You'll see a new "Article Generator" menu appear
 */

// ===== CONFIGURATION =====
const CONFIG = {
  // Your Vercel API endpoint
  apiUrl: 'https://your-app.vercel.app/api/process-transcript',

  // Your API password (same as TRANSCRIPT_API_PASSWORD in your .env)
  apiPassword: 'your_secure_password_here',

  // Optional: Custom title (leave empty to auto-generate)
  customTitle: '',
};

/**
 * Creates a custom menu when the document opens
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Article Generator')
    .addItem('Generate Article from This Doc', 'generateArticle')
    .addItem('⚙️ Configure Settings', 'showConfigDialog')
    .addToUi();
}

/**
 * Main function to extract doc content and send to API
 */
function generateArticle() {
  const ui = DocumentApp.getUi();

  try {
    // Show processing message
    ui.alert('Processing...', 'Extracting content and generating article. This may take 30-60 seconds.', ui.ButtonSet.OK);

    // Get the document content
    const doc = DocumentApp.getActiveDocument();
    const body = doc.getBody();
    const text = body.getText();

    // Validate content
    if (!text || text.trim().length < 100) {
      ui.alert('Error', 'Document appears to be empty or too short. Please add content first.', ui.ButtonSet.OK);
      return;
    }

    Logger.log('Document content length: ' + text.length + ' characters');

    // Prepare the request payload
    const payload = {
      transcript: text,
      password: CONFIG.apiPassword,
    };

    // Add custom title if provided
    if (CONFIG.customTitle && CONFIG.customTitle.trim().length > 0) {
      payload.title = CONFIG.customTitle;
    }

    // Configure the HTTP request
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true, // Don't throw on error status codes
    };

    Logger.log('Sending request to: ' + CONFIG.apiUrl);

    // Send request to your API
    const response = UrlFetchApp.fetch(CONFIG.apiUrl, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Response status: ' + statusCode);
    Logger.log('Response body: ' + responseText);

    // Parse the response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from API: ' + responseText);
    }

    // Handle the response
    if (statusCode === 200 && result.success) {
      // Success!
      const title = result.data.title || 'Article';
      const filePath = result.data.filePath || 'Unknown';
      const commitHash = result.data.commitHash || 'N/A';

      const message = `✅ Success!\n\n` +
        `Title: ${title}\n` +
        `File: ${filePath}\n` +
        `Commit: ${commitHash}\n\n` +
        `The article has been generated and committed to your repository.`;

      ui.alert('Article Generated!', message, ui.ButtonSet.OK);
    } else {
      // Error from API
      const errorMsg = result.error || result.details || 'Unknown error';
      throw new Error(errorMsg);
    }

  } catch (error) {
    Logger.log('Error: ' + error.toString());

    // Show user-friendly error message
    let errorMessage = error.toString();

    if (errorMessage.includes('401') || errorMessage.includes('Invalid or missing password')) {
      errorMessage = 'Authentication failed. Please check your API password in the script configuration.';
    } else if (errorMessage.includes('404')) {
      errorMessage = 'API endpoint not found. Please check the API URL in the script configuration.';
    } else if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection and API URL.';
    }

    ui.alert('Error Generating Article', errorMessage, ui.ButtonSet.OK);
  }
}

/**
 * Shows a configuration dialog (optional enhancement)
 */
function showConfigDialog() {
  const ui = DocumentApp.getUi();

  const message = `Current Configuration:\n\n` +
    `API URL: ${CONFIG.apiUrl}\n` +
    `Password: ${CONFIG.apiPassword ? '***' + CONFIG.apiPassword.slice(-4) : 'Not set'}\n\n` +
    `To change settings, edit the CONFIG object in the script code:\n` +
    `Extensions > Apps Script`;

  ui.alert('Configuration', message, ui.ButtonSet.OK);
}

/**
 * Test function to verify configuration
 */
function testConfiguration() {
  Logger.log('=== Configuration Test ===');
  Logger.log('API URL: ' + CONFIG.apiUrl);
  Logger.log('API Password set: ' + (CONFIG.apiPassword ? 'Yes' : 'No'));
  Logger.log('Custom title: ' + (CONFIG.customTitle || 'Auto-generate'));

  // Test API health check
  try {
    const response = UrlFetchApp.fetch(CONFIG.apiUrl, { method: 'get', muteHttpExceptions: true });
    Logger.log('API Health Check Status: ' + response.getResponseCode());
    Logger.log('API Response: ' + response.getContentText());
  } catch (e) {
    Logger.log('API Health Check Failed: ' + e.toString());
  }
}
