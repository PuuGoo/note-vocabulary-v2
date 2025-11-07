// =====================================================
// Vocabulary Manager JavaScript
// =====================================================

let currentPage = 1;
let currentFilters = {
  search: '',
  language: '',
  difficulty: '',
  tags: '',
};
let allTags = [];

// =====================================================
// Load Vocabulary
// =====================================================

async function loadVocabulary() {
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 20,
      ...currentFilters,
    });

    const data = await VocaPro.API.get(`/api/v1/vocab?${params}`);
    renderVocabulary(data.data);
    updatePagination(data.pagination);
  } catch (error) {
    document.getElementById('vocabTableBody').innerHTML =
      '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary)">Failed to load vocabulary</td></tr>';
  }
}

function renderVocabulary(vocabs) {
  const tbody = document.getElementById('vocabTableBody');
  document.getElementById('resultsCount').textContent = vocabs.length;

  if (vocabs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center; color: var(--text-secondary)">No vocabulary found</td></tr>';
    return;
  }

  tbody.innerHTML = vocabs
    .map(
      (vocab) => `
    <tr>
      <td><strong>${vocab.word}</strong></td>
      <td style="color: var(--text-secondary); font-style: italic">${vocab.ipa || '-'}</td>
      <td><span class="badge">${vocab.language.toUpperCase()}</span></td>
      <td>${vocab.partOfSpeech || '-'}</td>
      <td>${vocab.definitions.slice(0, 2).join('; ')}</td>
      <td><span class="badge gradient-${
        vocab.difficulty === 'EASY' ? 'success' : vocab.difficulty === 'HARD' ? 'danger' : 'accent'
      }">${vocab.difficulty}</span></td>
      <td>${vocab.tags
        .map(
          (t) =>
            `<span class="badge" style="background: ${t.color || '#667eea'}; color: white">${
              t.name
            }</span>`
        )
        .join(' ')}</td>
      <td>
        <button class="btn btn-small" onclick="editVocab('${vocab.id}')">✏️</button>
        <button class="btn btn-small btn-danger" onclick="deleteVocab('${vocab.id}')">🗑️</button>
      </td>
    </tr>
  `
    )
    .join('');
}

function updatePagination(pagination) {
  document.getElementById(
    'pageInfo'
  ).textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
  document.getElementById('pagePrev').disabled = pagination.page === 1;
  document.getElementById('pageNext').disabled = pagination.page === pagination.totalPages;
}

// =====================================================
// Add Vocabulary
// =====================================================

async function populateTagsSelect() {
  const select1 = document.getElementById('vocabTags');
  const select2 = document.getElementById('editVocabTags');
  const filterSelect = document.getElementById('tagFilter');

  if (allTags.length === 0) {
    select1.innerHTML = '<option value="" disabled>No tags available. Create tags first.</option>';
    select2.innerHTML = '<option value="" disabled>No tags available. Create tags first.</option>';
    filterSelect.innerHTML =
      '<option value="">All Tags</option><option value="" disabled>No tags available</option>';
    return;
  }

  const options = allTags.map((tag) => `<option value="${tag.id}">${tag.name}</option>`).join('');

  select1.innerHTML = options;
  select2.innerHTML = options;
  filterSelect.innerHTML = '<option value="">All Tags</option>' + options;
}

// =====================================================
// Dictionary Lookup
// =====================================================

async function lookupDictionary(word, isEditForm = false) {
  if (!word || word.trim().length === 0) {
    VocaPro.Toasts.show('Error', 'Please enter a word first', 'error');
    return;
  }

  try {
    VocaPro.Toasts.show('Info', 'Looking up word...', 'info');
    const result = await VocaPro.API.get(
      `/api/v1/dictionary/lookup/${encodeURIComponent(word.trim())}`
    );

    if (!result.found) {
      let message = 'Word not found in dictionary';
      if (result.suggestions && result.suggestions.length > 0) {
        message += `. Did you mean: ${result.suggestions.slice(0, 3).join(', ')}?`;
      }
      VocaPro.Toasts.show('Warning', message, 'warning');
      return;
    }

    // Fill form fields based on which form (Add or Edit)
    const ipaField = document.getElementById(isEditForm ? 'editIpa' : 'ipa');
    const partOfSpeechField = document.getElementById(
      isEditForm ? 'editPartOfSpeech' : 'partOfSpeech'
    );
    const definitionsField = document.getElementById(
      isEditForm ? 'editDefinitions' : 'definitions'
    );
    const examplesField = document.getElementById(isEditForm ? 'editExamples' : 'examples');

    if (result.ipa && ipaField) {
      ipaField.value = result.ipa;
    }

    if (result.partOfSpeech && partOfSpeechField) {
      partOfSpeechField.value = result.partOfSpeech;
    }

    if (result.definitions && result.definitions.length > 0 && definitionsField) {
      definitionsField.value = result.definitions.join('\n');
    }

    if (result.examples && result.examples.length > 0 && examplesField) {
      examplesField.value = result.examples.join('\n');
    }

    VocaPro.Toasts.show('Success', 'Auto-filled from dictionary', 'success');
  } catch (error) {
    VocaPro.Toasts.show('Error', error.message || 'Dictionary lookup failed', 'error');
  }
}

// Lookup button for Add form
document.getElementById('lookupWord').addEventListener('click', () => {
  const word = document.getElementById('word').value;
  lookupDictionary(word, false);
});

// Lookup button for Edit form
document.getElementById('lookupEditWord').addEventListener('click', () => {
  const word = document.getElementById('editWord').value;
  lookupDictionary(word, true);
});

// =====================================================
// Add Vocabulary
// =====================================================

document.getElementById('saveVocabBtn').addEventListener('click', async () => {
  const form = document.getElementById('addVocabForm');
  const formData = new FormData(form);

  const definitions = formData
    .get('definitions')
    .split('\n')
    .filter((d) => d.trim());
  const examples = formData
    .get('examples')
    .split('\n')
    .filter((e) => e.trim());

  // Get selected tags
  const selectedTags = Array.from(document.getElementById('vocabTags').selectedOptions).map(
    (option) => option.value
  );

  const data = {
    word: formData.get('word'),
    language: formData.get('language'),
    difficulty: formData.get('difficulty'),
    partOfSpeech: formData.get('partOfSpeech') || undefined,
    ipa: formData.get('ipa') || undefined,
    definitions: definitions.length > 0 ? definitions : undefined,
    examples: examples.length > 0 ? examples : undefined,
    notes: formData.get('notes') || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  };

  try {
    await VocaPro.API.post('/api/v1/vocab', data);
    VocaPro.Toasts.show('Success', 'Vocabulary added successfully', 'success');
    VocaPro.Modal.close('addVocabModal');
    form.reset();
    loadVocabulary();
  } catch (error) {
    // Error handled by API helper
  }
});

// =====================================================
// Edit Vocabulary
// =====================================================

document.getElementById('updateVocabBtn').addEventListener('click', async () => {
  const form = document.getElementById('editVocabForm');
  const formData = new FormData(form);
  const id = document.getElementById('editVocabId').value;

  const definitions = formData
    .get('definitions')
    .split('\n')
    .filter((d) => d.trim());
  const examples = formData
    .get('examples')
    .split('\n')
    .filter((e) => e.trim());

  // Get selected tags
  const selectedTags = Array.from(document.getElementById('editVocabTags').selectedOptions).map(
    (option) => option.value
  );

  const data = {
    word: formData.get('word'),
    language: formData.get('language'),
    difficulty: formData.get('difficulty'),
    partOfSpeech: formData.get('partOfSpeech') || undefined,
    ipa: formData.get('ipa') || undefined,
    definitions: definitions.length > 0 ? definitions : undefined,
    examples: examples.length > 0 ? examples : undefined,
    notes: formData.get('notes') || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  };

  try {
    await VocaPro.API.put(`/api/v1/vocab/${id}`, data);
    VocaPro.Toasts.show('Success', 'Vocabulary updated successfully', 'success');
    VocaPro.Modal.close('editVocabModal');
    loadVocabulary();
  } catch (error) {
    // Error handled by API helper
  }
});

// =====================================================
// Delete Vocabulary
// =====================================================

async function editVocab(id) {
  try {
    const vocab = await VocaPro.API.get(`/api/v1/vocab/${id}`);

    // Populate form fields
    document.getElementById('editVocabId').value = vocab.id;
    document.getElementById('editWord').value = vocab.word;
    document.getElementById('editLanguage').value = vocab.language;
    document.getElementById('editPartOfSpeech').value = vocab.partOfSpeech || '';
    document.getElementById('editIpa').value = vocab.ipa || '';
    document.getElementById('editDifficulty').value = vocab.difficulty;
    document.getElementById('editDefinitions').value = vocab.definitions.join('\n');
    document.getElementById('editExamples').value = vocab.examples?.join('\n') || '';
    document.getElementById('editNotes').value = vocab.notes || '';

    // Select tags
    const tagSelect = document.getElementById('editVocabTags');
    const vocabTagIds = vocab.tags.map((t) => t.id);
    Array.from(tagSelect.options).forEach((option) => {
      option.selected = vocabTagIds.includes(option.value);
    });

    // Open edit modal
    VocaPro.Modal.open('editVocabModal');
  } catch (error) {
    VocaPro.Toasts.show('Error', 'Failed to load vocabulary', 'error');
  }
}

async function deleteVocab(id) {
  if (!confirm('Are you sure you want to delete this vocabulary?')) return;

  try {
    await VocaPro.API.delete(`/api/v1/vocab/${id}`);
    VocaPro.Toasts.show('Success', 'Vocabulary deleted', 'success');
    loadVocabulary();
  } catch (error) {
    // Error handled by API helper
  }
}

// =====================================================
// Tags Management
// =====================================================

async function loadTags() {
  try {
    const { data } = await VocaPro.API.get('/api/v1/tags');
    allTags = data;
    renderTags(data);
    populateTagsSelect(); // Populate select dropdowns
  } catch (error) {
    document.getElementById('tagsGrid').innerHTML =
      '<p style="text-align: center; color: var(--text-secondary)">Failed to load tags</p>';
  }
}

function renderTags(tags) {
  const grid = document.getElementById('tagsGrid');

  if (tags.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary)">No tags yet</p>';
    return;
  }

  grid.innerHTML = tags
    .map(
      (tag) => `
    <div class="glass-card" style="border-left: 4px solid ${tag.color || '#667eea'}">
      <div class="flex justify-between items-center mb-sm">
        <h3 style="margin: 0">${tag.name}</h3>
        <button class="btn btn-small btn-danger" onclick="deleteTag('${tag.id}')">🗑️</button>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.875rem">${
        tag.description || 'No description'
      }</p>
      <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: var(--spacing-sm)">${
        tag.vocabularyCount || 0
      } vocabularies</p>
    </div>
  `
    )
    .join('');
}

document.getElementById('saveTagBtn').addEventListener('click', async () => {
  const form = document.getElementById('addTagForm');
  const formData = new FormData(form);

  const data = {
    name: formData.get('name'),
    color: formData.get('color'),
    description: formData.get('description') || undefined,
  };

  try {
    await VocaPro.API.post('/api/v1/tags', data);
    VocaPro.Toasts.show('Success', 'Tag created successfully', 'success');
    VocaPro.Modal.close('addTagModal');
    form.reset();
    loadTags();
  } catch (error) {
    // Error handled by API helper
  }
});

async function deleteTag(id) {
  if (!confirm('Delete this tag? It will be removed from all vocabularies.')) return;

  try {
    await VocaPro.API.delete(`/api/v1/tags/${id}`);
    VocaPro.Toasts.show('Success', 'Tag deleted', 'success');
    loadTags();
  } catch (error) {
    // Error handled by API helper
  }
}

// =====================================================
// Import/Export
// =====================================================

// Flag to prevent multiple simultaneous imports
let isImporting = false;

// Shared import handler
async function handleImport(files, progressContainerId = 'progressContainer') {
  if (isImporting) {
    console.log('Import already in progress, ignoring...');
    return;
  }

  isImporting = true;

  const file = files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', file.name.endsWith('.json') ? 'json' : 'csv');

  const progressContainer = document.getElementById(progressContainerId);
  if (progressContainer) {
    progressContainer.style.display = 'block';
  }
  VocaPro.updateProgress(50);

  try {
    const response = await fetch('/api/v1/import', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.details || 'Import failed');
    }

    VocaPro.updateProgress(100);

    // Create message based on import results
    let message = `Imported ${result.imported} vocabularies`;
    if (result.skipped > 0) {
      message += `, skipped ${result.skipped} duplicates`;
    }

    VocaPro.Toasts.show('Success', message, 'success');
    setTimeout(() => {
      if (progressContainer) {
        progressContainer.style.display = 'none';
      }
      VocaPro.updateProgress(0);
      loadVocabulary();
      VocaPro.Modal.close('importModal');
      isImporting = false;
    }, 1000);
  } catch (error) {
    VocaPro.updateProgress(0);
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
    VocaPro.Toasts.show('Error', error.message || 'Import failed', 'error');
    console.error('Import error:', error);
    isImporting = false;
  }
}

// Initialize modal drop zone
function initializeImport() {
  console.log('Initializing modal import drag-drop');
  VocaPro.initDragDrop('dropZone', 'fileInput', handleImport);
}

// Initialize tab drop zone
VocaPro.initDragDrop('dropZoneTab', 'fileInputTab', handleImport);

document.getElementById('exportCSV').addEventListener('click', () => {
  window.location.href = '/api/v1/export?format=csv';
  VocaPro.Toasts.show('Success', 'Exporting CSV...', 'success');
});

document.getElementById('exportJSON').addEventListener('click', () => {
  window.location.href = '/api/v1/export?format=json';
  VocaPro.Toasts.show('Success', 'Exporting JSON...', 'success');
});

// =====================================================
// Filters
// =====================================================

const searchDebounced = VocaPro.debounce((value) => {
  currentFilters.search = value;
  currentPage = 1;
  loadVocabulary();
}, 500);

document
  .getElementById('searchInput')
  .addEventListener('input', (e) => searchDebounced(e.target.value));

document.getElementById('languageFilter').addEventListener('change', (e) => {
  currentFilters.language = e.target.value;
  currentPage = 1;
  loadVocabulary();
});

document.getElementById('difficultyFilter').addEventListener('change', (e) => {
  currentFilters.difficulty = e.target.value;
  currentPage = 1;
  loadVocabulary();
});

document.getElementById('tagFilter').addEventListener('change', (e) => {
  currentFilters.tags = e.target.value;
  currentPage = 1;
  loadVocabulary();
});

// =====================================================
// Pagination
// =====================================================

document.getElementById('pagePrev').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadVocabulary();
  }
});

document.getElementById('pageNext').addEventListener('click', () => {
  currentPage++;
  loadVocabulary();
});

// =====================================================
// Logout
// =====================================================

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await VocaPro.API.post('/auth/logout');
    window.location.href = '/';
  } catch (error) {
    // Error handled
  }
});

// =====================================================
// Tab Switching
// =====================================================

document.querySelectorAll('[data-tab]').forEach((tab) => {
  tab.addEventListener('click', () => {
    const tabId = tab.getAttribute('data-tab');
    if (tabId === 'tags') {
      loadTags();
    }
  });
});

// =====================================================
// Initialize
// =====================================================

loadVocabulary();
loadTags(); // Load tags on page load for select dropdowns

// Expose functions to global scope
window.initializeImport = initializeImport;
