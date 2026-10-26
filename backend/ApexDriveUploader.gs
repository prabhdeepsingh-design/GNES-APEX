/**
 * ==========================================================================
 * GNE'S APEX 2026 - Official Google Drive Direct Upload Bridge
 * Guru Nanak Dev Engineering College, Ludhiana | Causmic Club
 * ==========================================================================
 * 
 * Target Folders:
 * Web Wizards Folder ID:     1nmUjbjrtedhGwCT0Xrni-xKUypUVvZal
 * Digital Identity Folder ID: 12ogVi0XadV9FEUv8gXo6d3zw6srrhKFx
 * 
 * 2-MINUTE DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://script.google.com in your browser (signed in with your Google account).
 * 2. Click "+ New project".
 * 3. Delete any code in Code.gs, paste this entire file into it, and press Ctrl+S to save.
 * 4. At the top right, click "Deploy" > "New deployment".
 * 5. In the modal:
 *    - Click the gear icon next to "Select type" and choose "Web app".
 *    - Description: "GNE APEX Upload Bridge"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (CRITICAL: this allows your website users to upload without signing into Google!)
 * 6. Click "Deploy".
 * 7. Click "Authorize access", choose your Google account, click "Advanced" -> "Go to Untitled project (unsafe)", and click "Allow".
 * 8. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/AKfycb.../exec).
 * 9. Paste that URL into script.js at:
 *    gasEndpoint: 'https://script.google.com/macros/s/.../exec'
 * 
 * NOW ANY FILE UPLOADED ON YOUR WEBSITE GOES DIRECTLY INTO YOUR GOOGLE DRIVE!
 */

const FOLDERS = {
  'Web Wizards': '1nmUjbjrtedhGwCT0Xrni-xKUypUVvZal',
  'Digital Identity': '12ogVi0XadV9FEUv8gXo6d3zw6srrhKFx'
};

const ADMIN_KEY = 'APEX_2026_HEAD_KEY_98f12c8b74';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'No payload received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);

    // Event Heads Real-Time Timer Synchronization Action (Protected by ADMIN_KEY)
    if (data.action === 'setTimer') {
      if (data.adminKey !== ADMIN_KEY) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Security Alert: Unauthorized timer mutation. Invalid Admin Key.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      const props = PropertiesService.getScriptProperties();
      const key = data.event === 'Digital Identity' ? 'timer_digital_identity' : 'timer_web_wizards';
      props.setProperty(key, JSON.stringify(data.timerState));
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        event: data.event,
        timerState: data.timerState
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const eventType = data.event || 'Web Wizards';
    const folderId = FOLDERS[eventType] || FOLDERS['Web Wizards'];
    
    // Open target Google Drive Folder
    const folder = DriveApp.getFolderById(folderId);
    
    // Clean base64 string
    let base64String = data.fileBase64 || '';
    if (base64String.indexOf(',') > -1) {
      base64String = base64String.split(',')[1];
    }
    
    // Standardized file name (safeguard against duplicate schoolCode prefix)
    const schoolCode = (data.schoolCode || 'SCH').toUpperCase();
    const origName = data.fileName || (eventType === 'Web Wizards' ? 'project.zip' : 'logo.png');
    const safeFileName = origName.toUpperCase().startsWith(schoolCode + '_') ? origName : (schoolCode + '_' + origName);
    
    // Decode and create file inside Google Drive Folder
    const decodedBytes = Utilities.base64Decode(base64String);
    const blob = Utilities.newBlob(decodedBytes, data.mimeType || 'application/octet-stream', safeFileName);
    const file = folder.createFile(blob);
    
    // Add detailed jury metadata description to the Drive file
    const desc = [
      '=== GNE APEX 2026 SUBMISSION ===',
      'Event: ' + eventType,
      'Token: ' + (data.token || 'N/A'),
      'School: ' + (data.schoolName || 'N/A') + ' [' + schoolCode + ']',
      'Participant 1: ' + (data.participant1 || 'N/A'),
      'Participant 2: ' + (data.participant2 || 'Solo'),
      'Project Title: ' + (data.projectTitle || 'N/A'),
      'Tool/Editor: ' + (data.tool || data.editor || 'N/A'),
      'Contact Phone: ' + (data.phone || 'N/A'),
      'Uploaded At: ' + new Date().toString()
    ].join('\n');
    file.setDescription(desc);

    // Optional: Log into a Google Sheet in the same folder for easy tracking
    logToSheet(folder, data, safeFileName, file.getUrl());
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      token: data.token,
      fileId: file.getId(),
      fileName: safeFileName,
      fileUrl: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function logToSheet(folder, data, fileName, fileUrl) {
  try {
    const sheetName = 'APEX_2026_Submission_Log';
    const files = folder.getFilesByName(sheetName);
    let ss;
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      ss = SpreadsheetApp.create(sheetName);
      const file = DriveApp.getFileById(ss.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
      const sheet = ss.getActiveSheet();
      sheet.appendRow(['Timestamp', 'Token', 'Event', 'School Code', 'School Name', 'Participant 1', 'Participant 2', 'Phone', 'File Name', 'Drive URL']);
    }
    const sheet = ss.getActiveSheet();
    sheet.appendRow([
      new Date().toLocaleString(),
      data.token || '',
      data.event || '',
      data.schoolCode || '',
      data.schoolName || '',
      data.participant1 || '',
      data.participant2 || '',
      data.phone || '',
      fileName,
      fileUrl
    ]);
  } catch (e) {
    // If sheet creation fails, file is still safely in Drive folder
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getTimer') {
    const props = PropertiesService.getScriptProperties();
    const data = {
      status: 'success',
      web_wizards: JSON.parse(props.getProperty('timer_web_wizards') || 'null'),
      digital_identity: JSON.parse(props.getProperty('timer_digital_identity') || 'null'),
      serverTime: Date.now()
    };
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('GNE APEX 2026 Drive Bridge is Online & Ready.');
}
