(function () {
  'use strict';

  var PLACEHOLDER_REGEX = /\{([^}]+)\}/g;

  function getPlaceholders(text) {
    var seen = {};
    var list = [];
    var match;
    PLACEHOLDER_REGEX.lastIndex = 0;
    while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
      if (!seen[match[1]]) {
        seen[match[1]] = true;
        list.push(match[1]);
      }
    }
    return list;
  }

  function getMetaText(card, field) {
    var el = card.querySelector('[data-field="' + field + '"]');
    if (!el && (field === 'kategorie' || field === 'Kategorie')) {
      el = card.querySelector('[data-field="Kategorie"]') || card.querySelector('[data-field="kategorie"]');
      if (!el) {
        var metas = card.querySelectorAll('.prompt-card__meta');
        el = metas.length >= 2 ? metas[1] : null;
      }
    }
    return el ? (el.textContent || '').trim() : '';
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function fillPreview(rawPrompt, placeholders, values, previewEl) {
    var out = escapeHtml(rawPrompt);
    placeholders.forEach(function (name) {
      var val = values[name] != null ? String(values[name]).trim() : '';
      var display = val || '{' + name + '}';
      var re = new RegExp('\\{' + escapeRegex(name) + '\\}', 'g');
      var safeDisplay = escapeHtml(display);
      var filledClass = val ? ' prompt-placeholder--filled' : '';
      out = out.replace(re, '<mark class="prompt-placeholder' + filledClass + '" data-placeholder="' + escapeHtml(name) + '">' + safeDisplay + '</mark>');
    });
    previewEl.innerHTML = out;
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function allFilled(placeholders, values) {
    return placeholders.every(function (name) {
      return values[name] != null && String(values[name]).trim() !== '';
    });
  }

  function buildFinalPrompt(systemInstruction, userPrompt) {
    var sys = (systemInstruction && String(systemInstruction).trim()) || '';
    var user = (userPrompt && String(userPrompt).trim()) || '';
    if (sys && user) return sys + '\n\n' + user;
    return sys || user;
  }

  var CATEGORY_PALETTE = [
    '#0078d4', '#107c10', '#5c2d91', '#d83b01', '#007acc', '#00b7c3', '#8764b8', '#e81123', '#ff8c00', '#2d7d9a',
    '#4a9c4d', '#c239b3', '#e3008c', '#008272', '#4e7c3a', '#8e44ad', '#c0392b', '#16a085', '#2980b9', '#27ae60',
    '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#3498db', '#2ecc71', '#e67e22', '#e91e63', '#673ab7', '#009688'
  ];

  function buildCategoryColorMap(cards) {
    var categories = {};
    cards.forEach(function (card) {
      parseCategories(getMetaText(card, 'kategorie')).forEach(function (c) { categories[c] = true; });
    });
    var sorted = Object.keys(categories).sort();
    var map = {};
    sorted.forEach(function (cat, i) {
      map[cat] = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
    });
    return map;
  }

  function initCard(card, colorMap) {
    var rawEl = card.querySelector('.prompt-card__raw');
    var previewEl = card.querySelector('.prompt-card__preview');
    var inputsContainer = card.querySelector('.prompt-card__inputs');
    var copyBtn = card.querySelector('.prompt-card__btn--copy');
    var feedbackEl = card.querySelector('.prompt-card__feedback');
    var primaryBtn = card.querySelector('.prompt-card__btn--primary');

    if (!rawEl || !previewEl || !inputsContainer || !copyBtn) return;

    var rawPrompt = (rawEl.textContent || '').trim();
    var placeholders = getPlaceholders(rawPrompt);
    var values = {};
    var entryId = card.getAttribute('data-entry-id') || '';
    var systemInstruction = getMetaText(card, 'systemprompt');
    var kategorie = getMetaText(card, 'kategorie');
    var firstCategory = parseCategories(kategorie)[0];

    if (colorMap) {
      var color = (firstCategory && colorMap[firstCategory]) ? colorMap[firstCategory] : CATEGORY_PALETTE[0];
      card.style.setProperty('--prompt-card-accent', color);
    }

    placeholders.forEach(function (name) {
      values[name] = '';
      var group = document.createElement('div');
      group.className = 'prompt-card__input-group';
      var id = 'prompt-input-' + (entryId ? entryId + '-' : '') + name.replace(/\s+/g, '-');
      var label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = name;
      var input = document.createElement('input');
      input.type = 'text';
      input.id = id;
      input.setAttribute('data-placeholder', name);
      input.placeholder = name;

      input.addEventListener('input', function () {
        values[name] = input.value;
        fillPreview(rawPrompt, placeholders, values, previewEl);
      });

      group.appendChild(label);
      group.appendChild(input);
      inputsContainer.appendChild(group);
    });

    fillPreview(rawPrompt, placeholders, values, previewEl);

    if (primaryBtn) {
      primaryBtn.addEventListener('click', function () {
        var inputs = inputsContainer.querySelectorAll('input');
        var target = null;
        for (var i = 0; i < inputs.length; i++) {
          if (!(inputs[i].value || '').trim()) {
            target = inputs[i];
            break;
          }
        }
        if (!target && inputs.length) target = inputs[0];
        if (target) {
          inputsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          target.focus();
        }
      });
    }

    copyBtn.addEventListener('click', function () {
      if (!allFilled(placeholders, values)) {
        showHint(feedbackEl, 'Bitte zuerst alle Platzhalter ausfüllen.');
        return;
      }
      var userPrompt = previewEl.textContent || previewEl.innerText || '';
      var finalText = buildFinalPrompt(systemInstruction, userPrompt);
      if (!finalText) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(finalText).then(function () {
          showCopied(feedbackEl, copyBtn);
        }).catch(function () {
          fallbackCopy(finalText, feedbackEl, copyBtn, card);
        });
      } else {
        fallbackCopy(finalText, feedbackEl, copyBtn, card);
      }
    });
  }

  function showHint(feedbackEl, message) {
    if (!feedbackEl) return;
    feedbackEl.classList.remove('prompt-card__feedback--success');
    feedbackEl.classList.add('prompt-card__feedback--hint');
    feedbackEl.removeAttribute('hidden');
    feedbackEl.textContent = message;
    setTimeout(function () {
      feedbackEl.setAttribute('hidden', '');
      feedbackEl.classList.remove('prompt-card__feedback--hint');
    }, 2500);
  }

  function showCopied(feedbackEl, copyBtn) {
    if (!feedbackEl) return;
    feedbackEl.classList.remove('prompt-card__feedback--hint');
    feedbackEl.classList.add('prompt-card__feedback--success');
    feedbackEl.removeAttribute('hidden');
    feedbackEl.textContent = 'Kopiert!';
    if (copyBtn) copyBtn.setAttribute('aria-label', 'In die Zwischenablage kopieren – Kopiert!');
    setTimeout(function () {
      feedbackEl.setAttribute('hidden', '');
      feedbackEl.classList.remove('prompt-card__feedback--success');
      if (copyBtn) copyBtn.setAttribute('aria-label', 'In die Zwischenablage kopieren');
    }, 2000);
  }

  function fallbackCopy(text, feedbackEl, copyBtn, card) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopied(feedbackEl, copyBtn);
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function parseCategories(kategorieText) {
    if (!kategorieText || !kategorieText.trim()) return [];
    return kategorieText.split(/[,\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function initFilter(cards) {
    var filterSelect = document.querySelector('.prompt-library-filter__select');
    if (!filterSelect || !cards.length) return;
    var categories = {};
    cards.forEach(function (card) {
      parseCategories(getMetaText(card, 'kategorie')).forEach(function (cat) {
        if (cat && cat.indexOf('[[') !== 0) categories[cat] = true;
      });
    });
    var list = Object.keys(categories).sort();
    list.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      filterSelect.appendChild(opt);
    });
    var firstOpt = filterSelect.options[0];
    if (firstOpt && firstOpt.value === '') firstOpt.textContent = 'Alle Kategorien';
    filterSelect.addEventListener('change', function () {
      var value = (filterSelect.value || '').trim();
      cards.forEach(function (card) {
        var cats = parseCategories(getMetaText(card, 'kategorie'));
        var show = value === '' || cats.indexOf(value) !== -1;
        card.style.display = show ? '' : 'none';
      });
    });
  }

  function initCardSelection() {
    var list = document.querySelector('.prompt-library-list');
    if (!list) return;
    var overlay = document.getElementById('prompt-library-overlay');
    if (!overlay) overlay = list.querySelector('.prompt-library-overlay');
    if (!overlay) return;
    var cards = list.querySelectorAll('.prompt-card');

    function isInteractive(target) {
      if (!target || !target.closest) return false;
      if (target.closest('.prompt-card__select-btn')) return false;
      return target.closest('button, input, select, textarea, a[href]');
    }

    function clearCardPosition(card) {
      card.style.position = '';
      card.style.left = '';
      card.style.top = '';
      card.style.width = '';
      card.style.transform = '';
    }

    function selectCard(card) {
      cards.forEach(function (c) {
        c.classList.remove('prompt-card--selected');
        clearCardPosition(c);
      });
      card.classList.add('prompt-card--selected');
      var rect = card.getBoundingClientRect();
      card.style.position = 'fixed';
      card.style.left = rect.left + 'px';
      card.style.top = rect.top + 'px';
      card.style.width = rect.width + 'px';
      card.style.transform = 'none';
      overlay.removeAttribute('hidden');
      overlay.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () {
        overlay.classList.add('is-visible');
        requestAnimationFrame(function () {
          card.style.left = '50%';
          card.style.top = '50%';
          card.style.width = 'min(800px, 90vw)';
          card.style.transform = 'translate(-50%, -50%)';
        });
      });
    }

    function deselectAll() {
      cards.forEach(function (c) {
        c.classList.remove('prompt-card--selected');
        clearCardPosition(c);
      });
      overlay.classList.remove('is-visible');
      setTimeout(function () {
        overlay.setAttribute('hidden', '');
        overlay.setAttribute('aria-hidden', 'true');
      }, 280);
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (isInteractive(e.target)) return;
        e.preventDefault();
        selectCard(card);
      });
      var selectBtn = card.querySelector('.prompt-card__select-btn');
      if (selectBtn) {
        selectBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          selectCard(card);
        });
      }
    });

    overlay.addEventListener('click', function () {
      deselectAll();
    });

    document.addEventListener('click', function (e) {
      var selected = document.querySelector('.prompt-card--selected');
      if (!selected) return;
      if (selected.contains(e.target)) return;
      deselectAll();
    });
  }

  function initBulkDelete() {
    var list = document.querySelector('.prompt-library-list');
    if (!list) return;
    var bulkBar = document.getElementById('prompt-library-bulk') || document.querySelector('.prompt-library-bulk');
    if (!bulkBar) return;
    var selectAllInput = bulkBar.querySelector('.prompt-library-bulk__select-all-input');
    var countNum = bulkBar.querySelector('.prompt-library-bulk__count-num');
    var deleteBtn = bulkBar.querySelector('.prompt-library-bulk__delete-btn');

    function getVisibleCards() {
      return list.querySelectorAll('.prompt-card');
    }

    function getSelectedCards() {
      var cards = list.querySelectorAll('.prompt-card');
      var out = [];
      for (var i = 0; i < cards.length; i++) {
        var cb = cards[i].querySelector('.prompt-card__bulk-select');
        if (cb && cb.checked) out.push(cards[i]);
      }
      return out;
    }

    function updateBulkBar() {
      var selected = getSelectedCards();
      var n = selected.length;
      if (countNum) countNum.textContent = String(n);
      if (n > 0) {
        bulkBar.removeAttribute('hidden');
      } else {
        bulkBar.setAttribute('hidden', '');
      }
      var visible = getVisibleCards();
      var allChecked = visible.length > 0 && visible.length === selected.length;
      var someChecked = selected.length > 0;
      if (selectAllInput) {
        selectAllInput.checked = allChecked;
        selectAllInput.indeterminate = someChecked && !allChecked;
      }
    }

    list.addEventListener('change', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('prompt-card__bulk-select')) {
        updateBulkBar();
      }
    });

    if (selectAllInput) {
      selectAllInput.addEventListener('change', function () {
        var visible = getVisibleCards();
        visible.forEach(function (card) {
          var cb = card.querySelector('.prompt-card__bulk-select');
          if (cb) cb.checked = selectAllInput.checked;
        });
        updateBulkBar();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        var selected = getSelectedCards();
        if (selected.length === 0) return;
        selected.forEach(function (card) {
          var link = card.querySelector('.prompt-card__titlebar-actions a[href*="delete"]');
          if (link && link.href) {
            window.open(link.href, '_blank', 'noopener,noreferrer');
          }
        });
      });
    }

    updateBulkBar();
  }

  function initSystemToggles() {
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('.prompt-system-toggle');
      if (!btn) return;
      var card = btn.closest('.prompt-card');
      var content = card ? card.querySelector('.prompt-card__more-content') : null;
      if (!content) {
        var id = btn.getAttribute('aria-controls');
        if (id) content = document.getElementById(id);
      }
      if (!content) return;
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      if (expanded) {
        content.setAttribute('hidden', '');
      } else {
        content.removeAttribute('hidden');
      }
    });
  }

  function init() {
    var cards = document.querySelectorAll('.prompt-card');
    var colorMap = buildCategoryColorMap(cards);
    cards.forEach(function (card) { initCard(card, colorMap); });
    initFilter(cards);
    initCardSelection();
    initBulkDelete();
    initSystemToggles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
