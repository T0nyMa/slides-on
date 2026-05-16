/* editor.js — visual slide editor (embedded in generated HTML) */
(function () {
  'use strict';

  // Guard against double-load (skeleton.ts + editor-server.ts both inject)
  if (window.__editorLoaded) return;
  window.__editorLoaded = true;

  let active = false;
  let selectedEl = null;
  let floatToolbar = null;
  let undoStack = [];
  let pendingJsonChanges = false;

  const SELECTABLE = [
    // HTML text
    'h1','h2','h3','h4','p','li','span',
    // c-* containers
    '.c-card','.c-card-soft','.c-card-accent','.c-card-warn',
    '.c-step','.c-steps','.c-kpi','.c-quote','.c-note','.c-warn',
    '.c-example','.c-codebox','.c-terminal','.c-table','.c-table-striped','.c-table-wrap',
    '.c-section','.c-glass','.c-stack',
    // c-* layout
    '.c-row','.c-grid-2','.c-grid-3','.c-badge-row','.c-icon-row',
    // c-* text / inline
    '.c-badge','.c-title','.c-subtitle','.c-body','.c-small','.c-formula','.c-grad',
    '.c-step-num','.c-step-title','.c-step-body','.c-step-content',
    '.c-kpi-value','.c-kpi-label','.c-kpi-delta',
    '.c-note-title','.c-note-body','.c-note-icon','.c-note-content',
    '.c-warn-title','.c-warn-body','.c-warn-icon','.c-warn-content',
    '.c-quote-attr','.c-example-label','.c-section-label',
    '.c-icon-row-icon','.c-icon-row-title','.c-icon-row-body','.c-icon-row-text',
    '.c-terminal-title','.c-terminal-topbar','.c-terminal-body',
    '.c-connector','.c-connector-arrow','.c-connector-text',
    '.c-hero-num','.c-hero-num-label',
    // c-* decorative
    '.c-divider','.c-divider-accent','.c-spacer-sm','.c-spacer-md','.c-spacer-lg',
    // chr-* chrome text
    '.chr-title','.chr-heading','.chr-sub','.chr-kicker','.chr-chip','.chr-page',
    '.chr-card-label','.chr-card-desc','.chr-card-num',
    '.chr-pill','.chr-stat','.chr-codebox',
    '.chr-hc-big','.chr-hc-desc','.chr-hc-h3','.chr-hc-lbl','.chr-hc-prompt','.chr-hc-tag','.chr-hc-val',
    // chr-* chrome containers
    '.chr-footer','.chr-topbar','.chr-card-main','.chr-hero',
    '.chr-avatar','.chr-big-emoji','.chr-heart','.chr-num-circle','.chr-page-dot','.chr-sticker',
    '.chr-cover-highlight','.chr-focus','.chr-hc-grid',
    // chr-* chrome decorative
    '.chr-topline','.chr-divider','.chr-blob','.chr-grad',
    '.chr-hc-cursor','.chr-hc-scanlines','.chr-hc-vignette',
    // media
    'img','svg',
  ].join(',');

  // ── Entry badge (shown before entering edit mode) ──────────
  var entryBadge = document.createElement('div');
  entryBadge.className = 'editor-entry-badge';
  entryBadge.innerHTML = '按 <kbd>E</kbd> 进入可视化编辑模式';
  document.body.appendChild(entryBadge);

  // ── Build top toolbar ──────────────────────────────────────
  const toolbar = document.createElement('div');
  toolbar.className = 'editor-toolbar';
  toolbar.innerHTML =
    '<span class="editor-label">编辑中</span>' +
    '<button data-action="save" title="⌘S">保存</button>' +
    '<button data-action="undo" title="⌘Z">撤销</button>' +
    '<span class="editor-spacer"></span>' +
    '<span class="editor-hint">E 退出 · 点击选中 · 双击编辑文字</span>';
  document.body.appendChild(toolbar);

  // ── Canvas frame label ─────────────────────────────────────
  var canvasLabel = document.createElement('div');
  canvasLabel.className = 'editor-canvas-label';
  var isPortrait = document.body.classList.contains('portrait');
  var ratio = isPortrait ? '3:4' : '16:9';
  var deck = document.querySelector('.deck');
  if (deck) {
    var w = deck.offsetWidth, h = deck.offsetHeight;
    canvasLabel.textContent = ratio + '  ' + w + '×' + h;
  } else {
    canvasLabel.textContent = ratio;
  }
  document.body.appendChild(canvasLabel);

  toolbar.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'save') saveAll();
    if (btn.dataset.action === 'undo') undo();
  });

  // ── Toggle edit mode ───────────────────────────────────────
  function toggleEdit(force) {
    active = force !== undefined ? force : !active;
    document.body.classList.toggle('editor-active', active);
    if (!active) {
      deselect();
      removeFloatToolbar();
    }
  }

  // ── Get current slide index (1-based) ──────────────────────
  function currentSlideIndex() {
    var slides = document.querySelectorAll('.deck > .slide');
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].classList.contains('is-active')) return i + 1;
    }
    return 1;
  }

  // ── Get CSS selector for element relative to its slide ─────
  function selectorFor(el) {
    var slide = el.closest('.slide');
    if (!slide) return el.tagName.toLowerCase();

    var parts = [];
    var node = el;
    while (node && node !== slide) {
      var seg = node.tagName.toLowerCase();
      var cls = node.getAttribute('class') || '';
      var match = cls.match(/\b(c-[a-z0-9-]+|chr-[a-z0-9-]+)\b/);
      if (match) seg = '.' + match[1];

      var parent = node.parentElement;
      if (parent && parent !== slide) {
        // Count position among same-tag siblings (matches CSS :nth-of-type)
        var sameTag = Array.from(parent.children).filter(function (s) {
          return s.tagName === node.tagName;
        });
        if (sameTag.length > 1) {
          seg += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
        }
      }
      parts.unshift(seg);
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  // ── Selection ──────────────────────────────────────────────
  function select(el) {
    deselect();
    selectedEl = el;
    el.classList.add('editor-selected');
    showFloatToolbar(el);
  }

  function deselect() {
    if (selectedEl) {
      selectedEl.classList.remove('editor-selected');
      selectedEl = null;
    }
    removeFloatToolbar();
  }

  // ── Float toolbar ──────────────────────────────────────────
  function showFloatToolbar(el) {
    removeFloatToolbar();
    floatToolbar = document.createElement('div');
    floatToolbar.className = 'editor-float-toolbar';

    var cls = el.getAttribute('class') || '';
    var tag = el.tagName;
    var isText = /^(H[1-4]|P|LI|SPAN)$/.test(tag) || /\b(chr-title|chr-heading|chr-sub|chr-kicker|chr-chip|chr-page|chr-pill|chr-stat|chr-codebox|chr-card-label|chr-card-desc|chr-card-num|chr-hc-big|chr-hc-desc|chr-hc-h3|chr-hc-lbl|chr-hc-prompt|chr-hc-tag|chr-hc-val|c-title|c-subtitle|c-body|c-small|c-formula|c-grad|c-badge|c-step-num|c-step-title|c-step-body|c-kpi-value|c-kpi-label|c-kpi-delta|c-note-title|c-note-body|c-note-icon|c-warn-title|c-warn-body|c-warn-icon|c-quote-attr|c-example-label|c-section-label|c-icon-row-icon|c-icon-row-title|c-icon-row-body|c-terminal-title|c-connector-text|c-connector-arrow|c-hero-num|c-hero-num-label)\b/.test(cls);
    var isContainer = /\b(c-card|c-card-soft|c-card-accent|c-card-warn|c-step|c-steps|c-kpi|c-quote|c-note|c-warn|c-example|c-codebox|c-terminal|c-table|c-table-striped|c-table-wrap|c-section|c-glass|c-stack|c-step-content|c-note-content|c-warn-content|c-icon-row-text|c-terminal-topbar|c-terminal-body|c-connector|chr-topbar|chr-card-main|chr-hero|chr-footer|chr-avatar|chr-big-emoji|chr-heart|chr-num-circle|chr-page-dot|chr-sticker|chr-cover-highlight|chr-focus|chr-hc-grid)\b/.test(cls);
    var isLayout = /\b(c-row|c-grid-2|c-grid-3|c-badge-row|c-icon-row)\b/.test(cls);
    var isDecorative = /\b(chr-topline|chr-divider|chr-blob|chr-grad|chr-hc-cursor|chr-hc-scanlines|chr-hc-vignette|c-divider|c-divider-accent|c-spacer-sm|c-spacer-md|c-spacer-lg)\b/.test(cls);

    var buttons = [];

    if (isText) {
      buttons.push({ label: 'A-', action: 'font-down' });
      buttons.push({ label: 'A+', action: 'font-up' });
      buttons.push({ label: 'B', action: 'bold' });
      buttons.push({ label: '色', action: 'color' });
    }
    if (isContainer) {
      buttons.push({ label: '内距-', action: 'pad-down' });
      buttons.push({ label: '内距+', action: 'pad-up' });
      buttons.push({ label: '背景', action: 'bg-color' });
    }
    if (isLayout) {
      buttons.push({ label: '间距-', action: 'gap-down' });
      buttons.push({ label: '间距+', action: 'gap-up' });
    }
    if (isDecorative) {
      buttons.push({ label: '背景', action: 'bg-color' });
    }

    if (buttons.length) buttons.push({ sep: true });
    buttons.push({ label: '←', action: 'move-left' });
    buttons.push({ label: '→', action: 'move-right' });
    buttons.push({ label: '↑', action: 'move-up' });
    buttons.push({ label: '↓', action: 'move-down' });
    buttons.push({ label: '✕', action: 'delete' });

    buttons.forEach(function (b) {
      if (b.sep) {
        var sep = document.createElement('span');
        sep.className = 'sep';
        floatToolbar.appendChild(sep);
        return;
      }
      var btn = document.createElement('button');
      btn.textContent = b.label;
      btn.dataset.action = b.action;
      floatToolbar.appendChild(btn);
    });

    floatToolbar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (btn) handleAction(btn.dataset.action, el);
    });

    document.body.appendChild(floatToolbar);
    positionFloatToolbar(el);
  }

  function positionFloatToolbar(el) {
    if (!floatToolbar) return;
    var rect = el.getBoundingClientRect();
    var top = rect.top - 44;
    var left = rect.left;
    if (top < 50) top = rect.bottom + 8;
    left = Math.max(8, Math.min(left, window.innerWidth - floatToolbar.offsetWidth - 8));
    floatToolbar.style.top = top + 'px';
    floatToolbar.style.left = left + 'px';
  }

  function removeFloatToolbar() {
    if (floatToolbar) { floatToolbar.remove(); floatToolbar = null; }
  }

  // ── Event listeners ────────────────────────────────────────
  document.addEventListener('click', function (e) {
    if (!active) return;
    if (e.target.closest('.editor-toolbar') || e.target.closest('.editor-float-toolbar')) return;

    var link = e.target.closest('a');
    if (link) e.preventDefault();

    var el = e.target.closest(SELECTABLE);
    if (!el || !el.closest('.slide')) {
      // Fallback: select the nearest div ancestor that is a direct child of .slide
      var slide = e.target.closest('.slide');
      if (slide) {
        var node = e.target;
        while (node && node.parentElement !== slide) node = node.parentElement;
        if (node && node !== slide && node.tagName === 'DIV') el = node;
      }
    }
    if (el && el.closest('.slide')) {
      e.stopPropagation();
      select(el);
    } else {
      deselect();
    }
  }, true);

  document.addEventListener('dblclick', function (e) {
    if (!active) return;
    var el = e.target.closest(SELECTABLE);
    if (!el || !el.closest('.slide')) return;

    var tag = el.tagName;
    var cls = el.getAttribute('class') || '';
    var isTextEl = /^(H[1-4]|P|LI|SPAN)$/.test(tag) || /\b(chr-title|chr-heading|chr-sub|chr-kicker|chr-chip|chr-page|chr-pill|chr-stat|chr-codebox|chr-card-label|chr-card-desc|chr-card-num|chr-hc-big|chr-hc-desc|chr-hc-h3|chr-hc-lbl|chr-hc-prompt|chr-hc-tag|chr-hc-val|c-title|c-subtitle|c-body|c-small|c-formula|c-badge|c-step-num|c-step-title|c-step-body|c-kpi-value|c-kpi-label|c-kpi-delta|c-note-title|c-note-body|c-note-icon|c-warn-title|c-warn-body|c-warn-icon|c-quote-attr|c-example-label|c-section-label|c-icon-row-icon|c-icon-row-title|c-icon-row-body|c-terminal-title|c-connector-text|c-hero-num|c-hero-num-label)\b/.test(cls);
    if (!isTextEl) return;

    e.preventDefault();
    enterContentEditable(el);
  });

  function enterContentEditable(el) {
    var oldText = el.textContent;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('editor-editing');
    el.classList.remove('editor-selected');
    removeFloatToolbar();
    el.focus();

    function exitEdit() {
      el.removeAttribute('contenteditable');
      el.classList.remove('editor-editing');
      var newText = el.textContent;
      if (newText !== oldText) {
        logEdit({
          slide: currentSlideIndex(),
          target: selectorFor(el),
          action: 'edit-text',
          from: oldText,
          to: newText,
          output: 'slides.json',
        });
        pendingJsonChanges = true;
      }
      el.removeEventListener('blur', onBlur);
      el.removeEventListener('keydown', onKey);
    }

    function onBlur() { setTimeout(exitEdit, 100); }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); el.blur(); } }

    el.addEventListener('blur', onBlur);
    el.addEventListener('keydown', onKey);
  }

  // ── Keyboard ───────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'e' || e.key === 'E') {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.activeElement && document.activeElement.getAttribute('contenteditable') === 'true') return;
      toggleEdit();
      e.preventDefault();
      return;
    }

    if (!active) return;

    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveAll();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      undo();
      return;
    }

    if (e.key === 'Escape') {
      if (selectedEl) deselect();
      else toggleEdit(false);
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEl) {
      if (document.activeElement && document.activeElement.getAttribute('contenteditable') === 'true') return;
      e.preventDefault();
      handleAction('delete', selectedEl);
    }
  });

  // ── Actions ────────────────────────────────────────────────
  function handleAction(action, el) {
    var slide = currentSlideIndex();
    var selector = selectorFor(el);
    var cs = getComputedStyle(el);

    switch (action) {
      case 'font-up':
      case 'font-down': {
        var cur = parseFloat(cs.fontSize);
        var delta = action === 'font-up' ? 2 : -2;
        var next = Math.max(8, cur + delta) + 'px';
        pushUndo(el, 'fontSize', el.style.fontSize);
        el.style.fontSize = next;
        saveCssRule(slide, selector, 'font-size', next);
        logEdit({ slide: slide, target: selector, action: 'resize-font', from: cur + 'px', to: next, output: 'index.html' });
        break;
      }
      case 'bold': {
        var curW = cs.fontWeight;
        var nextW = parseInt(curW) >= 600 ? '400' : '700';
        pushUndo(el, 'fontWeight', el.style.fontWeight);
        el.style.fontWeight = nextW;
        saveCssRule(slide, selector, 'font-weight', nextW);
        logEdit({ slide: slide, target: selector, action: 'toggle-bold', from: curW, to: nextW, output: 'index.html' });
        break;
      }
      case 'color':
      case 'bg-color': {
        var input = document.createElement('input');
        input.type = 'color';
        input.className = 'editor-color-input';
        var prop = action === 'color' ? 'color' : 'backgroundColor';
        var cssProp = action === 'color' ? 'color' : 'background-color';
        var originalVal = el.style[prop];
        input.value = rgbToHex(action === 'color' ? cs.color : cs.backgroundColor);
        document.body.appendChild(input);
        pushUndo(el, prop, originalVal);
        input.addEventListener('input', function () {
          el.style[prop] = input.value;
          saveCssRule(slide, selector, cssProp, input.value);
        });
        input.addEventListener('change', function () {
          logEdit({ slide: slide, target: selector, action: 'change-color', from: originalVal, to: input.value, output: 'index.html' });
          input.remove();
        });
        input.click();
        break;
      }
      case 'pad-up':
      case 'pad-down': {
        var curP = parseFloat(cs.padding) || 16;
        var deltaP = action === 'pad-up' ? 4 : -4;
        var nextP = Math.max(0, curP + deltaP) + 'px';
        pushUndo(el, 'padding', el.style.padding);
        el.style.padding = nextP;
        saveCssRule(slide, selector, 'padding', nextP);
        logEdit({ slide: slide, target: selector, action: 'adjust-padding', from: curP + 'px', to: nextP, output: 'index.html' });
        break;
      }
      case 'gap-up':
      case 'gap-down': {
        var curG = parseFloat(cs.gap) || 16;
        var deltaG = action === 'gap-up' ? 4 : -4;
        var nextG = Math.max(0, curG + deltaG) + 'px';
        pushUndo(el, 'gap', el.style.gap);
        el.style.gap = nextG;
        saveCssRule(slide, selector, 'gap', nextG);
        logEdit({ slide: slide, target: selector, action: 'adjust-gap', from: curG + 'px', to: nextG, output: 'index.html' });
        break;
      }
      case 'move-up':
      case 'move-down':
      case 'move-left':
      case 'move-right': {
        var cur = parseTranslate(el.style.transform);
        var dx = action === 'move-left' ? -8 : action === 'move-right' ? 8 : 0;
        var dy = action === 'move-up' ? -8 : action === 'move-down' ? 8 : 0;
        var nx = cur.x + dx, ny = cur.y + dy;
        var val = 'translate(' + nx + 'px, ' + ny + 'px)';
        pushUndo(el, 'transform', el.style.transform);
        el.style.transform = val;
        saveCssRule(slide, selector, 'transform', val);
        logEdit({ slide: slide, target: selector, action: 'move', from: cur.x + ',' + cur.y, to: nx + ',' + ny, output: 'index.html' });
        break;
      }
      case 'delete': {
        var html = el.outerHTML.slice(0, 200);
        pushUndo(el, '_delete', { parent: el.parentElement, next: el.nextSibling, html: el.outerHTML });
        el.remove();
        deselect();
        logEdit({ slide: slide, target: selector, action: 'delete', from: html, to: null, output: 'slides.json' });
        pendingJsonChanges = true;
        break;
      }
    }
    if (selectedEl) positionFloatToolbar(selectedEl);
  }

  // ── Undo stack (memory-only) ───────────────────────────────
  function pushUndo(el, prop, oldVal) {
    undoStack.push({ el: el, prop: prop, oldVal: oldVal });
    if (undoStack.length > 50) undoStack.shift();
  }

  function undo() {
    var entry = undoStack.pop();
    if (!entry) return;
    if (entry.prop === '_delete') {
      var tmp = document.createElement('div');
      tmp.innerHTML = entry.oldVal.html;
      entry.oldVal.parent.insertBefore(tmp.firstElementChild, entry.oldVal.next);
    } else {
      entry.el.style[entry.prop] = entry.oldVal;
    }
  }

  // ── File System Access API save ─────────────────────────
  var directoryHandle = null;
  var saveDialogEl = null;

  function showSaveDialog() {
    if (saveDialogEl) return;
    saveDialogEl = document.createElement('div');
    saveDialogEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100001;display:flex;align-items:center;justify-content:center;';
    saveDialogEl.innerHTML =
      '<div style="background:#1a1d24;color:#e6edf3;padding:24px 32px;border-radius:12px;text-align:center;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,0.5);font:14px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;">' +
      '<p style="margin:0 0 8px;">保存修改需要写入文件权限</p>' +
      '<p style="margin:0 0 16px;font-size:12px;color:#8b949e;">请选择包含 index.html 的目录</p>' +
      '<button id="editor-save-pick-dir" style="margin:0 6px;padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(88,166,255,0.25);color:#e6edf3;font:13px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;">选择目录</button>' +
      '<button id="editor-save-cancel" style="margin:0 6px;padding:8px 18px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#8b949e;font:13px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;">取消</button>' +
      '</div>';
    document.body.appendChild(saveDialogEl);
  }

  function hideSaveDialog() {
    if (saveDialogEl) { saveDialogEl.remove(); saveDialogEl = null; }
  }

  async function getDirectoryHandle() {
    if (directoryHandle) return directoryHandle;
    try {
      directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      return directoryHandle;
    } catch (e) {
      if (e.name === 'SecurityError') {
        // Not called from user gesture — caller should handle
        throw e;
      }
      throw e;
    }
  }

  function downloadFile(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType || 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // ── CSS accumulator ────────────────────────────────────────
  var cssRules = {};

  var dirty = false;

  function saveCssRule(slide, selector, prop, value) {
    var key = '.slide:nth-of-type(' + slide + ') ' + selector;
    if (!cssRules[key]) cssRules[key] = {};
    cssRules[key][prop] = value;
    dirty = true;
    markDirty();
  }

  // Parse existing <style id="editor-overrides"> back into cssRules on load
  (function loadOverrides() {
    var styleEl = document.getElementById('editor-overrides');
    if (!styleEl || !styleEl.textContent.trim()) return;
    var text = styleEl.textContent;
    var ruleRe = /\.slide:nth-of-type\(\d+\)\s+[^{]+\s*\{[^}]+\}/g;
    var rules = text.match(ruleRe) || [];
    rules.forEach(function(rule) {
      var m = rule.match(/\.slide:nth-of-type\((\d+)\)\s+([^{]+)\s*\{([^}]+)\}/);
      if (!m) return;
      var key = '.slide:nth-of-type(' + m[1] + ') ' + m[2].trim();
      if (!cssRules[key]) cssRules[key] = {};
      m[3].split(';').forEach(function(d) {
        var colon = d.indexOf(':');
        if (colon > 0) {
          cssRules[key][d.substring(0, colon).trim()] = d.substring(colon + 1).trim();
        }
      });
    });
  })();

  function buildEditorCss() {
    var css = '';
    for (var sel in cssRules) {
      var props = cssRules[sel];
      var decls = [];
      for (var p in props) decls.push(p + ': ' + props[p]);
      css += sel + ' { ' + decls.join('; ') + '; }\n';
    }
    return css;
  }

  async function flushToHtml() {
    var css = buildEditorCss();

    if (directoryHandle) {
      try {
        var handle = await getDirectoryHandle();
        var fileHandle = await handle.getFileHandle('index.html');
        var file = await fileHandle.getFile();
        var html = await file.text();

        // Replace content of <style id="editor-overrides">...</style>
        var tagStart = html.indexOf('id="editor-overrides"');
        if (tagStart !== -1) {
          var contentStart = html.indexOf('>', tagStart) + 1;
          var contentEnd = html.indexOf('</style>', contentStart);
          if (contentStart > 0 && contentEnd > contentStart) {
            html = html.substring(0, contentStart) + '\n' + css + html.substring(contentEnd);
          }
        }

        var writable = await fileHandle.createWritable();
        await writable.write(html);
        await writable.close();
        return;
      } catch (e) {}
    }

    // Fallback: download full HTML
    downloadFile('index.html', htmlWithOverrides(css), 'text/html');
  }

  function htmlWithOverrides(css) {
    // Find and replace editor-overrides in current DOM's HTML
    var clone = document.documentElement.outerHTML;
    var tagStart = clone.indexOf('id="editor-overrides"');
    if (tagStart !== -1) {
      var contentStart = clone.indexOf('>', tagStart) + 1;
      var contentEnd = clone.indexOf('</style>', contentStart);
      if (contentStart > 0 && contentEnd > contentStart) {
        return clone.substring(0, contentStart) + '\n' + css + clone.substring(contentEnd);
      }
    }
    return clone;
  }

  // ── Logging (no-op without server) ───────────────────────
  function logEdit(entry) {
    // Edit logging requires editor-server. Skip silently.
  }

  // ── Save all (⌘S) ─────────────────────────────────────────
  function saveAll() {
    if (!dirty) return;

    // If no directory handle yet and FSA is available, need user gesture
    if (!directoryHandle && typeof window.showDirectoryPicker === 'function') {
      showSaveDialog();
      var pickBtn = document.getElementById('editor-save-pick-dir');
      var cancelBtn = document.getElementById('editor-save-cancel');
      if (pickBtn) {
        pickBtn.onclick = function () {
          hideSaveDialog();
          getDirectoryHandle().then(function () {
            return flushToHtml();
          }).then(function () {
            dirty = false; pendingJsonChanges = false;
            showSaved('已保存');
          }).catch(function () {
            downloadFile('index.html', htmlWithOverrides(buildEditorCss()), 'text/html');
            dirty = false; pendingJsonChanges = false;
            showSaved('已下载');
          });
        };
      }
      if (cancelBtn) {
        cancelBtn.onclick = function () {
          hideSaveDialog();
          downloadFile('index.html', htmlWithOverrides(buildEditorCss()), 'text/html');
          dirty = false; pendingJsonChanges = false;
          showSaved('已下载');
        };
      }
      return;
    }

    flushToHtml().then(function () {
      dirty = false; pendingJsonChanges = false;
      showSaved(directoryHandle ? '已保存' : '已下载');
    });
  }

  function showSaved(msg) {
    var label = toolbar.querySelector('.editor-label');
    if (label) label.textContent = msg;
    toolbar.style.background = '#2ea043';
    setTimeout(function () {
      toolbar.style.background = '';
      if (label) label.textContent = '编辑中';
    }, 1500);
  }

  function markDirty() {
    var label = toolbar.querySelector('.editor-label');
    if (label && dirty) label.textContent = '编辑中 *';
  }

  // ── Helpers ────────────────────────────────────────────────
  function parseTranslate(transform) {
    if (!transform) return { x: 0, y: 0 };
    var m = transform.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
  }

  function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    var m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return '#000000';
    return '#' + [m[0], m[1], m[2]].map(function (n) {
      return parseInt(n).toString(16).padStart(2, '0');
    }).join('');
  }
})();
