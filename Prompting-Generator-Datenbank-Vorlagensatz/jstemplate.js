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
    var categoryToggle = bulkBar.querySelector('.prompt-library-bulk__category-toggle');
    var categoryPanel = bulkBar.querySelector('.prompt-library-bulk__category-panel');
    var categoryOptionsEl = bulkBar.querySelector('.prompt-library-bulk__category-options');
    var categoryBtn = bulkBar.querySelector('.prompt-library-bulk__category-btn');
    var deleteBtn = bulkBar.querySelector('.prompt-library-bulk__delete-btn');
    var hintEl = bulkBar.querySelector('.prompt-library-bulk__hint');
    var deleteBtnLabel = deleteBtn ? deleteBtn.textContent : 'Ausgewählte löschen';
    var categoryBtnLabel = categoryBtn ? categoryBtn.textContent : 'Kategorien übernehmen';
    var categoryStateSnapshot = {};

    function getVisibleCards() {
      var cards = list.querySelectorAll('.prompt-card');
      return Array.prototype.filter.call(cards, function (card) {
        return card.offsetParent !== null;
      });
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
        closeCategoryPanel();
      }
      var visible = getVisibleCards();
      var allChecked = visible.length > 0 && visible.length === selected.length;
      var someChecked = selected.length > 0;
      if (selectAllInput) {
        selectAllInput.checked = allChecked;
        selectAllInput.indeterminate = someChecked && !allChecked;
      }
      syncCategorySelectionState();
    }

    function setHint(message) {
      if (!hintEl) return;
      hintEl.textContent = message;
    }

    function setControlsDisabled(isBusy) {
      if (selectAllInput) selectAllInput.disabled = isBusy;
      if (categoryToggle) categoryToggle.disabled = isBusy;
      if (categoryBtn) categoryBtn.disabled = isBusy;
      if (deleteBtn) deleteBtn.disabled = isBusy;
    }

    function resetActionState() {
      setControlsDisabled(false);
      if (deleteBtn) deleteBtn.textContent = deleteBtnLabel;
      if (categoryBtn) categoryBtn.textContent = categoryBtnLabel;
    }

    function setDeleteBusy(progressText) {
      setControlsDisabled(true);
      if (deleteBtn) deleteBtn.textContent = progressText || 'Lösche...';
      if (categoryBtn) categoryBtn.textContent = categoryBtnLabel;
    }

    function setCategoryBusy(progressText) {
      setControlsDisabled(true);
      if (categoryBtn) categoryBtn.textContent = progressText || 'Speichere...';
      if (deleteBtn) deleteBtn.textContent = deleteBtnLabel;
    }

    function getDeleteLink(card) {
      return card.querySelector('.prompt-card__titlebar-actions a[href*="delete"]');
    }

    function getEditLink(card) {
      return card.querySelector('.prompt-card__titlebar-actions a[href*="edit"]');
    }

    function normalizeText(text) {
      return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function createChoiceCollector() {
      return {
        list: [],
        seen: {},
        add: function (value, label) {
          var key = (value || '').trim();
          if (!key) return;
          var normalized = normalizeText(key);
          if (!normalized || this.seen[normalized]) return;
          this.seen[normalized] = true;
          this.list.push(label || key);
        }
      };
    }

    function getCategoryInputs() {
      return categoryOptionsEl ? categoryOptionsEl.querySelectorAll('input[type="checkbox"]') : [];
    }

    function updateCategoryToggleLabel() {
      if (!categoryToggle) return;
      var changes = getPendingCategoryChanges();
      if (changes.length) {
        categoryToggle.textContent = changes.length + ' Kategorien geändert';
        return;
      }
      var selected = getSelectedCards();
      if (!selected.length) {
        categoryToggle.textContent = 'Kategorien wählen';
        return;
      }
      categoryToggle.textContent = 'Kategorien für ' + selected.length + ' Karten';
    }

    function renderCategoryChoices(choices) {
      if (!categoryOptionsEl) return;
      categoryOptionsEl.innerHTML = '';
      choices.forEach(function (choice) {
        var option = document.createElement('label');
        option.className = 'prompt-library-bulk__category-option';

        var input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'prompt-library-bulk__category-input';
        input.setAttribute('data-category', choice);

        var text = document.createElement('span');
        text.className = 'prompt-library-bulk__category-option-text';
        text.textContent = choice;

        option.appendChild(input);
        option.appendChild(text);
        categoryOptionsEl.appendChild(option);
      });
      syncCategorySelectionState();
    }

    function appendCategoryOptionsFromCards(collector) {
      var cards = list.querySelectorAll('.prompt-card');
      for (var i = 0; i < cards.length; i++) {
        parseCategories(getMetaText(cards[i], 'kategorie')).forEach(function (cat) {
          collector.add(cat, cat);
        });
      }
    }

    function getKnownCategories() {
      var collector = createChoiceCollector();
      appendCategoryOptionsFromCards(collector);
      return collector.list;
    }

    function getSubmitControl(form) {
      var controls = form.querySelectorAll('button[type="submit"], input[type="submit"]');
      if (!controls.length) return null;
      var preferred = ['saveandview', 'saveandanother', 'save'];
      for (var i = 0; i < controls.length; i++) {
        var descriptor = normalizeText((controls[i].getAttribute('name') || '') + ' ' + (controls[i].value || '') + ' ' + (controls[i].textContent || ''));
        for (var j = 0; j < preferred.length; j++) {
          if (descriptor.indexOf(preferred[j]) !== -1) return controls[i];
        }
        if (descriptor.indexOf('cancel') === -1 && descriptor.indexOf('abbrechen') === -1) {
          return controls[i];
        }
      }
      return controls[0];
    }

    function buildFormRequest(form, baseUrl) {
      if (!form) return null;
      var action = form.getAttribute('action') || baseUrl;
      var method = (form.getAttribute('method') || 'post').toUpperCase();
      var submitControl = getSubmitControl(form);
      var formData = new FormData(form);
      var base = new URL(baseUrl, window.location.href);
      var resolved = new URL(action, baseUrl);
      base.searchParams.forEach(function (value, key) {
        if (!resolved.searchParams.has(key)) {
          resolved.searchParams.append(key, value);
        }
      });
      if (submitControl && submitControl.name && !formData.has(submitControl.name)) {
        formData.append(submitControl.name, submitControl.value || '1');
      }
      return {
        url: resolved.toString(),
        method: method,
        formData: formData
      };
    }

    function withQueryParams(url, formData) {
      var resolved = new URL(url, window.location.href);
      formData.forEach(function (value, key) {
        resolved.searchParams.append(key, value);
      });
      return resolved.toString();
    }

    function getCheckboxLabelText(form, input) {
      if (!input) return '';
      if (input.id) {
        var explicitLabel = form.querySelector('label[for="' + input.id + '"]');
        if (explicitLabel) return explicitLabel.textContent || '';
      }
      var wrappedLabel = input.closest && input.closest('label');
      if (wrappedLabel) return wrappedLabel.textContent || '';
      var labelledContainer = input.closest && input.closest('.form-check, .custom-control, .fcheckbox, .checkbox, .form-checkbox');
      if (labelledContainer) return labelledContainer.textContent || '';
      var sibling = input.nextElementSibling;
      if (sibling && sibling.tagName && sibling.tagName.toLowerCase() === 'label') {
        return sibling.textContent || '';
      }
      if (input.parentElement) return input.parentElement.textContent || '';
      return input.value || '';
    }

    function findEditForm(doc) {
      var forms = doc.querySelectorAll('form');
      for (var i = 0; i < forms.length; i++) {
        var action = (forms[i].getAttribute('action') || '').toLowerCase();
        var looksLikeEditForm = action.indexOf('/mod/data/edit.php') !== -1 || action.indexOf('edit.php') !== -1;
        var hasEditorFields = forms[i].querySelector('textarea, input[type="text"], input[type="checkbox"]');
        var hasSaveAction = getSubmitControl(forms[i]);
        if (looksLikeEditForm && hasEditorFields && hasSaveAction) {
          return forms[i];
        }
      }
      for (var j = 0; j < forms.length; j++) {
        if (forms[j].querySelector('textarea, input[type="text"], input[type="checkbox"]') && getSubmitControl(forms[j])) {
          return forms[j];
        }
      }
      return null;
    }

    function getCheckboxGroupCandidates(form) {
      var candidates = [];
      var seen = [];
      var checkboxes = form.querySelectorAll('input[type="checkbox"]');
      for (var i = 0; i < checkboxes.length; i++) {
        var container = checkboxes[i].closest('fieldset, .fitem, .fcontainer, .form-group, .mb-3, .felement');
        if (!container) container = checkboxes[i].parentElement;
        if (!container) continue;
        if (seen.indexOf(container) !== -1) continue;
        seen.push(container);
        candidates.push(container);
      }
      return candidates;
    }

    function getCheckboxChoices(container, form) {
      var inputs = container.querySelectorAll('input[type="checkbox"]');
      var choices = [];
      var seen = {};
      for (var i = 0; i < inputs.length; i++) {
        var label = (getCheckboxLabelText(form, inputs[i]) || '').replace(/\s+/g, ' ').trim();
        if (!label) continue;
        var key = normalizeText(label);
        if (!key || key === 'kategorie' || key === 'bearbeiten' || key === 'edit' || seen[key]) continue;
        seen[key] = true;
        choices.push(label);
      }
      return choices;
    }

    function findCategoryFieldContainer(form) {
      var known = getKnownCategories().map(normalizeText);
      var candidates = getCheckboxGroupCandidates(form);
      var best = null;
      var bestScore = -1;

      for (var i = 0; i < candidates.length; i++) {
        var container = candidates[i];
        var text = normalizeText(container.textContent || '');
        var choices = getCheckboxChoices(container, form);
        if (!choices.length) continue;

        var overlap = 0;
        for (var j = 0; j < choices.length; j++) {
          if (known.indexOf(normalizeText(choices[j])) !== -1) overlap++;
        }

        var score = overlap * 10 + Math.min(choices.length, 9);
        if (text.indexOf('kategorie') !== -1) score += 50;
        if (choices.length > 1) score += 2;

        if (score > bestScore) {
          bestScore = score;
          best = container;
        }
      }

      return best;
    }

    function extractCategoryChoices(form) {
      var container = findCategoryFieldContainer(form) || form;
      return getCheckboxChoices(container, form);
    }

    function getCategorySourceUrl() {
      var firstEditLink = list.querySelector('.prompt-card__titlebar-actions a[href*="edit"]');
      if (firstEditLink && firstEditLink.href) return firstEditLink.href;
      var addLink = document.querySelector('a[href*="/mod/data/edit.php"], a[href*="edit.php"]');
      return addLink && addLink.href ? addLink.href : '';
    }

    function populateCategoryOptions() {
      if (!categoryOptionsEl) return Promise.resolve();
      var collector = createChoiceCollector();
      appendCategoryOptionsFromCards(collector);
      var sourceUrl = getCategorySourceUrl();
      if (!sourceUrl) {
        renderCategoryChoices(collector.list);
        return Promise.resolve();
      }
      return fetchPage(sourceUrl).then(function (page) {
        var doc = new DOMParser().parseFromString(page.html, 'text/html');
        var form = findEditForm(doc);
        if (!form) throw new Error('Bearbeitungsformular nicht gefunden');
        var choices = extractCategoryChoices(form);
        if (!choices.length) {
          renderCategoryChoices(collector.list);
          return;
        }
        choices.forEach(function (choice) {
          collector.add(choice, choice);
        });
        renderCategoryChoices(collector.list);
      }).catch(function () {
        renderCategoryChoices(collector.list);
      });
    }

    function closeCategoryPanel() {
      if (!categoryPanel || !categoryToggle) return;
      categoryPanel.setAttribute('hidden', '');
      categoryToggle.setAttribute('aria-expanded', 'false');
    }

    function toggleCategoryPanel() {
      if (!categoryPanel || !categoryToggle) return;
      var isOpen = !categoryPanel.hasAttribute('hidden');
      if (isOpen) {
        closeCategoryPanel();
      } else {
        categoryPanel.removeAttribute('hidden');
        categoryToggle.setAttribute('aria-expanded', 'true');
      }
    }

    function syncCategorySelectionState() {
      var selected = getSelectedCards();
      var inputs = getCategoryInputs();
      categoryStateSnapshot = {};
      for (var i = 0; i < inputs.length; i++) {
        var category = inputs[i].getAttribute('data-category') || '';
        var selectedCount = 0;
        for (var j = 0; j < selected.length; j++) {
          if (parseCategories(getMetaText(selected[j], 'kategorie')).indexOf(category) !== -1) {
            selectedCount++;
          }
        }
        var isChecked = selected.length > 0 && selectedCount === selected.length;
        var isIndeterminate = selectedCount > 0 && selectedCount < selected.length;
        inputs[i].checked = isChecked;
        inputs[i].indeterminate = isIndeterminate;
        categoryStateSnapshot[category] = {
          checked: isChecked,
          indeterminate: isIndeterminate
        };
      }
      updateCategoryToggleLabel();
    }

    function getPendingCategoryChanges() {
      var inputs = getCategoryInputs();
      var changes = [];
      for (var i = 0; i < inputs.length; i++) {
        var category = inputs[i].getAttribute('data-category') || '';
        var snapshot = categoryStateSnapshot[category] || { checked: false, indeterminate: false };
        if (inputs[i].checked !== snapshot.checked || inputs[i].indeterminate !== snapshot.indeterminate) {
          changes.push({
            category: category,
            checked: inputs[i].checked
          });
        }
      }
      return changes;
    }

    function findCategoryCheckbox(form, categoryName) {
      var target = normalizeText(categoryName);
      if (!target) return null;
      var scopes = [];
      var categoryContainer = findCategoryFieldContainer(form);
      if (categoryContainer) scopes.push(categoryContainer);
      scopes.push(form);

      for (var s = 0; s < scopes.length; s++) {
        var inputs = scopes[s].querySelectorAll('input[type="checkbox"]');
        for (var i = 0; i < inputs.length; i++) {
          var labelText = normalizeText(getCheckboxLabelText(form, inputs[i]));
          var valueText = normalizeText(inputs[i].value);
          if (labelText === target || labelText.indexOf(target) !== -1 || valueText === target || target.indexOf(labelText) !== -1) {
            return inputs[i];
          }
        }
      }
      return null;
    }

    function parseDeleteConfirmation(html, url) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var confirmInput = doc.querySelector('form input[name="confirm"]');
      if (confirmInput && confirmInput.form) {
        return buildFormRequest(confirmInput.form, url);
      }
      var forms = doc.querySelectorAll('form');
      for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        var action = (form.getAttribute('action') || '').toLowerCase();
        var text = (form.textContent || '').toLowerCase();
        var looksLikeDeleteForm = !!(
          form.querySelector('input[name="delete"], input[name="confirm"]') ||
          action.indexOf('delete') !== -1 ||
          text.indexOf('delete') !== -1 ||
          text.indexOf('lösch') !== -1
        );
        if (looksLikeDeleteForm && form.querySelector('button[type="submit"], input[type="submit"]')) {
          return buildFormRequest(form, url);
        }
      }
      return null;
    }

    function fetchPage(url, options) {
      return fetch(url, Object.assign({ credentials: 'same-origin' }, options || {})).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text().then(function (html) {
          return {
            html: html,
            url: response.url || url
          };
        });
      });
    }

    function submitCategoryUpdate(linkUrl, categoryChanges) {
      return fetchPage(linkUrl).then(function (page) {
        var doc = new DOMParser().parseFromString(page.html, 'text/html');
        var form = findEditForm(doc);
        if (!form) {
          throw new Error('Bearbeitungsformular nicht gefunden');
        }
        for (var i = 0; i < categoryChanges.length; i++) {
          var categoryCheckbox = findCategoryCheckbox(form, categoryChanges[i].category);
          if (!categoryCheckbox && categoryChanges[i].checked) {
            throw new Error('Kategorie nicht im Bearbeitungsformular gefunden');
          }
          if (categoryCheckbox) {
            categoryCheckbox.checked = categoryChanges[i].checked;
          }
        }
        var request = buildFormRequest(form, page.url);
        var targetUrl = request.method === 'GET' ? withQueryParams(request.url, request.formData) : request.url;
        return fetchPage(targetUrl, {
          method: request.method,
          body: request.method === 'GET' ? null : request.formData
        });
      });
    }

    function submitDelete(linkUrl) {
      return fetchPage(linkUrl).then(function (page) {
        var request = parseDeleteConfirmation(page.html, page.url);
        if (!request) return;
        var targetUrl = request.method === 'GET' ? withQueryParams(request.url, request.formData) : request.url;
        return fetchPage(targetUrl, {
          method: request.method,
          body: request.method === 'GET' ? null : request.formData
        });
      });
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

    if (categoryToggle) {
      categoryToggle.addEventListener('click', function (e) {
        e.preventDefault();
        toggleCategoryPanel();
      });
    }

    if (categoryOptionsEl) {
      categoryOptionsEl.addEventListener('change', function (e) {
        if (!e.target || !e.target.classList || !e.target.classList.contains('prompt-library-bulk__category-input')) return;
        e.target.indeterminate = false;
        updateCategoryToggleLabel();
      });
    }

    if (categoryBtn) {
      categoryBtn.addEventListener('click', function () {
        var selected = getSelectedCards();
        if (selected.length === 0) return;
        var categoryChanges = getPendingCategoryChanges();
        if (!categoryChanges.length) {
          setHint('Bitte im Kategorien-Dropdown mindestens eine Zuordnung setzen oder entfernen.');
          return;
        }
        var links = selected.map(getEditLink).filter(function (link) {
          return !!(link && link.href);
        });
        if (!links.length) {
          setHint('Für die ausgewählten Einträge wurden keine Bearbeitungslinks gefunden.');
          return;
        }
        if (!window.confirm('Kategorien für ' + links.length + ' ausgewählte Einträge übernehmen?')) return;

        setCategoryBusy('Speichere 0/' + links.length);
        setHint('Die ausgewählten Einträge werden nacheinander aktualisiert.');

        var chain = Promise.resolve();
        links.forEach(function (link, index) {
          chain = chain.then(function () {
            setCategoryBusy('Speichere ' + (index + 1) + '/' + links.length);
            return submitCategoryUpdate(link.href, categoryChanges);
          });
        });

        chain.then(function () {
          closeCategoryPanel();
          setHint('Die Kategoriezuordnungen wurden für ' + links.length + ' Einträge aktualisiert. Die Liste wird aktualisiert.');
          window.location.reload();
        }).catch(function () {
          resetActionState();
          setHint('Kategoriezuordnung konnte nicht gesammelt aktualisiert werden. Bitte die Seite neu laden und erneut versuchen.');
        });
      });
    }

    document.addEventListener('click', function (e) {
      if (!categoryPanel || categoryPanel.hasAttribute('hidden')) return;
      if (bulkBar.contains(e.target) && categoryToggle && categoryToggle.contains(e.target)) return;
      if (categoryPanel.contains(e.target)) return;
      closeCategoryPanel();
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        var selected = getSelectedCards();
        if (selected.length === 0) return;
        var links = selected.map(getDeleteLink).filter(function (link) {
          return !!(link && link.href);
        });
        if (!links.length) return;
        if (!window.confirm(links.length + ' ausgewählte Einträge wirklich löschen?')) return;

        setDeleteBusy('Lösche 0/' + links.length);
        setHint('Die ausgewählten Einträge werden nacheinander gelöscht.');

        var chain = Promise.resolve();
        links.forEach(function (link, index) {
          chain = chain.then(function () {
            setDeleteBusy('Lösche ' + (index + 1) + '/' + links.length);
            return submitDelete(link.href);
          });
        });

        chain.then(function () {
          setHint(links.length + ' Einträge wurden gelöscht. Die Liste wird aktualisiert.');
          window.location.reload();
        }).catch(function () {
          resetActionState();
          setHint('Mehrfachlöschung fehlgeschlagen. Bitte die Seite neu laden und erneut versuchen.');
        });
      });
    }

    populateCategoryOptions();
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
