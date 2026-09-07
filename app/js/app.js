(function() {
  'use strict';

  // ---------- Проверка библиотек ----------
  if (typeof jsQR === 'undefined' && typeof Html5Qrcode === 'undefined') {
    document.getElementById('statusText').textContent = 'Ошибка: библиотеки не загружены. Проверьте файлы.';
    return;
  }

  // ---------- Matrix ----------
  const matrix = document.getElementById('matrix');
  const mctx = matrix.getContext('2d');
  const glyphs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+/@';
  let cols = [], fontSize = 16, DPR = window.devicePixelRatio || 1;
  function resizeMatrix() {
    DPR = window.devicePixelRatio || 1;
    matrix.width = Math.floor(innerWidth * DPR);
    matrix.height = Math.floor(innerHeight * DPR);
    matrix.style.width = innerWidth + 'px';
    matrix.style.height = innerHeight + 'px';
    fontSize = Math.max(14, Math.floor(innerWidth / 120));
    mctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.floor(innerWidth / fontSize);
    cols = [];
    for (let i = 0; i < count; i++) {
      cols.push({
        x: i * fontSize * 1.03 + (Math.random() * 10 - 5),
        y: Math.random() * innerHeight,
        speed: 1 + Math.random() * 2.5,
        charIndex: (Math.random() * glyphs.length) | 0
      });
    }
  }
  function drawMatrix() {
    mctx.fillStyle = 'rgba(0,0,0,0.10)';
    mctx.fillRect(0, 0, innerWidth, innerHeight);
    mctx.font = fontSize + 'px monospace';
    cols.forEach(c => {
      const ch = glyphs[(c.charIndex + (Math.random() * 2 | 0)) % glyphs.length];
      const alpha = 0.25 + Math.random() * 0.45;
      mctx.fillStyle = 'rgba(41,255,79,' + alpha + ')';
      mctx.fillText(ch, c.x, c.y);
      c.y += c.speed * 8;
      c.charIndex = (c.charIndex + 1) % glyphs.length;
      if (c.y > innerHeight + 60) {
        c.y = -Math.random() * 400;
        c.x = (Math.random() * innerWidth) % (innerWidth - fontSize);
      }
    });
    requestAnimationFrame(drawMatrix);
  }
  window.addEventListener('resize', resizeMatrix);
  resizeMatrix();
  drawMatrix();

  // ---------- Локализация ----------
  let currentLang = 'ru';
  let translations = {};

  async function loadLanguage(lang) {
    try {
      const response = await fetch(`/lang/${lang}.json`);
      if (!response.ok) throw new Error('Network response was not ok');
      translations = await response.json();
      applyTranslations();
      document.querySelectorAll('.lang-switch button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
      });
      const st = document.getElementById('statusText');
      const baseMsg = translations.statusReady || 'Ready to scan';
      if (st.textContent === baseMsg || st.textContent === 'Готов к сканированию') {
        st.textContent = translations.statusReady || 'Ready to scan';
      }
      renderHistory();
      checkHttps();
    } catch (err) {
      console.error('Failed to load language:', err);
      if (lang === 'ru') {
        translations = { statusReady: 'Готов к сканированию' };
      } else {
        translations = { statusReady: 'Ready to scan' };
      }
      applyTranslations();
    }
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key] !== undefined) {
        if (key === 'notesText' || key === 'sub' || key === 'supported' || key === 'httpsNotice') {
          el.innerHTML = translations[key];
        } else {
          el.textContent = translations[key];
        }
      }
    });
    const exampleEl = document.getElementById('exampleFormat');
    if (exampleEl && translations.exampleFormat) exampleEl.textContent = translations.exampleFormat;
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[key] !== undefined) el.placeholder = translations[key];
    });
  }

  function setLanguage(lang) {
    currentLang = lang;
    loadLanguage(lang);
  }

  document.getElementById('langRu').addEventListener('click', () => setLanguage('ru'));
  document.getElementById('langEn').addEventListener('click', () => setLanguage('en'));

  // ---------- Переключение вкладок ----------
  const navTabs = document.querySelectorAll('#navTabs span');
  const tabContents = {
    scan: document.getElementById('tabScan'),
    history: document.getElementById('tabHistory')
  };

  function switchTab(tabId) {
    navTabs.forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`#navTabs span[data-tab="${tabId}"]`);
    if (activeTab) activeTab.classList.add('active');
    Object.keys(tabContents).forEach(id => {
      tabContents[id].classList.toggle('active', id === tabId);
    });
    if (tabId === 'history') renderHistory();
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      const tabId = this.dataset.tab;
      if (tabId) switchTab(tabId);
    });
  });

  // ---------- Проверка HTTPS ----------
  function checkHttps() {
    const notice = document.getElementById('httpsNotice');
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecure) {
      notice.classList.add('show');
      document.getElementById('startCameraBtn').disabled = true;
      document.getElementById('startCameraBtn').style.opacity = '0.5';
      document.getElementById('startCameraBtn').style.cursor = 'not-allowed';
    } else {
      notice.classList.remove('show');
      document.getElementById('startCameraBtn').disabled = false;
      document.getElementById('startCameraBtn').style.opacity = '1';
      document.getElementById('startCameraBtn').style.cursor = 'pointer';
    }
  }

  // ---------- DOM ссылки ----------
  const fileInput = document.getElementById('fileInput');
  const scanBox = document.getElementById('scanBox');
  const scanInner = document.getElementById('scanInner');
  const cameraWrap = document.getElementById('cameraWrap');
  const video = document.getElementById('video');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const statusText = document.getElementById('statusText');

  const resultCount = document.getElementById('resultCount');
  const typePill = document.getElementById('typePill');
  const descText = document.getElementById('descText');
  const smdpValue = document.getElementById('smdpValue');
  const activationValue = document.getElementById('activationValue');
  const confirmationValue = document.getElementById('confirmationValue');
  const fullValue = document.getElementById('fullValue');
  const rawValue = document.getElementById('rawValue');

  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const saveHistoryBtn = document.getElementById('saveHistoryBtn');
  const showQrBtn = document.getElementById('showQrBtn');
  const generateQrBtn = document.getElementById('generateQrBtn');
  const clearBtn = document.getElementById('clearBtn');
  const qrContainer = document.getElementById('qrContainer');
  let qrCodeInstance = null;

  // История
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');
  const historySearch = document.getElementById('historySearch');
  const exportHistoryBtn = document.getElementById('exportHistoryBtn');
  const importHistoryBtn = document.getElementById('importHistoryBtn');
  const importFileInput = document.getElementById('importFileInput');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyQrContainer = document.getElementById('historyQrContainer');

  let html5Scanner = null;
  let cameraRunning = false;

  // ---------- API для истории ----------
  const API_BASE = '/api';

  async function getHistory() {
    try {
      const response = await fetch(`${API_BASE}/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return await response.json();
    } catch (e) {
      console.error('Error fetching history:', e);
      return [];
    }
  }

  async function addHistoryEntry(qrText, comment = '') {
    const response = await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr: qrText, comment })
    });
    if (!response.ok) throw new Error('Failed to add history');
    const data = await response.json();
    renderHistory();
    statusText.textContent = translations.statusSaved || 'Saved to history';
    return data;
  }

  async function deleteHistoryEntry(id) {
    const response = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete');
    renderHistory();
  }

  async function updateHistoryComment(id, newComment) {
    const response = await fetch(`${API_BASE}/history/${id}?comment=${encodeURIComponent(newComment)}`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to update comment');
    renderHistory();
  }

  // ---------- Рендеринг истории ----------
  async function renderHistory() {
    if (!historyList) return;
    const search = historySearch ? historySearch.value.toLowerCase() : '';
    let history = await getHistory();
    let filtered = history;
    if (search) {
      filtered = history.filter(item =>
        item.qr.toLowerCase().includes(search) ||
        (item.comment && item.comment.toLowerCase().includes(search))
      );
    }

    if (historyCount) {
      historyCount.textContent = filtered.length + ' ' + (currentLang === 'ru' ? 'записей' : 'records');
    }

    if (filtered.length === 0) {
      historyList.innerHTML = `<div class="history-empty" data-i18n="historyEmpty">${translations.historyEmpty || 'History is empty.'}</div>`;
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const dateStr = new Date(item.date).toLocaleString(currentLang === 'ru' ? 'ru-RU' : 'en-US');
      html += `
        <div class="history-item" data-id="${item.id}">
          <div class="meta">
            <span>${dateStr}</span>
            <span style="color:var(--neon);font-size:12px;">#${item.id}</span>
          </div>
          <div class="qr-text">${escapeHtml(item.qr)}</div>
          <div class="comment" id="comment-${item.id}">
            ${item.comment ? escapeHtml(item.comment) : '<em style="color:#6b7a9c;">' + (currentLang === 'ru' ? 'Нет комментария' : 'No comment') + '</em>'}
          </div>
          <div class="actions">
            <button class="btn-small" onclick="editComment(${item.id})" data-i18n="editComment">${translations.editComment || 'Edit'}</button>
            <button class="btn-small" onclick="showQrFromHistory(${item.id})" data-i18n="showQr">${translations.showQr || 'Show QR'}</button>
            <button class="btn-small danger" onclick="deleteHistoryEntry(${item.id})" data-i18n="deleteRecord">${translations.deleteRecord || 'Delete'}</button>
          </div>
        </div>
      `;
    });
    historyList.innerHTML = html;
    document.querySelectorAll('#historyList [data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key]) el.textContent = translations[key];
    });
  }

  // Глобальные функции для onclick
  window.deleteHistoryEntry = deleteHistoryEntry;
  window.editComment = async function(id) {
    const history = await getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;
    const newComment = prompt(translations.commentPlaceholder || 'Enter comment:', item.comment || '');
    if (newComment !== null) {
      await updateHistoryComment(id, newComment);
    }
  };

  window.showQrFromHistory = async function(id) {
    const history = await getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;
    const container = historyQrContainer;
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '';
    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
          text: item.qr,
          width: 200,
          height: 200,
          colorDark: '#29ff4f',
          colorLight: '#030603',
          correctLevel: QRCode.CorrectLevel.H
        });
        // Кнопка закрытия
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'position:absolute; top:5px; right:10px; background:transparent; border:none; color:var(--neon); font-size:20px; cursor:pointer;';
        container.style.position = 'relative';
        container.appendChild(closeBtn);
        closeBtn.addEventListener('click', function() {
          container.style.display = 'none';
          container.innerHTML = '';
        });
      } else {
        container.innerHTML = '<div style="color:var(--neon);">Библиотека QR не загружена</div>';
      }
    } catch (e) {
      container.innerHTML = '<div style="color:var(--neon);">Ошибка генерации QR</div>';
    }
  };

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---------- Обработчики истории ----------
  if (exportHistoryBtn) {
    exportHistoryBtn.addEventListener('click', async function() {
      const history = await getHistory();
      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'esim-history.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }

  if (importHistoryBtn) {
    importHistoryBtn.addEventListener('click', function() {
      if (importFileInput) importFileInput.click();
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function(ev) {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) {
            for (const item of data) {
              await addHistoryEntry(item.qr, item.comment || '');
            }
            renderHistory();
            statusText.textContent = 'History imported';
          } else {
            alert('Invalid file format');
          }
        } catch (err) {
          alert('Import error: ' + err.message);
        }
      };
      reader.readAsText(file);
      this.value = '';
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async function() {
      if (confirm(translations.clearHistory + '?')) {
        const history = await getHistory();
        for (const item of history) {
          await deleteHistoryEntry(item.id);
        }
        renderHistory();
      }
    });
  }

  if (historySearch) {
    historySearch.addEventListener('input', renderHistory);
  }

  // ---------- Сохранение в историю ----------
  if (saveHistoryBtn) {
    saveHistoryBtn.addEventListener('click', async function() {
      const text = rawValue.value.trim();
      if (!text || text === '—') {
        statusText.textContent = translations.statusNoData || 'No data to save';
        return;
      }
      const comment = prompt(translations.commentPlaceholder || 'Enter comment:', '');
      try {
        await addHistoryEntry(text, comment || '');
      } catch (e) {
        statusText.textContent = 'Error saving history: ' + e.message;
      }
    });
  }

  // ---------- Функция генерации QR (общая) ----------
  function generateQrCode(text, container, toggleBtn) {
    if (container.style.display !== 'none' && qrCodeInstance && toggleBtn) {
      container.style.display = 'none';
      toggleBtn.textContent = translations.showQr || 'Показать QR';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = '';

    try {
      if (typeof QRCode !== 'undefined') {
        qrCodeInstance = new QRCode(container, {
          text: text,
          width: 200,
          height: 200,
          colorDark: '#29ff4f',
          colorLight: '#030603',
          correctLevel: QRCode.CorrectLevel.H
        });
        if (toggleBtn) toggleBtn.textContent = translations.hideQr || 'Скрыть QR';
      } else {
        container.innerHTML = '<div style="color:var(--neon);">Библиотека QR не загружена</div>';
      }
    } catch (e) {
      console.error('QR generation error:', e);
      container.innerHTML = '<div style="color:var(--neon);">Ошибка генерации QR</div>';
    }
  }

  // ---------- Показать/скрыть QR (из поля raw) ----------
  if (showQrBtn) {
    showQrBtn.addEventListener('click', function() {
      const text = rawValue.value.trim();
      if (!text || text === '—') {
        statusText.textContent = translations.statusNoData || 'No data to generate QR';
        return;
      }
      generateQrCode(text, qrContainer, showQrBtn);
    });
  }

  // ---------- Сгенерировать QR из raw ----------
  if (generateQrBtn) {
    generateQrBtn.addEventListener('click', function() {
      const text = rawValue.value.trim();
      if (!text || text === '—') {
        statusText.textContent = translations.statusNoData || 'No data to generate QR';
        return;
      }
      // Если QR уже показан – обновляем его
      if (qrContainer.style.display !== 'none') {
        qrContainer.innerHTML = '';
        qrCodeInstance = null;
      }
      generateQrCode(text, qrContainer, showQrBtn);
    });
  }

  // ---------- Функции декодирования ----------
  function parseEsim(raw) {
    const value = (raw || '').trim();
    if (!value) return { kind: 'empty', raw: '' };
    if (!value.startsWith('LPA:')) return { kind: 'unknown', raw: value };
    const parts = value.split('$');
    return {
      kind: 'esim',
      raw: value,
      lpaVersion: parts[0] || '',
      smdp: parts[1] || '',
      activation: parts[2] || '',
      confirmation: parts.slice(3).join('$') || ''
    };
  }

  function render(data) {
    if (!data || !data.raw) {
      resultCount.textContent = translations.resultCount || '0 result(s)';
      typePill.textContent = '—';
      descText.textContent = translations.noData || 'No QR data yet';
      smdpValue.textContent = '—';
      activationValue.textContent = '—';
      confirmationValue.textContent = '—';
      fullValue.textContent = '—';
      rawValue.value = '—';
      if (qrContainer) { qrContainer.style.display = 'none'; qrContainer.innerHTML = ''; qrCodeInstance = null; }
      if (showQrBtn) showQrBtn.textContent = translations.showQr || 'Показать QR';
      return;
    }
    resultCount.textContent = (currentLang === 'ru' ? '1 результат' : '1 result');
    rawValue.value = data.raw;
    fullValue.textContent = data.raw;

    if (data.kind === 'esim') {
      typePill.textContent = 'LPA';
      descText.textContent = currentLang === 'ru' ? 'Обнаружен профиль eSIM' : 'eSIM profile detected';
      smdpValue.textContent = data.smdp || '—';
      activationValue.textContent = data.activation || '—';
      confirmationValue.textContent = data.confirmation || '—';
    } else {
      typePill.textContent = 'QR';
      descText.textContent = currentLang === 'ru' ? 'QR-код распознан, но это не LPA-строка eSIM' : 'QR decoded, but not an eSIM LPA string';
      smdpValue.textContent = '—';
      activationValue.textContent = '—';
      confirmationValue.textContent = '—';
    }
  }

  function acceptPayload(payload, source) {
    const parsed = parseEsim(payload);
    render(parsed);
    if (parsed.raw) {
      statusText.textContent = source === 'camera' ? (translations.statusCameraSuccess || 'Camera scan successful') : (translations.statusDecoded || 'QR decoded');
    } else {
      statusText.textContent = translations.statusReady || 'Ready to scan';
    }
  }

  // ---------- Декодирование файла ----------
  function decodeFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      statusText.textContent = translations.statusNotImage || 'Not an image';
      return;
    }
    statusText.textContent = translations.statusScanning || 'Scanning...';

    const reader = new FileReader();
    reader.onload = function(e) {
      const imgData = e.target.result;
      const img = new Image();
      img.onload = function() {
        tryHtml5Qrcode(img, file);
      };
      img.src = imgData;
    };
    reader.readAsDataURL(file);
  }

  function tryHtml5Qrcode(img, file) {
    if (typeof Html5Qrcode === 'undefined') {
      tryJsQR(img);
      return;
    }
    const dummyId = 'dummy-' + Date.now();
    const dummyDiv = document.createElement('div');
    dummyDiv.id = dummyId;
    dummyDiv.style.display = 'none';
    document.body.appendChild(dummyDiv);

    const scanner = new Html5Qrcode(dummyId);
    scanner.scanFile(file, true)
      .then(result => {
        acceptPayload(result, 'file');
        document.body.removeChild(dummyDiv);
      })
      .catch(err => {
        console.warn('Html5Qrcode failed, trying jsQR', err);
        document.body.removeChild(dummyDiv);
        tryJsQR(img);
      });
  }

  function tryJsQR(img) {
    if (typeof jsQR === 'undefined') {
      statusText.textContent = 'Error: jsQR not loaded.';
      return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    const gray = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      gray[i/4] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    let sum = 0;
    for (let i = 0; i < gray.length; i++) sum += gray[i];
    const avg = sum / gray.length;
    const threshold = avg * 0.8;

    const binary = new Uint8ClampedArray(data.length);
    for (let i = 0; i < gray.length; i++) {
      const val = gray[i] > threshold ? 255 : 0;
      const idx = i * 4;
      binary[idx] = val;
      binary[idx+1] = val;
      binary[idx+2] = val;
      binary[idx+3] = 255;
    }
    const binaryImageData = new ImageData(binary, canvas.width, canvas.height);

    let qr = null;
    try {
      qr = jsQR(binaryImageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
    } catch (e) {}
    if (qr && qr.data) {
      acceptPayload(qr.data, 'file');
    } else {
      try {
        qr = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
      } catch (e) {}
      if (qr && qr.data) {
        acceptPayload(qr.data, 'file');
      } else {
        render({ raw: '', kind: 'empty' });
        statusText.textContent = translations.statusNoQR || 'No QR code found';
      }
    }
  }

  // ---------- File input ----------
  fileInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      decodeFile(e.target.files[0]);
    }
    fileInput.value = '';
  });

  scanBox.addEventListener('click', function(e) {
    if (e.target.closest('.btn') || e.target.closest('.mini') || e.target.closest('.camera-actions')) return;
    if (cameraRunning) return;
    fileInput.click();
  });

  ['dragenter', 'dragover'].forEach(evt => {
    scanBox.addEventListener(evt, function(e) {
      e.preventDefault(); e.stopPropagation();
      scanBox.style.boxShadow = '0 0 28px rgba(41,255,79,.18), inset 0 0 24px rgba(41,255,79,.08)';
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    scanBox.addEventListener(evt, function(e) {
      e.preventDefault(); e.stopPropagation();
      scanBox.style.boxShadow = '';
    });
  });
  scanBox.addEventListener('drop', function(e) {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) decodeFile(file);
  });

  // ---------- Камера ----------
  async function startCamera() {
    if (cameraRunning) return;
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecure) {
      statusText.textContent = (translations.httpsNotice || 'HTTPS required for camera').replace(/<[^>]*>/g, '').trim();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      statusText.textContent = translations.statusCameraError || 'Camera not available';
      return;
    }
    if (typeof Html5Qrcode === 'undefined') {
      statusText.textContent = 'Error: html5-qrcode not loaded.';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }
      });
      video.srcObject = stream;
      await video.play();

      html5Scanner = new Html5Qrcode('video');
      cameraRunning = true;
      cameraWrap.classList.add('active');
      scanInner.classList.add('hidden');
      statusText.textContent = translations.statusCameraScan || 'Camera scanning...';

      await html5Scanner.start(
        { facingMode: { ideal: 'environment' } },
        {
          fps: 15,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
            return { width: size, height: size };
          }
        },
        function(decodedText) {
          acceptPayload(decodedText, 'camera');
        },
        function(error) { /* ignore */ }
      );
    } catch (err) {
      console.error(err);
      statusText.textContent = translations.statusCameraError || 'Camera error';
      stopCamera();
    }
  }

  function stopCamera() {
    cameraRunning = false;
    if (html5Scanner) {
      html5Scanner.stop().then(() => {
        html5Scanner.clear();
        html5Scanner = null;
      }).catch(() => {});
    }
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    cameraWrap.classList.remove('active');
    scanInner.classList.remove('hidden');
    statusText.textContent = translations.statusReady || 'Ready to scan';
  }

  startCameraBtn.addEventListener('click', startCamera);
  stopCameraBtn.addEventListener('click', stopCamera);

  // ---------- Copy, Download, Clear ----------
  copyBtn.addEventListener('click', async function() {
    const text = rawValue.value.trim();
    if (!text || text === '—') { statusText.textContent = translations.statusNoData || 'No data'; return; }
    try {
      await navigator.clipboard.writeText(text);
      statusText.textContent = translations.statusCopied || 'Copied';
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      statusText.textContent = translations.statusCopied || 'Copied';
    }
  });

  downloadBtn.addEventListener('click', function() {
    const text = rawValue.value.trim();
    if (!text || text === '—') { statusText.textContent = translations.statusNoData || 'No data'; return; }
    const blob = new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'esim-lpa.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    statusText.textContent = translations.statusDownloaded || 'Downloaded';
  });

  clearBtn.addEventListener('click', function() {
    render({ raw: '', kind: 'empty' });
    statusText.textContent = translations.statusReady || 'Ready to scan';
    fileInput.value = '';
    if (cameraRunning) stopCamera();
    if (qrContainer) { qrContainer.style.display = 'none'; qrContainer.innerHTML = ''; qrCodeInstance = null; }
    if (showQrBtn) showQrBtn.textContent = translations.showQr || 'Показать QR';
  });

  // ---------- Paste ----------
  window.addEventListener('paste', function(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { decodeFile(file); return; }
      }
    }
  });

  // ---------- Initialization ----------
  setLanguage('en');
  render({ raw: '', kind: 'empty' });
  setTimeout(() => renderHistory(), 100);
  switchTab('scan');
  checkHttps();
})();
