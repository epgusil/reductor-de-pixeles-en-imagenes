'use strict';

/* ============================================================
   PIXEL SHRINKER 98
   Herramienta 100% client-side de redimensionamiento de imágenes.
   No se envía ninguna imagen a ningún servidor.
   ============================================================ */

(() => {
  // ---------- Referencias DOM ----------
  const dropzone = document.getElementById('dropzone');
  const dropzoneEmpty = document.getElementById('dropzoneEmpty');
  const sourcePreviewImg = document.getElementById('sourcePreviewImg');
  const fileInput = document.getElementById('fileInput');
  const btnBrowse = document.getElementById('btnBrowse');

  const infoName = document.getElementById('infoName');
  const infoFormat = document.getElementById('infoFormat');
  const infoDims = document.getElementById('infoDims');
  const infoSize = document.getElementById('infoSize');

  const inputWidth = document.getElementById('inputWidth');
  const inputHeight = document.getElementById('inputHeight');
  const chkAspect = document.getElementById('chkAspect');
  const dimsOriginal = document.getElementById('dimsOriginal');
  const dimsOutput = document.getElementById('dimsOutput');

  const selectFormat = document.getElementById('selectFormat');
  const qualityRow = document.getElementById('qualityRow');
  const inputQuality = document.getElementById('inputQuality');
  const qualityValue = document.getElementById('qualityValue');

  const btnResize = document.getElementById('btnResize');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');

  const previewBefore = document.getElementById('previewBefore');
  const previewBeforePlaceholder = document.getElementById('previewBeforePlaceholder');
  const previewAfter = document.getElementById('previewAfter');
  const previewAfterPlaceholder = document.getElementById('previewAfterPlaceholder');

  const outOriginalSize = document.getElementById('outOriginalSize');
  const outNewSize = document.getElementById('outNewSize');
  const outReduction = document.getElementById('outReduction');
  const btnSave = document.getElementById('btnSave');

  const statusMsg = document.getElementById('statusMsg');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalIcon = document.getElementById('modalIcon');
  const modalText = document.getElementById('modalText');
  const modalOk = document.getElementById('modalOk');
  const modalClose = document.getElementById('modalClose');

  const downloadAnchor = document.getElementById('downloadAnchor');

  const menuItems = document.querySelectorAll('.menu-item');
  const menuDropdown = document.getElementById('menuDropdown');

  // ---------- Estado ----------
  const state = {
    file: null,
    img: null,          // HTMLImageElement decodificada
    origWidth: 0,
    origHeight: 0,
    origBytes: 0,
    formatLabel: '',
    resultBlob: null,
    resultFileName: '',
    aspectRatio: 1,
    updatingFromCode: false
  };

  const SUPPORTED_EXT = ['png', 'jpg', 'jpeg', 'jfif', 'webp', 'gif', 'bmp'];

  // ============================================================
  // Utilidades
  // ============================================================

  function setStatus(msg) {
    statusMsg.textContent = msg;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getExtension(filename) {
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return parts.pop().toLowerCase();
  }

  function getFormatLabel(file) {
    const ext = getExtension(file.name);
    const type = file.type;

    if (ext === 'jfif') return 'JPEG (JFIF)';
    if (type === 'image/jpeg') return 'JPEG';
    if (type === 'image/png') return 'PNG';
    if (type === 'image/webp') return 'WEBP';
    if (type === 'image/gif') return 'GIF';
    if (type === 'image/bmp') return 'BMP';
    if (type === 'image/svg+xml') return 'SVG';
    if (ext) return ext.toUpperCase();
    return 'DESCONOCIDO';
  }

  function extensionForMime(mime) {
    switch (mime) {
      case 'image/png': return 'png';
      case 'image/webp': return 'webp';
      case 'image/jpeg':
      default: return 'jpg';
    }
  }

  function showModal(title, text, icon) {
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalIcon.textContent = icon || '⚠';
    modalOverlay.hidden = false;
  }

  function hideModal() {
    modalOverlay.hidden = true;
  }

  function showError(text) {
    showModal('PIXEL SHRINKER 98', text, '⛔');
    setStatus('Error.');
  }

  // ============================================================
  // Carga de archivo
  // ============================================================

  function isLikelySupportedFile(file) {
    if (file.type && file.type.startsWith('image/')) return true;
    const ext = getExtension(file.name);
    return SUPPORTED_EXT.includes(ext);
  }

  function handleFile(file) {
    if (!file) return;

    if (!isLikelySupportedFile(file)) {
      showError(
        'El archivo "' + file.name + '" no parece ser una imagen compatible.\n' +
        'Formatos soportados: PNG, JPG, JPEG, JFIF, WEBP, GIF, BMP.'
      );
      return;
    }

    setStatus('Cargando imagen...');

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      state.file = file;
      state.img = img;
      state.origWidth = img.naturalWidth;
      state.origHeight = img.naturalHeight;
      state.origBytes = file.size;
      state.formatLabel = getFormatLabel(file);
      state.aspectRatio = img.naturalWidth / img.naturalHeight;
      state.resultBlob = null;

      // Mostrar en dropzone
      dropzoneEmpty.hidden = true;
      sourcePreviewImg.src = objectUrl;
      sourcePreviewImg.hidden = false;

      // Info panel
      infoName.textContent = file.name;
      infoFormat.textContent = state.formatLabel;
      infoDims.textContent = state.origWidth + ' × ' + state.origHeight + ' px';
      infoSize.textContent = formatBytes(state.origBytes);

      // Preview "antes"
      previewBefore.src = objectUrl;
      previewBefore.hidden = false;
      previewBeforePlaceholder.hidden = true;

      // Resetear preview "después"
      previewAfter.hidden = true;
      previewAfter.src = '';
      previewAfterPlaceholder.hidden = false;
      previewAfterPlaceholder.textContent = 'Sin procesar';

      // Campos de dimensiones
      state.updatingFromCode = true;
      inputWidth.value = state.origWidth;
      inputHeight.value = state.origHeight;
      state.updatingFromCode = false;

      dimsOriginal.textContent = state.origWidth + ' × ' + state.origHeight;
      updateOutputDimsPreview();

      // Output stats reset
      outOriginalSize.textContent = formatBytes(state.origBytes);
      outNewSize.textContent = '—';
      outReduction.textContent = '—';

      btnResize.disabled = false;
      btnSave.disabled = true;

      setStatus('Image loaded.');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      showError(
        'No se pudo decodificar "' + file.name + '".\n' +
        'El archivo puede estar dañado o el formato no es soportado por tu navegador.'
      );
      setStatus('Ready.');
    };

    img.src = objectUrl;
  }

  btnBrowse.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target === btnBrowse) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    fileInput.value = '';
  });

  // Drag & drop
  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      handleFile(dt.files[0]);
    }
  });

  // También permitir drop en toda la ventana sin navegar fuera
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  // ============================================================
  // Dimensiones / aspect ratio
  // ============================================================

  function updateOutputDimsPreview() {
    const w = parseInt(inputWidth.value, 10) || 0;
    const h = parseInt(inputHeight.value, 10) || 0;
    dimsOutput.textContent = (w || '—') + ' × ' + (h || '—');
  }

  inputWidth.addEventListener('input', () => {
    if (state.updatingFromCode || !state.img) {
      updateOutputDimsPreview();
      return;
    }
    if (chkAspect.checked) {
      const w = parseInt(inputWidth.value, 10);
      if (w > 0) {
        state.updatingFromCode = true;
        inputHeight.value = Math.max(1, Math.round(w / state.aspectRatio));
        state.updatingFromCode = false;
      }
    }
    updateOutputDimsPreview();
  });

  inputHeight.addEventListener('input', () => {
    if (state.updatingFromCode || !state.img) {
      updateOutputDimsPreview();
      return;
    }
    if (chkAspect.checked) {
      const h = parseInt(inputHeight.value, 10);
      if (h > 0) {
        state.updatingFromCode = true;
        inputWidth.value = Math.max(1, Math.round(h * state.aspectRatio));
        state.updatingFromCode = false;
      }
    }
    updateOutputDimsPreview();
  });

  chkAspect.addEventListener('change', () => {
    if (!state.img) return;
    // Al reactivar, recalcular alto en base al ancho actual
    if (chkAspect.checked) {
      const w = parseInt(inputWidth.value, 10);
      if (w > 0) {
        state.updatingFromCode = true;
        inputHeight.value = Math.max(1, Math.round(w / state.aspectRatio));
        state.updatingFromCode = false;
        updateOutputDimsPreview();
      }
    }
  });

  // ============================================================
  // Formato de salida / calidad
  // ============================================================

  function refreshQualityVisibility() {
    const needsQuality = selectFormat.value === 'image/jpeg' || selectFormat.value === 'image/webp';
    qualityRow.style.display = needsQuality ? 'flex' : 'none';
  }

  selectFormat.addEventListener('change', refreshQualityVisibility);
  refreshQualityVisibility();

  inputQuality.addEventListener('input', () => {
    qualityValue.textContent = inputQuality.value;
  });

  // ============================================================
  // Menú superior (decorativo + About)
  // ============================================================

  const MENUS = {
    file: [
      { label: 'Abrir imagen...', action: () => fileInput.click() },
      { label: 'Guardar como...', action: () => { if (!btnSave.disabled) btnSave.click(); }, disabledWhen: () => btnSave.disabled },
      { label: 'Salir', disabled: true }
    ],
    edit: [
      { label: 'Deshacer', disabled: true },
      { label: 'Rehacer', disabled: true }
    ],
    view: [
      { label: 'Actualizar previsualización', action: () => {} , disabled: true}
    ],
    help: [
      { label: 'Acerca de PIXEL SHRINKER 98', action: () => showModal(
          'Acerca de PIXEL SHRINKER 98',
          'PIXEL SHRINKER 98\nHerramienta de redimensionamiento de imágenes 100% local.\nNinguna imagen sale de tu dispositivo.\n\nHecho con Canvas API. Sin backend.',
          'ℹ'
        ) }
    ]
  };

  let openMenu = null;

  function closeMenu() {
    menuDropdown.classList.remove('open');
    menuDropdown.innerHTML = '';
    menuItems.forEach(mi => mi.classList.remove('active'));
    openMenu = null;
  }

  function toggleMenu(key, anchorEl) {
    if (openMenu === key) {
      closeMenu();
      return;
    }
    closeMenu();
    openMenu = key;
    anchorEl.classList.add('active');

    const items = MENUS[key] || [];
    menuDropdown.innerHTML = '';
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'menu-dropdown-item';
      div.textContent = item.label;
      const isDisabled = item.disabled || (item.disabledWhen && item.disabledWhen());
      if (isDisabled) {
        div.classList.add('disabled');
      } else {
        div.addEventListener('click', () => {
          closeMenu();
          if (item.action) item.action();
        });
      }
      menuDropdown.appendChild(div);
    });

    const rect = anchorEl.getBoundingClientRect();
    const barRect = anchorEl.parentElement.getBoundingClientRect();
    menuDropdown.style.left = (rect.left - barRect.left) + 'px';
    menuDropdown.classList.add('open');
  }

  menuItems.forEach(mi => {
    mi.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu(mi.dataset.menu, mi);
    });
  });

  document.addEventListener('click', () => closeMenu());

  // ============================================================
  // Botones decorativos de la barra de título
  // ============================================================

  document.getElementById('btnMin').addEventListener('click', () => {
    setStatus('Minimizar no está disponible en esta versión de demostración.');
  });
  document.getElementById('btnMax').addEventListener('click', () => {
    document.getElementById('mainWindow').classList.toggle('maximized');
  });
  document.getElementById('btnClose').addEventListener('click', () => {
    showModal('PIXEL SHRINKER 98', '¿Seguro que deseas cerrar PIXEL SHRINKER 98?\n(Esta ventana es parte de la página — no se cerrará realmente).', '❓');
  });

  modalOk.addEventListener('click', hideModal);
  modalClose.addEventListener('click', hideModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  // ============================================================
  // Redimensionado de alta calidad (downscale escalonado)
  // ============================================================

  function drawScaledStepped(source, srcW, srcH, targetW, targetH) {
    let curW = srcW;
    let curH = srcH;
    let currentSource = source;

    // Downscale progresivo por mitades para mejor calidad en reducciones grandes
    while (curW * 0.5 > targetW && curH * 0.5 > targetH) {
      const nextW = Math.max(targetW, Math.floor(curW * 0.5));
      const nextH = Math.max(targetH, Math.floor(curH * 0.5));

      const stepCanvas = document.createElement('canvas');
      stepCanvas.width = nextW;
      stepCanvas.height = nextH;
      const stepCtx = stepCanvas.getContext('2d');
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      stepCtx.drawImage(currentSource, 0, 0, nextW, nextH);

      currentSource = stepCanvas;
      curW = nextW;
      curH = nextH;
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetW;
    finalCanvas.height = targetH;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(currentSource, 0, 0, targetW, targetH);

    return finalCanvas;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function setProgress(pct) {
    progressFill.style.width = pct + '%';
    await sleep(60);
  }

  // ============================================================
  // Procesar imagen
  // ============================================================

  btnResize.addEventListener('click', async () => {
    if (!state.img) return;

    const targetW = parseInt(inputWidth.value, 10);
    const targetH = parseInt(inputHeight.value, 10);

    if (!targetW || !targetH || targetW < 1 || targetH < 1) {
      showError('Introduce dimensiones válidas (ancho y alto mayores a 0).');
      return;
    }
    if (targetW > 20000 || targetH > 20000) {
      showError('Las dimensiones máximas permitidas son 20000 × 20000 px.');
      return;
    }

    btnResize.disabled = true;
    btnSave.disabled = true;
    progressWrap.hidden = false;
    await setProgress(5);
    setStatus('Processing image...');

    try {
      await setProgress(20);

      const outputMime = selectFormat.value;
      const quality = parseInt(inputQuality.value, 10) / 100;

      await setProgress(40);

      // Dibujar con downscale escalonado de alta calidad
      const canvas = drawScaledStepped(state.img, state.origWidth, state.origHeight, targetW, targetH);

      await setProgress(65);

      let finalCanvas = canvas;

      // Para JPEG (sin canal alfa), rellenar fondo blanco para evitar bordes negros
      // en imágenes originalmente transparentes.
      if (outputMime === 'image/jpeg') {
        const flat = document.createElement('canvas');
        flat.width = targetW;
        flat.height = targetH;
        const flatCtx = flat.getContext('2d');
        flatCtx.fillStyle = '#ffffff';
        flatCtx.fillRect(0, 0, targetW, targetH);
        flatCtx.drawImage(canvas, 0, 0);
        finalCanvas = flat;
      }

      await setProgress(80);

      const blob = await new Promise((resolve, reject) => {
        finalCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('No se pudo generar el archivo de imagen.'));
        }, outputMime, (outputMime === 'image/png') ? undefined : quality);
      });

      await setProgress(95);

      // Guardar resultado en estado
      state.resultBlob = blob;

      const baseName = state.file.name.replace(/\.[^/.]+$/, '');
      const ext = extensionForMime(outputMime);
      state.resultFileName = baseName + '-resized.' + ext;

      // Preview "después"
      const resultUrl = URL.createObjectURL(blob);
      previewAfter.src = resultUrl;
      previewAfter.hidden = false;
      previewAfterPlaceholder.hidden = true;

      // Stats
      dimsOutput.textContent = targetW + ' × ' + targetH;
      outOriginalSize.textContent = formatBytes(state.origBytes);
      outNewSize.textContent = formatBytes(blob.size);

      const reductionPct = state.origBytes > 0
        ? Math.round((1 - (blob.size / state.origBytes)) * 100)
        : 0;

      if (reductionPct >= 0) {
        outReduction.textContent = reductionPct + '%';
      } else {
        outReduction.textContent = '+' + Math.abs(reductionPct) + '% (más pesado)';
      }

      await setProgress(100);
      await sleep(150);

      btnSave.disabled = false;
      setStatus('Done.');
    } catch (err) {
      console.error(err);
      showError('Ocurrió un error al procesar la imagen: ' + err.message);
      setStatus('Ready.');
    } finally {
      btnResize.disabled = false;
      progressWrap.hidden = true;
      progressFill.style.width = '0%';
    }
  });

  // ============================================================
  // Guardar imagen
  // ============================================================

  btnSave.addEventListener('click', () => {
    if (!state.resultBlob) return;

    const url = URL.createObjectURL(state.resultBlob);
    downloadAnchor.href = url;
    downloadAnchor.download = state.resultFileName;
    downloadAnchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setStatus('Image saved: ' + state.resultFileName);
  });

  // ============================================================
  // Inicio
  // ============================================================

  setStatus('Ready.');
  updateOutputDimsPreview();
})();
