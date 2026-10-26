/**
 * ==========================================================================
 * GNE'S APEX 2026 - Central High-Concurrency Event & Real-Time Sync Server
 * Guru Nanak Dev Engineering College, Ludhiana | Causmic Club
 * ==========================================================================
 * 
 * Engineered for 200+ simultaneous student workstations over LAN/Wi-Fi or Cloud.
 * Real-time SSE (Server-Sent Events) push updates with sub-millisecond latency.
 * Zero npm dependencies required. Runs natively: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;
const STATE_FILE = path.join(ROOT_DIR, 'timer_state.json');
const SUBMISSIONS_DIR = path.join(ROOT_DIR, 'submissions');
const ADMIN_KEY = 'APEX_2026_HEAD_KEY_98f12c8b74';

if (!fs.existsSync(SUBMISSIONS_DIR)) {
  try { fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true }); } catch (e) {}
}

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.zip': 'application/zip',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=UTF-8',
  '.mp4': 'video/mp4'
};

// In-Memory Static File Cache (Zero-disk-latency for 200 simultaneous student page loads)
const fileCache = new Map();
const MAX_CACHE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max per cached file

function getCachedFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return null;

    const cached = fileCache.get(filePath);
    if (cached && cached.mtime === stats.mtimeMs) {
      return cached;
    }

    if (stats.size <= MAX_CACHE_SIZE_BYTES) {
      const buffer = fs.readFileSync(filePath);
      const entry = {
        buffer,
        size: stats.size,
        mtime: stats.mtimeMs,
        etag: `"${stats.size}-${stats.mtimeMs}"`
      };
      fileCache.set(filePath, entry);
      return entry;
    }
  } catch (err) {
    return null;
  }
  return null;
}

// Default Clean Standby Timer State
const defaultState = {
  web_wizards: {
    name: 'Web Wizards',
    status: 'ready', // 'ready' | 'running' | 'paused' | 'ended'
    totalSeconds: 90 * 60, // 90 min = 5400s
    remainingSeconds: 90 * 60,
    endTime: null,
    announcement: '',
    lastUpdated: Date.now()
  },
  digital_identity: {
    name: 'Digital Identity',
    status: 'ready',
    totalSeconds: 60 * 60, // 60 min = 3600s
    remainingSeconds: 60 * 60,
    endTime: null,
    announcement: '',
    lastUpdated: Date.now()
  }
};

// In-Memory Timer State
let timerState = JSON.parse(JSON.stringify(defaultState));

// Load persisted state if exists
function loadPersistedState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.web_wizards && parsed.digital_identity) {
        timerState = parsed;
        console.log('[Server] Loaded timer state from timer_state.json');
        return;
      }
    }
  } catch (err) {
    console.warn('[Server] Could not read timer_state.json, initializing fresh defaults:', err.message);
  }
  // If not existing, save fresh default
  saveStateToDisk();
}

// Save state to disk
function saveStateToDisk() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(timerState, null, 2), 'utf8');
  } catch (err) {
    console.error('[Server] Failed to write timer_state.json:', err.message);
  }
}

// Active Server-Sent Events (SSE) connections
const sseClients = new Set();

// Debounced client count broadcast to avoid flooding when 200 clients connect at once
let clientCountDebounce = null;
function scheduleClientCountBroadcast() {
  if (clientCountDebounce) return;
  clientCountDebounce = setTimeout(() => {
    clientCountDebounce = null;
    broadcastSSE('CLIENT_COUNT', { connectedClients: sseClients.size });
  }, 400);
}

// Broadcast event to all connected student & admin browsers in <1ms
function broadcastSSE(eventType, data = {}) {
  const payload = `data: ${JSON.stringify({ type: eventType, state: timerState, serverTime: Date.now(), ...data })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Compute live remaining seconds
function getRemainingSeconds(eventState) {
  if (eventState.status === 'running' && eventState.endTime) {
    const diff = Math.round((eventState.endTime - Date.now()) / 1000);
    return Math.max(0, diff);
  }
  return eventState.remainingSeconds;
}

// Server-side 1-second ticker to detect countdown expiry
setInterval(() => {
  let changed = false;
  ['web_wizards', 'digital_identity'].forEach(key => {
    const ev = timerState[key];
    if (ev && ev.status === 'running') {
      const rem = getRemainingSeconds(ev);
      if (rem <= 0) {
        ev.status = 'ended';
        ev.remainingSeconds = 0;
        ev.endTime = null;
        ev.lastUpdated = Date.now();
        changed = true;
      }
    }
  });

  if (changed) {
    saveStateToDisk();
    broadcastSSE('TIMER_EXPIRED');
  }
}, 1000);

// SSE Heartbeat Ping every 15 seconds (keeps connections alive through firewalls/NAT)
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch (e) {
      sseClients.delete(client);
    }
  }
}, 15000);

// Helper to parse POST body JSON (configurable max size)
function parseRequestBody(req, maxBytes = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > maxBytes) {
        req.destroy();
        reject(new Error('Payload too large (exceeds ' + Math.round(maxBytes / (1024 * 1024)) + 'MB)'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Background relay to Google Apps Script / Drive (Non-blocking: student receives instant success)
function relayToGoogleDrive(gasUrl, payload) {
  return new Promise((resolve) => {
    try {
      const https = require('https');
      const data = JSON.stringify(payload);
      const req = https.request(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 60000
      }, (res) => {
        const redirectLocation = res.headers.location;
        res.resume(); // consume response body
        if (res.statusCode === 302 && redirectLocation) {
          https.get(redirectLocation, (redRes) => {
            let body = '';
            redRes.on('data', c => body += c);
            redRes.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (parsed.status === 'success') {
                  console.log(`[Drive Sync ✓ SUCCESS] File confirmed in Google Drive: "${parsed.fileName}" (File ID: ${parsed.fileId})`);
                  console.log(`[Drive Sync URL] ${parsed.fileUrl}`);
                } else {
                  console.warn(`[Drive Sync Notice] Google Apps Script returned: ${parsed.message}`);
                }
              } catch (e) {
                console.log(`[Drive Sync Response] ${body.substring(0, 200)}`);
              }
              resolve();
            });
          }).on('error', (e) => {
            console.warn(`[Drive Sync Redirect Error] ${e.message}`);
            resolve();
          });
        } else {
          console.log(`[Drive Sync HTTP ${res.statusCode}] for ${payload.fileName}`);
          resolve();
        }
      });
      req.on('error', (e) => {
        console.warn(`[Drive Sync Notice] Offline/Network: ${e.message}`);
        resolve();
      });
      req.on('timeout', () => {
        req.destroy();
        console.warn(`[Drive Sync Timeout] Google Drive sync timed out after 60s`);
        resolve();
      });
      req.write(data);
      req.end();
    } catch (e) {
      resolve();
    }
  });
}

// Helper to get network interfaces
function getNetworkIps() {
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const name in ifaces) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ ip: net.address, iface: name });
      }
    }
  }
  return ips;
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  // Global error safety
  res.on('error', () => {
    sseClients.delete(res);
  });

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS Headers (Permits cross-device calls across lab networks)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: SSE Real-Time Stream (/api/timer/stream)
  if (pathname === '/api/timer/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    sseClients.add(res);

    // Immediately send current timer state & server time to the newly connected student
    res.write(`data: ${JSON.stringify({
      type: 'INIT',
      state: timerState,
      serverTime: Date.now(),
      connectedClients: sseClients.size
    })}\n\n`);

    scheduleClientCountBroadcast();

    req.on('close', () => {
      sseClients.delete(res);
      scheduleClientCountBroadcast();
    });
    return;
  }

  // 2. API: GET Timer State (/api/timer)
  if (pathname === '/api/timer' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(JSON.stringify({
      status: 'success',
      state: timerState,
      serverTime: Date.now(),
      connectedClients: sseClients.size
    }));
    return;
  }

  // 3. API: GET Network Information (/api/network-info)
  if (pathname === '/api/network-info' && req.method === 'GET') {
    const netIps = getNetworkIps();
    const primaryIp = netIps.find(i => i.ip.startsWith('192.168.') || i.ip.startsWith('10.'))?.ip || (netIps[0]?.ip || 'localhost');

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({
      status: 'success',
      port: PORT,
      primaryIp,
      allIps: netIps,
      studentUrl: `http://${primaryIp}:${PORT}`,
      webWizardsUrl: `http://${primaryIp}:${PORT}/web-wizards-theme.html`,
      digitalIdentityUrl: `http://${primaryIp}:${PORT}/digital-identity-theme.html`,
      connectedClients: sseClients.size
    }));
    return;
  }

  // 4. API: POST Admin Login Authentication (/api/admin/login)
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const payload = await parseRequestBody(req);
      const passcode = (payload.passcode || '').trim();
      const cryptoMod = require('crypto');
      const hash = cryptoMod.createHash('sha256').update('GNE_APEX_2026_SALT_' + passcode).digest('hex');
      const defaultHash = '17a45908cd724ef57309f0e6146179819ec3c6196d58899d5840651c2f29f942';

      if (passcode.toLowerCase() === 'apex2026' || hash === defaultHash) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          adminKey: ADMIN_KEY,
          message: 'Authenticated successfully'
        }));
        return;
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'error',
          message: 'Invalid administrative passcode'
        }));
        return;
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: err.message }));
      return;
    }
  }

  // 5. API: POST Timer Mutation (/api/timer) - Authenticated Admin Endpoint
  if (pathname === '/api/timer' && req.method === 'POST') {
    try {
      const payload = await parseRequestBody(req);
      const action = payload.action;
      const eventKey = payload.eventKey || 'web_wizards';
      const adminKey = payload.adminKey || req.headers['x-admin-key'];

      // Authentication verification
      if (adminKey !== ADMIN_KEY) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Forbidden: Invalid Admin Key' }));
        return;
      }

      console.log(`[Admin Action] Action: "${action}" on ${eventKey}`);

      if (action === 'resetAll') {
        timerState = JSON.parse(JSON.stringify(defaultState));
        saveStateToDisk();
        broadcastSSE('TIMER_UPDATE', { action: 'resetAll', eventKey: 'all' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          action: 'resetAll',
          state: timerState,
          connectedClients: sseClients.size
        }));
        return;
      }

      const ev = timerState[eventKey];
      if (!ev) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Unknown event key' }));
        return;
      }

      switch (action) {
        case 'start':
          ev.status = 'running';
          ev.endTime = Date.now() + (ev.remainingSeconds * 1000);
          ev.lastUpdated = Date.now();
          break;

        case 'pause':
          if (ev.status === 'running') {
            ev.remainingSeconds = getRemainingSeconds(ev);
            ev.status = 'paused';
            ev.endTime = null;
            ev.lastUpdated = Date.now();
          }
          break;

        case 'resume':
          if (ev.status === 'paused') {
            ev.status = 'running';
            ev.endTime = Date.now() + (ev.remainingSeconds * 1000);
            ev.lastUpdated = Date.now();
          }
          break;

        case 'setDuration': {
          const minutes = Math.max(1, parseInt(payload.minutes || 90, 10));
          const totalSec = minutes * 60;
          ev.status = 'ready';
          ev.totalSeconds = totalSec;
          ev.remainingSeconds = totalSec;
          ev.endTime = null;
          ev.lastUpdated = Date.now();
          break;
        }

        case 'addExtra': {
          const extraMin = Math.max(1, parseInt(payload.minutes || 5, 10));
          const extraSec = extraMin * 60;
          ev.remainingSeconds += extraSec;
          ev.totalSeconds += extraSec;
          if (ev.status === 'running' && ev.endTime) {
            ev.endTime += extraSec * 1000;
          }
          ev.lastUpdated = Date.now();
          break;
        }

        case 'reset':
          ev.status = 'ready';
          ev.remainingSeconds = ev.totalSeconds;
          ev.endTime = null;
          ev.lastUpdated = Date.now();
          break;

        case 'end':
          ev.status = 'ended';
          ev.remainingSeconds = 0;
          ev.endTime = null;
          ev.lastUpdated = Date.now();
          break;

        case 'announcement':
          ev.announcement = (payload.text || '').trim();
          ev.lastUpdated = Date.now();
          break;

        case 'clearAnnouncement':
          ev.announcement = '';
          ev.lastUpdated = Date.now();
          break;

        default:
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: 'Unknown action' }));
          return;
      }

      saveStateToDisk();
      broadcastSSE('TIMER_UPDATE', { action, eventKey });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        action: action,
        eventKey: eventKey,
        state: timerState,
        connectedClients: sseClients.size
      }));
      return;
    } catch (err) {
      console.error('[Admin Action Error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: err.message }));
      return;
    }
  }

  // 6. API: POST File Submission (/api/upload) - High-Speed Direct LAN & Local Vault Storage
  if (pathname === '/api/upload' && req.method === 'POST') {
    try {
      const payload = await parseRequestBody(req, 150 * 1024 * 1024); // 150MB buffer limit
      const eventType = payload.event || 'Web Wizards';
      const rawCode = (payload.schoolCode || 'SCH').trim();
      const schoolCode = rawCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '') || 'SCH';
      const rawFileName = payload.fileName || (eventType === 'Web Wizards' ? 'project.zip' : 'logo.png');
      const safeOrigName = path.basename(rawFileName);
      const safeFileName = safeOrigName.toUpperCase().startsWith(schoolCode + '_') ? safeOrigName : `${schoolCode}_${safeOrigName}`;
      
      let base64String = payload.fileBase64 || payload.data || '';
      if (base64String.indexOf(',') > -1) {
        base64String = base64String.split(',')[1];
      }

      if (!base64String) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'No file data received' }));
        return;
      }

      // Target Event Folder
      const subDir = path.join(SUBMISSIONS_DIR, eventType);
      fs.mkdirSync(subDir, { recursive: true });

      // Save file directly onto server hard drive
      const destPath = path.join(subDir, safeFileName);
      const fileBuffer = Buffer.from(base64String, 'base64');
      fs.writeFileSync(destPath, fileBuffer);

      // Submission Token & Record
      const token = payload.token || `APEX26-${eventType === 'Web Wizards' ? 'WW' : 'DI'}-${schoolCode}-${Math.floor(1000 + Math.random() * 9000)}`;
      const submissionRecord = {
        token,
        event: eventType,
        schoolCode,
        fileName: safeFileName,
        fileSizeBytes: fileBuffer.length,
        savedPath: destPath,
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleString()
      };

      // Persist in JSON audit log
      const logFile = path.join(SUBMISSIONS_DIR, 'submissions_log.json');
      let currentLogs = [];
      try {
        if (fs.existsSync(logFile)) {
          currentLogs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
      } catch (e) {}
      currentLogs.push(submissionRecord);
      fs.writeFileSync(logFile, JSON.stringify(currentLogs, null, 2), 'utf8');

      // Append to CSV log for instant opening in MS Excel / LibreOffice
      const csvFile = path.join(SUBMISSIONS_DIR, 'submissions_log.csv');
      if (!fs.existsSync(csvFile)) {
        fs.writeFileSync(csvFile, 'Timestamp,Token,Event,School Code,File Name,Size (Bytes),Path\n', 'utf8');
      }
      fs.appendFileSync(csvFile, `"${submissionRecord.formattedTime}","${token}","${eventType}","${schoolCode}","${safeFileName}",${fileBuffer.length},"${destPath.replace(/\\/g, '\\\\')}"\n`, 'utf8');

      console.log(`[Submission] Secured ${eventType} from ${schoolCode}: ${safeFileName} (${fileBuffer.length} bytes)`);

      // Asynchronous background relay to Google Drive (Non-blocking)
      const gasEndpoint = 'https://script.google.com/macros/s/AKfycbznYufWQribMU1D0yD_RMu1aP9B5JSp4SG2qIUeBlgSt3fmmoHbyQ1trG2sBr8seBSN/exec';
      if (gasEndpoint) {
        relayToGoogleDrive(gasEndpoint, {
          event: eventType,
          token,
          schoolCode,
          fileName: safeOrigName,
          mimeType: payload.mimeType || 'application/octet-stream',
          fileBase64: base64String
        }).catch(err => console.warn('[Background Drive Sync Warning]', err.message));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        message: 'Project uploaded and secured on Event Server!',
        token,
        fileName: safeFileName,
        fileSize: fileBuffer.length
      }));
      return;
    } catch (err) {
      console.error('[Upload Error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: err.message }));
      return;
    }
  }

  // 7. API: GET Submissions List (/api/submissions) - Admin Evaluation Endpoint
  if (pathname === '/api/submissions' && req.method === 'GET') {
    const logFile = path.join(SUBMISSIONS_DIR, 'submissions_log.json');
    let logs = [];
    try {
      if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }
    } catch (e) {}
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({ status: 'success', submissions: logs }));
    return;
  }

  // 5. Static File Serving with In-Memory Streaming & Caching
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, safePath);

  // Security check: ensure path is within ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Fast path: cached small assets (HTML, CSS, JS)
  const cached = getCachedFile(filePath);
  if (cached) {
    if (req.headers['if-none-match'] === cached.etag) {
      res.writeHead(304);
      res.end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': cached.size,
      'ETag': cached.etag,
      'Cache-Control': 'no-cache, must-revalidate'
    });
    res.end(cached.buffer);
    return;
  }

  // Fallback: stream larger files (PDFs, ZIPs, Videos)
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end('<h1>404 Not Found</h1><p>GNE APEX Portal: The requested file was not found.</p>');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, must-revalidate'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

// Crash prevention
process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server Unhandled Rejection]', reason);
});

// Start Server
loadPersistedState();

server.listen(PORT, HOST, () => {
  const netIps = getNetworkIps();
  const primaryIp = netIps.find(i => i.ip.startsWith('192.168.') || i.ip.startsWith('10.'))?.ip || (netIps[0]?.ip || 'localhost');

  console.log('================================================================');
  console.log("  GNE'S APEX 2026 - Central Real-Time Event Server (SSE Ready)");
  console.log('================================================================');
  console.log(`  Local Access:     http://localhost:${PORT}`);
  console.log(`  Lab / Wi-Fi IP:   http://${primaryIp}:${PORT}`);
  netIps.forEach(net => {
    console.log(`    ↳ Interface:    http://${net.ip}:${PORT} (${net.iface})`);
  });
  console.log('----------------------------------------------------------------');
  console.log(`  Student Portal:   http://${primaryIp}:${PORT}`);
  console.log(`  Web Wizards:      http://${primaryIp}:${PORT}/web-wizards-theme.html`);
  console.log(`  Digital Identity: http://${primaryIp}:${PORT}/digital-identity-theme.html`);
  console.log(`  Event Heads Hub:  http://${primaryIp}:${PORT}/admin.html`);
  console.log('----------------------------------------------------------------');
  console.log('  Live Real-Time SSE: Ready for 200+ simultaneous workstations');
  console.log('================================================================\n');
});
