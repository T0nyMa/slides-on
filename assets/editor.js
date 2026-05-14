/* editor.js — visual slide editor (injected by editor-server.ts) */
(function () {
  'use strict';

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
        var siblings = Array.from(parent.children).filter(function (s) {
          return s.tagName === node.tagName || (match && (s.getAttribute('class') || '').includes(match[1]));
        });
        if (siblings.length > 1) {
          seg += ':nth-child(' + (siblings.indexOf(node) + 1) + ')';
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
        logEdit({ slide: slide, target: selector, action: 'resize-font', from: cur + 'px', to: next, output: 'polish.css' });
        break;
      }
      case 'bold': {
        var curW = cs.fontWeight;
        var nextW = parseInt(curW) >= 600 ? '400' : '700';
        pushUndo(el, 'fontWeight', el.style.fontWeight);
        el.style.fontWeight = nextW;
        saveCssRule(slide, selector, 'font-weight', nextW);
        logEdit({ slide: slide, target: selector, action: 'toggle-bold', from: curW, to: nextW, output: 'polish.css' });
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
          logEdit({ slide: slide, target: selector, action: 'change-color', from: originalVal, to: input.value, output: 'polish.css' });
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
        logEdit({ slide: slide, target: selector, action: 'adjust-padding', from: curP + 'px', to: nextP, output: 'polish.css' });
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
        logEdit({ slide: slide, target: selector, action: 'adjust-gap', from: curG + 'px', to: nextG, output: 'polish.css' });
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
        logEdit({ slide: slide, target: selector, action: 'move', from: cur.x + ',' + cur.y, to: nx + ',' + ny, output: 'polish.css' });
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

  // ── CSS accumulator ────────────────────────────────────────
  var cssRules = {};
  var originalPolishCss = '';

  var dirty = false;

  function saveCssRule(slide, selector, prop, value) {
    var key = '.slide:nth-child(' + slide + ') ' + selector;
    if (!cssRules[key]) cssRules[key] = {};
    cssRules[key][prop] = value;
    dirty = true;
    markDirty();
  }

  function flushCss() {
    var css = '';
    if (originalPolishCss) css += originalPolishCss + '\n';

    css += '\n/* ── editor overrides ── */\n';
    for (var sel in cssRules) {
      var props = cssRules[sel];
      var decls = [];
      for (var p in props) decls.push(p + ': ' + props[p]);
      css += '\n/* [editor] */\n' + sel + ' { ' + decls.join('; ') + '; }\n';
    }

    fetch('/api/save-css', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ css: css }),
    });
  }

  // Load existing polish.css (strip prior editor rules)
  (function loadOriginalPolish() {
    var link = document.querySelector('link[href*="polish.css"]');
    if (!link) return;
    fetch(link.getAttribute('href'))
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (text) {
        var lines = text.split('\n');
        var kept = [];
        var skip = false;
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].indexOf('/* [editor]') !== -1 || lines[i].indexOf('/* ── editor overrides') !== -1) { skip = true; continue; }
          if (skip && lines[i].trim() === '') { skip = false; continue; }
          if (skip) continue;
          kept.push(lines[i]);
        }
        originalPolishCss = kept.join('\n').trim();
      })
      .catch(function () {});
  })();

  // ── Logging ────────────────────────────────────────────────
  function logEdit(entry) {
    entry.ts = new Date().toISOString();
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  }

  // ── Save all (⌘S) ─────────────────────────────────────────
  function saveAll() {
    if (dirty) flushCss();
    dirty = false;
    pendingJsonChanges = false;
    var label = toolbar.querySelector('.editor-label');
    if (label) label.textContent = '编辑中';
    toolbar.style.background = '#2ea043';
    setTimeout(function () { toolbar.style.background = ''; }, 300);
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
