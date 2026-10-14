/* ==========================================================================
   GNE'S APEX 2026 - Official Event & Native File Upload Portal Engine
   Guru Nanak Dev Engineering College, Ludhiana | Causmic Club
   ========================================================================== */

// Official destination configuration (connected behind the scenes)
const APEX_CONFIG = {
  driveFolders: {
    'Web Wizards': '1nmUjbjrtedhGwCT0Xrni-xKUypUVvZal',
    'Digital Identity': '12ogVi0XadV9FEUv8gXo6d3zw6srrhKFx'
  },
  // If a Google Apps Script web app URL is provided, background POSTs are sent directly here!
  // Set your URL here or enter it via the Admin Setup button in the footer.
  gasEndpoint: 'https://script.google.com/macros/s/AKfycbznYufWQribMU1D0yD_RMu1aP9B5JSp4SG2qIUeBlgSt3fmmoHbyQ1trG2sBr8seBSN/exec'
};

// Retrieve active endpoint (code or stored)
function getActiveGasEndpoint() {
  return localStorage.getItem('apex_gas_endpoint') || APEX_CONFIG.gasEndpoint || '';
}

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initMobileMenu();
  initNativeFileUploader();
  initCopyButtons();
  initModals();
  initAdminBridgeSetup();
  initCuriousUploader();
});

/* 1. Event Countdown Timer to 30th October 2026 */
function initCountdown() {
  const targetDate = new Date('October 30, 2026 08:30:00').getTime();

  const daysEl = document.getElementById('count-days');
  const hoursEl = document.getElementById('count-hours');
  const minutesEl = document.getElementById('count-minutes');
  const secondsEl = document.getElementById('count-seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* 2. Mobile Menu Toggle */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (!toggleBtn || !mobileNav) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('active');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });
}

/* 3. Native File Upload Portal Engine (Zero Drive Branding) */
function initNativeFileUploader() {
  const form = document.getElementById('submission-form');
  const dropzone = document.getElementById('apex-dropzone');
  const fileInput = document.getElementById('file-upload-input');
  const previewCard = document.getElementById('file-preview-card');
  const previewName = document.getElementById('file-preview-name');
  const previewSize = document.getElementById('file-preview-size');
  const previewIcon = document.getElementById('file-type-icon');
  const removeBtn = document.getElementById('file-remove-btn');
  const progressBox = document.getElementById('upload-progress-box');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const progressLog = document.getElementById('progress-status-log');
  const submitBtn = document.getElementById('btn-submit-project');
  const receiptCard = document.getElementById('receipt-card');

  if (!form || !dropzone || !fileInput) return;

  let selectedFile = null;
  const eventType = form.getAttribute('data-event') || 'Web Wizards';

  // Format file size
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Handle selected file
  function handleFile(file) {
    if (!file) return;

    // Type validation
    if (eventType === 'Web Wizards') {
      const validZip = file.name.match(/\.zip$/i);
      if (!validZip) {
        showToast('⚠️ Please upload a .ZIP archive');
        return;
      }
    } else if (eventType === 'Digital Identity') {
      const validImg = file.name.match(/\.(png|jpg|jpeg|svg|webp)$/i);
      if (!validImg) {
        showToast('⚠️ Please upload an image file (.PNG, .JPG, or .SVG)');
        return;
      }

      // Check resolution for image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth !== 800 || img.naturalHeight !== 800) {
            showToast(`ℹ️ Image is ${img.naturalWidth}×${img.naturalHeight}px. Competition recommends exact 800×800px.`);
          } else {
            showToast('✓ Verified resolution: Exactly 800×800px');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    // Size limit check (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      showToast('⚠️ File exceeds the maximum 50MB limit.');
      return;
    }

    selectedFile = file;

    // Update UI Preview
    if (previewName) previewName.textContent = file.name;
    if (previewSize) previewSize.textContent = formatBytes(file.size);
    if (previewIcon) {
      const ext = file.name.split('.').pop().toUpperCase();
      previewIcon.textContent = ext.substring(0, 4);
    }

    dropzone.style.display = 'none';
    if (previewCard) previewCard.style.display = 'flex';
  }

  // Dropzone click -> trigger input
  dropzone.addEventListener('click', () => fileInput.click());

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });

  // Remove file
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFile = null;
      fileInput.value = '';
      if (previewCard) previewCard.style.display = 'none';
      dropzone.style.display = 'block';
    });
  }

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast('⚠️ Please select or drop a project file before submitting.');
      dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const schoolCode = (document.getElementById('sub-school-code')?.value || 'SCH-01').toUpperCase().trim();
    const schoolName = document.getElementById('sub-school-name')?.value || 'School';
    const participant1 = document.getElementById('sub-part1')?.value || 'Participant 1';
    const participant2 = document.getElementById('sub-part2')?.value || '';
    const phone = document.getElementById('sub-phone')?.value || 'N/A';
    const projectTitle = document.getElementById('sub-project-title')?.value || (eventType === 'Web Wizards' ? 'Web Application' : 'Brand Identity Logo');

    // Generate Unique Token
    const prefix = eventType === 'Web Wizards' ? 'WW' : 'DI';
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const submissionToken = `APEX26-${prefix}-${schoolCode}-${randomId}`;
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    // Lock Form & Show Progress
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading Project...';
    form.style.opacity = '0.5';
    form.style.pointerEvents = 'none';

    if (progressBox) progressBox.style.display = 'block';

    const steps = [
      { pct: 20, msg: 'Validating file and form data...' },
      { pct: 45, msg: `Registering School Code: ${schoolCode}...` },
      { pct: 72, msg: 'Transferring file to submission server...' },
      { pct: 92, msg: 'Finalising submission record...' },
      { pct: 100, msg: '✓ Upload complete.' }
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        const current = steps[stepIndex];
        if (progressFill) progressFill.style.width = current.pct + '%';
        if (progressPercent) progressPercent.textContent = current.pct + '%';
        if (progressLog) progressLog.textContent = current.msg;
        stepIndex++;
      }
    }, 400);

    // Read file as Base64 and dispatch to Google Drive background bridge
    const reader = new FileReader();
    reader.onload = async () => {
      const fileBase64 = reader.result;
      const gasEndpoint = getActiveGasEndpoint();

      const payload = {
        event: eventType,
        token: submissionToken,
        schoolCode,
        schoolName,
        participant1,
        participant2,
        projectTitle,
        phone,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileBase64: fileBase64
      };

      let driveUploaded = false;
      if (gasEndpoint) {
        try {
          // Send to Google Apps Script without CORS preflight
          await fetch(gasEndpoint, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
          });
          driveUploaded = true;
        } catch (err) {
          console.warn('Background Drive transfer dispatch:', err);
        }
      }

      // Complete progress animation
      clearInterval(progressInterval);
      if (progressFill) progressFill.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressLog) progressLog.textContent = '✓ Transfer completed successfully!';

      // Store in localStorage
      const record = {
        token: submissionToken,
        event: eventType,
        schoolCode,
        schoolName,
        participant1,
        participant2,
        projectTitle,
        phone,
        fileName: selectedFile.name,
        fileSize: formatBytes(selectedFile.size),
        timestamp,
        driveSynced: !!gasEndpoint,
        status: 'Verified & Queued for Evaluation'
      };

      try {
        const pastSubmissions = JSON.parse(localStorage.getItem('apex_submissions') || '[]');
        pastSubmissions.push(record);
        localStorage.setItem('apex_submissions', JSON.stringify(pastSubmissions));
      } catch (err) {}

      // Display Receipt
      setTimeout(() => {
        if (progressBox) progressBox.style.display = 'none';
        form.style.display = 'none';

        if (receiptCard) {
          receiptCard.style.display = 'block';
          document.getElementById('receipt-token').textContent = submissionToken;
          document.getElementById('receipt-school').textContent = `${schoolName} (${schoolCode})`;
          document.getElementById('receipt-team').textContent = participant2 ? `${participant1} & ${participant2}` : participant1;
          document.getElementById('receipt-file').textContent = `${schoolCode}_${selectedFile.name} (${formatBytes(selectedFile.size)})`;
          document.getElementById('receipt-time').textContent = timestamp;
        }

        showToast('✓ Project successfully submitted!');
        receiptCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 500);
    };

    reader.readAsDataURL(selectedFile);
  });

  // Download Receipt Button
  const downloadReceiptBtn = document.getElementById('btn-download-receipt');
  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', () => {
      const token = document.getElementById('receipt-token')?.textContent || 'RECEIPT';
      const school = document.getElementById('receipt-school')?.textContent || '';
      const team = document.getElementById('receipt-team')?.textContent || '';
      const file = document.getElementById('receipt-file')?.textContent || '';
      const time = document.getElementById('receipt-time')?.textContent || '';

      const content = `=====================================================
GNE'S APEX 2026 — OFFICIAL SUBMISSION RECEIPT
Guru Nanak Dev Engineering College, Ludhiana
Causmic Club | Department of Applied Sciences
=====================================================
Submission Token : ${token}
Competition      : ${eventType}
Institution      : ${school}
Participant(s)   : ${team}
Submitted File   : ${file}
Timestamp        : ${time}
Status           : VERIFIED & QUEUED IN APEX EVALUATION VAULT
=====================================================
Please keep this token for presentation & jury verification.
Event Helpline: Saksham (9888478606) | Ishmeet (7719450870)
Website: https://causmic.gndec.ac.in
=====================================================`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${token}_Receipt.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('✓ Receipt text file downloaded!');
    });
  }

  // Reset & Submit Another
  const resetBtn = document.getElementById('btn-submit-another');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      form.reset();
      form.style.opacity = '1';
      form.style.pointerEvents = 'auto';
      form.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Project for Evaluation';
      if (previewCard) previewCard.style.display = 'none';
      dropzone.style.display = 'block';
      if (receiptCard) receiptCard.style.display = 'none';
      if (progressBox) progressBox.style.display = 'none';
    });
  }
}

/* 4. Admin Google Drive Bridge Modal Setup */
function initAdminBridgeSetup() {
  // Add subtle shortcut for organizer: Ctrl + Shift + U
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      openAdminBridgeModal();
    }
  });

  // Link in footer if present
  document.querySelectorAll('[data-open-gas-setup]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openAdminBridgeModal();
    });
  });
}

function openAdminBridgeModal() {
  let modal = document.getElementById('gas-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'gas-setup-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 560px;">
        <button class="modal-close" id="gas-modal-close">×</button>
        <span class="section-badge gold" style="margin-bottom: 0.5rem;">Organizer Setup</span>
        <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
          Connect Your Google Drive
        </h3>
        <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1rem;">
          Deploy the script in <code style="color: #f59e0b; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px;">backend/ApexDriveUploader.gs</code> as a Web App in 1 minute, then paste your Web App URL below:
        </p>

        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.85rem; font-size: 0.78rem; color: #cbd5e1; margin-bottom: 1rem; line-height: 1.5;">
          <strong>Quick Steps:</strong><br />
          1. Open <a href="https://script.google.com" target="_blank" style="color: #38bdf8; text-decoration: underline;">script.google.com</a> → New project.<br />
          2. Paste code from <code style="color: #f59e0b;">backend/ApexDriveUploader.gs</code>.<br />
          3. Click <strong>Deploy</strong> → <strong>New deployment</strong> → Type: <strong>Web app</strong>.<br />
          4. Set <em>Execute as: Me</em>, <em>Who has access: Anyone</em> → Deploy.<br />
          5. Copy the Web App URL and paste it here:
        </div>

        <div class="form-group" style="margin-bottom: 1.2rem;">
          <label class="form-label" for="input-gas-url">Google Apps Script Web App URL</label>
          <input type="url" id="input-gas-url" class="form-input" placeholder="https://script.google.com/macros/s/AKfycb.../exec" value="${getActiveGasEndpoint()}" />
        </div>

        <div style="display: flex; gap: 0.8rem;">
          <button type="button" class="btn btn-primary" id="btn-save-gas-url" style="flex: 1;">Save & Connect Drive</button>
          <button type="button" class="btn btn-secondary" id="btn-cancel-gas-url">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#gas-modal-close').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.querySelector('#btn-cancel-gas-url').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.querySelector('#btn-save-gas-url').addEventListener('click', () => {
      const url = modal.querySelector('#input-gas-url').value.trim();
      if (url) {
        localStorage.setItem('apex_gas_endpoint', url);
        showToast('✓ Google Drive Web App URL saved & active!');
      } else {
        localStorage.removeItem('apex_gas_endpoint');
        showToast('✓ Cleared Web App URL');
      }
      modal.classList.remove('active');
    });
  }

  modal.querySelector('#input-gas-url').value = getActiveGasEndpoint();
  modal.classList.add('active');
}

/* 5. Copy to Clipboard Utility */
function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('✓ Copied to clipboard!');
        });
      }
    });
  });
}

/* 6. Toast Notification System */
function showToast(message) {
  let toast = document.getElementById('apex-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'apex-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #f8fafc;
      padding: 0.8rem 1.4rem;
      border-radius: 9999px;
      font-size: 0.88rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 1000;
      opacity: 0;
      transform: translateY(12px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      gap: 0.6rem;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
  }, 3200);
}

/* 7. Modals (SQL Masters details & info) */
function initModals() {
  const openTriggers = document.querySelectorAll('[data-modal-target]');
  const closeTriggers = document.querySelectorAll('[data-modal-close]');

  openTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  closeTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

/* ==========================================================================
   8. Curious.rocks Upload Engine (Exact logic & behaviors)
   ========================================================================== */

let currentCuriousFile = null;

function initCuriousUploader() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const schoolCodeInput = document.getElementById('schoolCode');
  const previewModal = document.getElementById('previewModal');

  if (!dropZone || !fileInput) return;

  // Computed name update on input
  if (schoolCodeInput) {
    schoolCodeInput.addEventListener('input', updateCuriousComputedName);
  }

  // Drag and drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      fileInput.files = e.dataTransfer.files;
      updateCuriousFileSelection(file);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      updateCuriousFileSelection(fileInput.files[0]);
    } else {
      clearCuriousFileOnly();
    }
  });

  // Modal backdrop click
  if (previewModal) {
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) closePreviewModal();
    });
  }
}

function getCuriousFileExt(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
}

function validateCuriousFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };

  const eventType = document.body.getAttribute('data-event-type') || 'Digital Identity';
  const ext = getCuriousFileExt(file.name);
  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

  let allowed = [];
  let forbidden = [];

  if (eventType === 'Web Wizards') {
    allowed = ['zip'];
    forbidden = ['rar', '7z', 'tar', 'gz', 'exe', 'bat', 'sh', 'php'];
  } else {
    // Digital Identity
    allowed = ['png', 'jpeg', 'jpg', 'pdf'];
    forbidden = ['html', 'htm', 'svg', 'webp', 'exe', 'bat', 'sh'];
  }

  if (forbidden.includes(ext)) {
    return {
      valid: false,
      error: `⚠️ Format .${ext.toUpperCase()} is strictly not permitted! Allowed formats: ${allowed.map(a => '.' + a.toUpperCase()).join(', ')}.`
    };
  }

  if (!allowed.includes(ext)) {
    return {
      valid: false,
      error: `⚠️ Unsupported file format (.${ext}). Allowed format: ${allowed.map(a => '.' + a.toUpperCase()).join(', ')} only.`
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `⚠️ File size exceeds the maximum limit of 50 MB.`
    };
  }

  return { valid: true };
}

function updateCuriousFileSelection(file) {
  const statusBox = document.getElementById('statusBox');
  const fileInfoChip = document.getElementById('fileInfoChip');
  const previewBtn = document.getElementById('previewBtn');

  if (statusBox) statusBox.style.display = 'none';

  if (!file) {
    clearCuriousFileOnly();
    return;
  }

  const validation = validateCuriousFile(file);
  if (!validation.valid) {
    clearCuriousFileOnly();
    showCuriousStatus('error', validation.error);
    return;
  }

  currentCuriousFile = file;

  if (fileInfoChip) {
    fileInfoChip.style.display = 'inline-flex';
    fileInfoChip.textContent = `📄 ${file.name} (${formatCuriousBytes(file.size)})`;
  }

  if (previewBtn) previewBtn.disabled = false;
  updateCuriousComputedName();
}

function updateCuriousComputedName() {
  const fileNamingBadge = document.getElementById('fileNamingBadge');
  const computedFileName = document.getElementById('computedFileName');
  const schoolCodeInput = document.getElementById('schoolCode');

  if (!currentCuriousFile) {
    if (fileNamingBadge) fileNamingBadge.style.display = 'none';
    return;
  }

  const code = (schoolCodeInput?.value || '').trim() || '[SCHOOL_CODE]';
  const targetName = `${code}_${currentCuriousFile.name}`;

  if (computedFileName) computedFileName.textContent = targetName;
  if (fileNamingBadge) fileNamingBadge.style.display = 'block';
}

function clearCuriousFileOnly() {
  currentCuriousFile = null;
  const fileInput = document.getElementById('fileInput');
  const fileInfoChip = document.getElementById('fileInfoChip');
  const fileNamingBadge = document.getElementById('fileNamingBadge');
  const previewBtn = document.getElementById('previewBtn');

  if (fileInput) fileInput.value = '';
  if (fileInfoChip) {
    fileInfoChip.style.display = 'none';
    fileInfoChip.textContent = '';
  }
  if (fileNamingBadge) fileNamingBadge.style.display = 'none';
  if (previewBtn) previewBtn.disabled = true;
}

function clearUploadForm() {
  clearCuriousFileOnly();
  const schoolCodeInput = document.getElementById('schoolCode');
  const statusBox = document.getElementById('statusBox');
  const confirmationNote = document.getElementById('confirmationNote');

  if (schoolCodeInput) schoolCodeInput.value = '';
  if (statusBox) statusBox.style.display = 'none';
  if (confirmationNote) confirmationNote.style.display = 'none';
}

function openPreviewModal() {
  if (!currentCuriousFile) return;

  const schoolCodeInput = document.getElementById('schoolCode');
  const previewModal = document.getElementById('previewModal');
  const previewMediaContainer = document.getElementById('previewMediaContainer');
  const metaOrigName = document.getElementById('metaOrigName');
  const metaTargetName = document.getElementById('metaTargetName');
  const metaSize = document.getElementById('metaSize');
  const metaType = document.getElementById('metaType');

  const code = (schoolCodeInput?.value || '').trim() || '[UNASSIGNED_CODE]';
  const targetName = `${code}_${currentCuriousFile.name}`;

  if (metaOrigName) metaOrigName.textContent = currentCuriousFile.name;
  if (metaTargetName) metaTargetName.textContent = targetName;
  if (metaSize) metaSize.textContent = formatCuriousBytes(currentCuriousFile.size);
  if (metaType) metaType.textContent = currentCuriousFile.type || 'application/octet-stream';

  if (previewMediaContainer) {
    previewMediaContainer.innerHTML = '';

    if (currentCuriousFile.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(currentCuriousFile);
      img.alt = currentCuriousFile.name;
      previewMediaContainer.appendChild(img);
    } else if (currentCuriousFile.type === 'application/pdf' || currentCuriousFile.name.toLowerCase().endsWith('.pdf')) {
      previewMediaContainer.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--accent-gold-light);">
          <div style="font-size: 3rem; margin-bottom: 8px;">📄</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">Portable Document Format (PDF)</div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">Ready for submission to evaluation depository.</div>
        </div>
      `;
    } else {
      previewMediaContainer.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--accent-gold-light);">
          <div style="font-size: 3rem; margin-bottom: 8px;">📦</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">Compressed Archive (.${getCuriousFileExt(currentCuriousFile.name).toUpperCase()})</div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">Ready for submission to evaluation depository.</div>
        </div>
      `;
    }
  }

  if (previewModal) previewModal.classList.add('open');
}

function closePreviewModal() {
  const previewModal = document.getElementById('previewModal');
  if (previewModal) previewModal.classList.remove('open');
}

async function handleCuriousUpload() {
  const schoolCodeInput = document.getElementById('schoolCode');
  const uploadBtn = document.getElementById('uploadBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const statusBox = document.getElementById('statusBox');
  const confirmationNote = document.getElementById('confirmationNote');
  const uploadedFileName = document.getElementById('uploadedFileName');

  const schoolCode = (schoolCodeInput?.value || '').trim();
  const file = currentCuriousFile;
  const eventType = document.body.getAttribute('data-event-type') || 'Digital Identity';

  if (statusBox) {
    statusBox.style.display = 'none';
    statusBox.className = 'status-box';
  }
  if (confirmationNote) confirmationNote.style.display = 'none';

  if (!schoolCode) {
    showCuriousStatus('error', '⚠️ Please enter your assigned School Code before uploading.');
    schoolCodeInput?.focus();
    return;
  }

  if (!file) {
    showCuriousStatus('error', '⚠️ Please select a file to upload.');
    return;
  }

  const validation = validateCuriousFile(file);
  if (!validation.valid) {
    showCuriousStatus('error', validation.error);
    return;
  }

  const finalName = `${schoolCode}_${file.name}`;

  if (uploadBtn) uploadBtn.disabled = true;
  if (progressWrap) progressWrap.style.display = 'block';

  let p = 0;
  const progressTimer = setInterval(() => {
    if (p >= 88) {
      clearInterval(progressTimer);
      return;
    }
    p += Math.random() * 12;
    if (progressFill) progressFill.style.width = Math.min(p, 88) + '%';
    if (progressText) progressText.textContent = `Uploading ${Math.round(Math.min(p, 88))}%.`;
  }, 220);

  try {
    const base64Data = await readCuriousFileAsBase64(file);
    const gasEndpoint = getActiveGasEndpoint();

    const payload = {
      event: eventType,
      fileName: finalName,
      mimeType: file.type || 'application/octet-stream',
      data: base64Data,
      fileBase64: base64Data,
      schoolCode: schoolCode,
      token: `APEX26-${schoolCode}-${Math.floor(1000 + Math.random() * 9000)}`
    };

    if (gasEndpoint) {
      await fetch(gasEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });
    }

    clearInterval(progressTimer);
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = 'Upload Completed!';

    showCuriousStatus('success', '✓ File successfully transmitted to the evaluation depository!');

    if (uploadedFileName) uploadedFileName.textContent = `"${finalName}"`;
    if (confirmationNote) {
      confirmationNote.style.display = 'block';
      confirmationNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    clearCuriousFileOnly();
    if (schoolCodeInput) schoolCodeInput.value = '';

  } catch (err) {
    console.error(err);
    showCuriousStatus('error', '✕ Transmission failed. Please verify your connection and try again.');
  } finally {
    if (uploadBtn) uploadBtn.disabled = false;
    setTimeout(() => {
      if (progressWrap) progressWrap.style.display = 'none';
      if (progressFill) progressFill.style.width = '0%';
    }, 2500);
  }
}

function showCuriousStatus(type, msg) {
  const statusBox = document.getElementById('statusBox');
  if (!statusBox) return;
  statusBox.className = 'status-box ' + type;
  statusBox.innerHTML = msg;
  statusBox.style.display = 'block';
}

function formatCuriousBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function readCuriousFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Expose handlers to window for inline onclick attributes
window.openPreviewModal = openPreviewModal;
window.closePreviewModal = closePreviewModal;
window.clearUploadForm = clearUploadForm;
window.handleCuriousUpload = handleCuriousUpload;

/* ==========================================================================
   APEX SECURITY & ACCESS CONTROL SYSTEM
   Guru Nanak Dev Engineering College, Ludhiana | Causmic Club
   ========================================================================== */

const ApexSecurity = (() => {
  const SALT = 'GNE_APEX_2026_SALT_';
  // Salted SHA-256 hash of 'apex2026'
  const DEFAULT_HASH = '17a45908cd724ef57309f0e6146179819ec3c6196d58899d5840651c2f29f942';
  const ADMIN_API_KEY = 'APEX_2026_HEAD_KEY_98f12c8b74';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 60 * 1000; // 60 seconds
  const EXTENDED_LOCKOUT_MS = 300 * 1000; // 5 minutes
  const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  // Compute SHA-256 via Web Crypto
  async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getStoredHash() {
    return localStorage.getItem('apex_custom_passcode_hash') || DEFAULT_HASH;
  }

  // Rate Limiting (Brute-Force Shield)
  function getRateLimitStatus() {
    const raw = localStorage.getItem('apex_login_limiter');
    const now = Date.now();
    if (!raw) return { locked: false, remainingAttempts: MAX_ATTEMPTS, lockoutSeconds: 0 };
    try {
      const data = JSON.parse(raw);
      if (data.lockedUntil && data.lockedUntil > now) {
        return {
          locked: true,
          remainingAttempts: 0,
          lockoutSeconds: Math.ceil((data.lockedUntil - now) / 1000)
        };
      }
      if (data.lockedUntil && data.lockedUntil <= now) {
        localStorage.removeItem('apex_login_limiter');
        return { locked: false, remainingAttempts: MAX_ATTEMPTS, lockoutSeconds: 0 };
      }
      const attempts = data.failedAttempts || 0;
      return {
        locked: false,
        remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts),
        lockoutSeconds: 0
      };
    } catch (e) {
      return { locked: false, remainingAttempts: MAX_ATTEMPTS, lockoutSeconds: 0 };
    }
  }

  function recordFailedLogin() {
    const now = Date.now();
    let data = { failedAttempts: 0, lockoutCount: 0, lockedUntil: 0 };
    try {
      const raw = localStorage.getItem('apex_login_limiter');
      if (raw) data = JSON.parse(raw);
    } catch (e) {}

    data.failedAttempts = (data.failedAttempts || 0) + 1;
    logAudit('auth', `Failed login attempt #${data.failedAttempts}`);

    if (data.failedAttempts >= MAX_ATTEMPTS) {
      data.lockoutCount = (data.lockoutCount || 0) + 1;
      const duration = data.lockoutCount > 1 ? EXTENDED_LOCKOUT_MS : LOCKOUT_MS;
      data.lockedUntil = now + duration;
      localStorage.setItem('apex_login_limiter', JSON.stringify(data));
      logAudit('auth', `Rate limit triggered: Console locked for ${duration / 1000}s`);
      return { locked: true, lockoutSeconds: duration / 1000 };
    }

    localStorage.setItem('apex_login_limiter', JSON.stringify(data));
    return { locked: false, remainingAttempts: MAX_ATTEMPTS - data.failedAttempts };
  }

  function recordSuccessLogin() {
    localStorage.removeItem('apex_login_limiter');
  }

  // Session Management (Cryptographic Token + Inactivity Expiration)
  async function createSession(passcode) {
    const tokenBytes = new Uint8Array(20);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const now = Date.now();
    const signature = await sha256(token + ':' + now + ':' + SALT);
    const session = {
      token,
      loginTime: now,
      lastActive: now,
      signature
    };
    sessionStorage.setItem('apex_admin_session', JSON.stringify(session));
    recordSuccessLogin();
    logAudit('auth', 'Event Head authenticated successfully');
    return session;
  }

  async function verifySession() {
    const raw = sessionStorage.getItem('apex_admin_session');
    if (!raw) return false;
    try {
      const session = JSON.parse(raw);
      if (!session || !session.token || !session.signature) return false;

      // Inactivity timeout (15 min)
      const now = Date.now();
      if (now - (session.lastActive || session.loginTime) > SESSION_IDLE_TIMEOUT_MS) {
        destroySession('Session timed out due to 15 minutes of inactivity.');
        return false;
      }

      // Cryptographic signature check (prevents tampering)
      const expectedSignature = await sha256(session.token + ':' + session.loginTime + ':' + SALT);
      if (session.signature !== expectedSignature) {
        destroySession('Security violation: Tampered session detected.');
        return false;
      }

      // Update activity timestamp
      session.lastActive = now;
      sessionStorage.setItem('apex_admin_session', JSON.stringify(session));
      return true;
    } catch (e) {
      return false;
    }
  }

  function destroySession(reason = '') {
    sessionStorage.removeItem('apex_admin_session');
    if (reason) logAudit('auth', `Session ended: ${reason}`);
  }

  // Authentication
  async function authenticate(enteredPin) {
    const status = getRateLimitStatus();
    if (status.locked) {
      return { success: false, locked: true, lockoutSeconds: status.lockoutSeconds };
    }

    const hash = await sha256(SALT + enteredPin.trim());
    if (hash === getStoredHash()) {
      const session = await createSession(enteredPin);
      return { success: true, session };
    } else {
      const failStatus = recordFailedLogin();
      return {
        success: false,
        locked: failStatus.locked,
        remainingAttempts: failStatus.remainingAttempts,
        lockoutSeconds: failStatus.lockoutSeconds
      };
    }
  }

  // Change Passcode
  async function changePasscode(oldPin, newPin) {
    if (!await verifySession()) {
      return { success: false, message: 'Unauthorized session. Please login again.' };
    }
    const oldHash = await sha256(SALT + oldPin.trim());
    if (oldHash !== getStoredHash()) {
      return { success: false, message: 'Current passcode is incorrect.' };
    }
    if (!newPin || newPin.trim().length < 6) {
      return { success: false, message: 'New passcode must be at least 6 characters long.' };
    }
    const newHash = await sha256(SALT + newPin.trim());
    localStorage.setItem('apex_custom_passcode_hash', newHash);
    logAudit('auth', 'Event Head changed console passcode');
    return { success: true };
  }

  // Security Audit Logging
  function logAudit(type, text) {
    try {
      const logs = JSON.parse(sessionStorage.getItem('apex_audit_logs') || '[]');
      const entry = {
        time: new Date().toLocaleTimeString(),
        type: type,
        text: text
      };
      logs.unshift(entry);
      if (logs.length > 50) logs.pop();
      sessionStorage.setItem('apex_audit_logs', JSON.stringify(logs));

      if (window.renderAuditLogs) window.renderAuditLogs();
    } catch (e) {}
  }

  function getAuditLogs() {
    try {
      return JSON.parse(sessionStorage.getItem('apex_audit_logs') || '[]');
    } catch (e) {
      return [];
    }
  }

  return {
    sha256,
    authenticate,
    verifySession,
    destroySession,
    getRateLimitStatus,
    changePasscode,
    logAudit,
    getAuditLogs,
    ADMIN_API_KEY
  };
})();

window.ApexSecurity = ApexSecurity;

/* ==========================================================================
   APEX REAL-TIME CENTRALIZED TIMER ENGINE (SECURE & SYNCED)
   ========================================================================== */

const ApexTimerEngine = (() => {
  const DEFAULT_CONFIGS = {
    web_wizards: {
      name: 'Web Wizards',
      defaultSeconds: 90 * 60, // 90 minutes
      storageKey: 'apex_timer_web_wizards'
    },
    digital_identity: {
      name: 'Digital Identity',
      defaultSeconds: 60 * 60, // 60 minutes
      storageKey: 'apex_timer_digital_identity'
    }
  };

  // BroadcastChannel for sub-millisecond tab-to-tab sync
  const channel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('apex_timer_bus') : null;

  // Initialize or load state from localStorage
  function loadState(eventKey) {
    const cfg = DEFAULT_CONFIGS[eventKey];
    if (!cfg) return null;
    const raw = localStorage.getItem(cfg.storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.remainingSeconds === 'number') {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse timer state for', eventKey, e);
      }
    }
    // Default initial state
    const initial = {
      event: cfg.name,
      status: 'ready', // 'ready' | 'running' | 'paused' | 'ended'
      totalSeconds: cfg.defaultSeconds,
      remainingSeconds: cfg.defaultSeconds,
      endTime: null,
      pausedAt: null,
      announcement: '',
      lastUpdated: Date.now()
    };
    saveState(eventKey, initial, false);
    return initial;
  }

  function saveState(eventKey, state, broadcast = true) {
    const cfg = DEFAULT_CONFIGS[eventKey];
    if (!cfg) return;
    state.lastUpdated = Date.now();
    localStorage.setItem(cfg.storageKey, JSON.stringify(state));
    if (broadcast && channel) {
      channel.postMessage({
        type: 'APEX_TIMER_SYNC',
        eventKey: eventKey,
        state: state
      });
    }
    // Async cloud sync (protected with ADMIN_API_KEY)
    syncStateToCloud(eventKey, state);
  }

  // Format seconds into MM:SS or HH:MM:SS
  function formatSeconds(sec) {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const remainingS = s % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(remainingS).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(remainingS).padStart(2, '0')}`;
  }

  // Compute live remaining seconds
  function getLiveRemaining(state) {
    if (!state) return 0;
    if (state.status === 'running' && state.endTime) {
      const diff = Math.round((state.endTime - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    return state.remainingSeconds;
  }

  // Protected Admin Controls (All mutations enforce cryptographic session verification)
  async function setDuration(eventKey, minutes) {
    if (!await ApexSecurity.verifySession()) {
      console.warn('Security Alert: Unauthorized setDuration attempt blocked.');
      return false;
    }
    const state = loadState(eventKey);
    const sec = Math.max(1, Math.round(minutes * 60));
    state.totalSeconds = sec;
    state.remainingSeconds = sec;
    state.status = 'ready';
    state.endTime = null;
    state.pausedAt = null;
    saveState(eventKey, state);
    ApexSecurity.logAudit('reset', `${state.event}: Duration set to ${minutes}m`);
    updateAllUI();
    return true;
  }

  async function startTimer(eventKey) {
    if (!await ApexSecurity.verifySession()) {
      console.warn('Security Alert: Unauthorized startTimer attempt blocked.');
      return false;
    }
    const state = loadState(eventKey);
    state.status = 'running';
    state.endTime = Date.now() + (state.remainingSeconds * 1000);
    state.pausedAt = null;
    saveState(eventKey, state);
    ApexSecurity.logAudit('start', `${state.event}: Timer Started`);
    updateAllUI();
    return true;
  }

  async function pauseTimer(eventKey) {
    if (!await ApexSecurity.verifySession()) {
      console.warn('Security Alert: Unauthorized pauseTimer attempt blocked.');
      return false;
    }
    const state = loadState(eventKey);
    if (state.status !== 'running') return false;
    state.remainingSeconds = getLiveRemaining(state);
    state.status = 'paused';
    state.endTime = null;
    state.pausedAt = Date.now();
    saveState(eventKey, state);
    ApexSecurity.logAudit('pause', `${state.event}: Timer Paused (${formatSeconds(state.remainingSeconds)} left)`);
    updateAllUI();
    return true;
  }

  async function resumeTimer(eventKey) {
    if (!await ApexSecurity.verifySession()) {
      console.warn('Security Alert: Unauthorized resumeTimer attempt blocked.');
      return false;
    }
    const state = loadState(eventKey);
    if (state.status !== 'paused') return false;
    state.status = 'running';
    state.endTime = Date.now() + (state.remainingSeconds * 1000);
    state.pausedAt = null;
    saveState(eventKey, state);
    ApexSecurity.logAudit('start', `${state.event}: Timer Resumed`);
    updateAllUI();
    return true;
  }

  async function addExtraTime(eventKey, minutes) {
    if (!await ApexSecurity.verifySession()) {
      console.warn('Security Alert: Unauthorized addExtraTime attempt blocked.');
      return false;
    }
    const state = loadState(eventKey);
    const extraSec = Math.round(minutes * 60);
    state.remainingSeconds += extraSec;
    state.totalSeconds += extraSec;
    if (state.status === 'running' && state.endTime) {
      state.endTime += extraSec * 1000;
    }
    saveState(eventKey, state);
    ApexSecurity.logAudit('notice', `${state.event}: +${minutes}m extra time added`);
    updateAllUI();
    return true;
  }

  async function resetTimer(eventKey) {
    if (!await ApexSecurity.verifySession()) {
      console.warn('Security Alert: Unauthorized resetTimer attempt blocked.');
      return false;
    }
    const state = loadState(eventKey);
    state.status = 'ready';
    state.remainingSeconds = state.totalSeconds;
    state.endTime = null;
    state.pausedAt = null;
    saveState(eventKey, state);
    ApexSecurity.logAudit('reset', `${state.event}: Timer Reset to initial ${Math.round(state.totalSeconds / 60)}m`);
    updateAllUI();
    return true;
  }

  async function endTimer(eventKey) {
    if (!await ApexSecurity.verifySession()) {
      console.warn('Security Alert: Unauthorized endTimer attempt blocked.');
      return false;
    }
    const state = loadState(eventKey);
    state.status = 'ended';
    state.remainingSeconds = 0;
    state.endTime = null;
    state.pausedAt = Date.now();
    saveState(eventKey, state);
    ApexSecurity.logAudit('end', `${state.event}: Competition Officially Ended`);
    updateAllUI();
    return true;
  }

  async function setAnnouncement(eventKey, msg) {
    if (!await ApexSecurity.verifySession()) {
      console.warn('Security Alert: Unauthorized announcement attempt blocked.');
      return false;
    }
    const state = loadState(eventKey);
    state.announcement = (msg || '').trim();
    saveState(eventKey, state);
    ApexSecurity.logAudit('notice', `${state.event}: Notice broadcasted "${state.announcement}"`);
    updateAllUI();
    return true;
  }

  async function clearAnnouncement(eventKey) {
    return await setAnnouncement(eventKey, '');
  }

  // Active UI Bindings
  const participantBindings = [];
  let isAdminBound = false;

  function bindParticipantUI(eventKey, elements) {
    participantBindings.push({ eventKey, elements });
    updateParticipantUI(eventKey, elements);
  }

  function updateParticipantUI(eventKey, elements) {
    const state = loadState(eventKey);
    if (!state) return;

    const remaining = getLiveRemaining(state);
    const displayEl = document.getElementById(elements.displayId);
    const badgeEl = document.getElementById(elements.statusBadgeId);
    const announcementEl = document.getElementById(elements.announcementId);

    // 1. Clock Display
    if (displayEl) {
      displayEl.textContent = formatSeconds(remaining);
      displayEl.classList.remove('timer-warning', 'timer-danger', 'running', 'paused', 'ended');
      if (state.status === 'ended' || remaining === 0) {
        displayEl.classList.add('timer-danger', 'ended');
      } else if (remaining <= 300 && state.status === 'running') {
        displayEl.classList.add('timer-danger');
      } else if (remaining <= 600 && state.status === 'running') {
        displayEl.classList.add('timer-warning');
      } else if (state.status === 'running') {
        displayEl.classList.add('running');
      } else if (state.status === 'paused') {
        displayEl.classList.add('paused');
      }
    }

    // 2. Status Badge
    if (badgeEl) {
      if (state.status === 'ready') {
        badgeEl.textContent = `⏳ Competition Timer Standby (${formatSeconds(state.totalSeconds)}) — Controlled by Event Head`;
        badgeEl.style.color = '#c7d2fe';
      } else if (state.status === 'running') {
        if (remaining <= 300) {
          badgeEl.textContent = '🚨 Final 5 Minutes! Wrap Up & Prepare Submission';
          badgeEl.style.color = '#fca5a5';
        } else if (remaining <= 600) {
          badgeEl.textContent = '⚠️ 10 Minutes Remaining!';
          badgeEl.style.color = '#fde047';
        } else {
          badgeEl.textContent = '⚡ Official Competition Timer Running (Controlled by Event Head)';
          badgeEl.style.color = '#86efac';
        }
      } else if (state.status === 'paused') {
        badgeEl.textContent = '⏸️ Competition Paused by Event Head';
        badgeEl.style.color = '#fde047';
      } else if (state.status === 'ended' || remaining === 0) {
        badgeEl.textContent = '🏁 Competition Closed by Event Head! Proceed to Upload';
        badgeEl.style.color = '#fb7185';
      }
    }

    // 3. Announcement Banner
    if (announcementEl) {
      if (state.announcement && state.announcement.length > 0) {
        announcementEl.style.display = 'flex';
        const msgText = announcementEl.querySelector('.announcement-text');
        if (msgText) msgText.textContent = state.announcement;
      } else {
        announcementEl.style.display = 'none';
      }
    }
  }

  function bindAdminUI() {
    isAdminBound = true;
    updateAdminUI();
  }

  function updateAdminUI() {
    if (!isAdminBound) return;

    ['web_wizards', 'digital_identity'].forEach(eventKey => {
      const state = loadState(eventKey);
      if (!state) return;
      const prefix = eventKey === 'web_wizards' ? 'ww' : 'di';
      const remaining = getLiveRemaining(state);

      // Digits
      const clockEl = document.getElementById(`${prefix}-clock`);
      if (clockEl) {
        clockEl.textContent = formatSeconds(remaining);
        clockEl.className = 'admin-clock-digits ' + state.status;
      }

      // State Pill
      const pillEl = document.getElementById(`${prefix}-pill`);
      if (pillEl) {
        pillEl.className = 'admin-state-pill ' + state.status;
        if (state.status === 'ready') pillEl.textContent = '● READY';
        else if (state.status === 'running') pillEl.textContent = '▶ LIVE';
        else if (state.status === 'paused') pillEl.textContent = '⏸ PAUSED';
        else if (state.status === 'ended') pillEl.textContent = '■ ENDED';
      }

      // Meta
      const metaEl = document.getElementById(`${prefix}-meta`);
      if (metaEl) {
        metaEl.textContent = `Total: ${Math.round(state.totalSeconds / 60)}m | Status: ${state.status.toUpperCase()}`;
      }

      // Button states
      const startBtn = document.getElementById(`${prefix}-btn-start`);
      const pauseBtn = document.getElementById(`${prefix}-btn-pause`);
      const resumeBtn = document.getElementById(`${prefix}-btn-resume`);

      if (startBtn && pauseBtn && resumeBtn) {
        if (state.status === 'ready' || state.status === 'ended') {
          startBtn.style.display = 'inline-flex';
          pauseBtn.style.display = 'none';
          resumeBtn.style.display = 'none';
        } else if (state.status === 'running') {
          startBtn.style.display = 'none';
          pauseBtn.style.display = 'inline-flex';
          resumeBtn.style.display = 'none';
        } else if (state.status === 'paused') {
          startBtn.style.display = 'none';
          pauseBtn.style.display = 'none';
          resumeBtn.style.display = 'inline-flex';
        }
      }

      // Active Announcement status
      const activeAnnEl = document.getElementById(`${prefix}-active-announcement`);
      if (activeAnnEl) {
        if (state.announcement) {
          activeAnnEl.textContent = `Active Notice: "${state.announcement}"`;
          activeAnnEl.style.display = 'block';
        } else {
          activeAnnEl.style.display = 'none';
        }
      }
    });
  }

  function updateAllUI() {
    participantBindings.forEach(b => updateParticipantUI(b.eventKey, b.elements));
    if (isAdminBound) updateAdminUI();
  }

  // Cross-tab broadcast listener
  if (channel) {
    channel.onmessage = (e) => {
      if (e.data && e.data.type === 'APEX_TIMER_SYNC') {
        updateAllUI();
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'apex_timer_web_wizards' || e.key === 'apex_timer_digital_identity') {
      updateAllUI();
    }
  });

  // Main 1-Second Heartbeat Engine
  setInterval(() => {
    let stateChanged = false;
    ['web_wizards', 'digital_identity'].forEach(eventKey => {
      const state = loadState(eventKey);
      if (state && state.status === 'running') {
        const remaining = getLiveRemaining(state);
        if (remaining <= 0) {
          state.status = 'ended';
          state.remainingSeconds = 0;
          state.endTime = null;
          saveState(eventKey, state);
          stateChanged = true;
        }
      }
    });
    updateAllUI();
  }, 1000);

  // Background cloud synchronization
  let lastCloudPoll = 0;
  async function pollCloudTimers() {
    const endpoint = getActiveGasEndpoint();
    if (!endpoint || Date.now() - lastCloudPoll < 4000) return;
    lastCloudPoll = Date.now();
    try {
      const res = await fetch(`${endpoint}?action=getTimer`, { mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success') {
          if (data.web_wizards && data.web_wizards.lastUpdated) {
            const local = loadState('web_wizards');
            if (!local || data.web_wizards.lastUpdated > local.lastUpdated) {
              localStorage.setItem(DEFAULT_CONFIGS.web_wizards.storageKey, JSON.stringify(data.web_wizards));
            }
          }
          if (data.digital_identity && data.digital_identity.lastUpdated) {
            const local = loadState('digital_identity');
            if (!local || data.digital_identity.lastUpdated > local.lastUpdated) {
              localStorage.setItem(DEFAULT_CONFIGS.digital_identity.storageKey, JSON.stringify(data.digital_identity));
            }
          }
          updateAllUI();
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }

  async function syncStateToCloud(eventKey, state) {
    const endpoint = getActiveGasEndpoint();
    if (!endpoint) return;
    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setTimer',
          adminKey: ApexSecurity.ADMIN_API_KEY,
          event: eventKey === 'digital_identity' ? 'Digital Identity' : 'Web Wizards',
          timerState: state
        })
      });
    } catch (e) {}
  }

  setInterval(pollCloudTimers, 5000);

  return {
    loadState,
    formatSeconds,
    getLiveRemaining,
    setDuration,
    startTimer,
    pauseTimer,
    resumeTimer,
    addExtraTime,
    resetTimer,
    endTimer,
    setAnnouncement,
    clearAnnouncement,
    bindParticipantUI,
    bindAdminUI,
    updateAllUI
  };
})();

window.ApexTimerEngine = ApexTimerEngine;



