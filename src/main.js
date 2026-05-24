import './styles.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const pageSize = 5;

const state = {
  destinations: [],
  pagination: { page: 1, pageSize, total: 0, totalPages: 1 },
  editing: null,
  loading: false,
  message: '',
  error: ''
};

const app = document.querySelector('#app');

function emptyForm() {
  return { name: '', country: '', category: '', description: '', rating: '4.5' };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.error || Object.values(body.errors || {})[0] || 'Request failed.';
    throw new Error(message);
  }

  return body;
}

async function loadDestinations(page = state.pagination.page) {
  state.loading = true;
  state.error = '';
  render();

  try {
    const result = await apiRequest(`/api/destinations?page=${page}&pageSize=${pageSize}`);
    state.destinations = result.data;
    state.pagination = result.pagination;
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

function destinationFromForm(form) {
  return {
    name: form.name.value,
    country: form.country.value,
    category: form.category.value,
    description: form.description.value,
    rating: Number(form.rating.value)
  };
}

async function saveDestination(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const destination = destinationFromForm(form);
  const isEditing = Boolean(state.editing?.id);

  state.error = '';
  state.message = '';
  render();

  try {
    await apiRequest(isEditing ? `/api/destinations/${state.editing.id}` : '/api/destinations', {
      method: isEditing ? 'PUT' : 'POST',
      body: JSON.stringify(destination)
    });

    state.editing = null;
    state.message = isEditing ? 'Destination updated.' : 'Destination added.';
    await loadDestinations(isEditing ? state.pagination.page : 1);
  } catch (error) {
    state.error = error.message;
    render();
  }
}

async function deleteDestination(id, name) {
  if (!window.confirm(`Delete ${name}?`)) {
    return;
  }

  state.error = '';
  state.message = '';
  render();

  try {
    await apiRequest(`/api/destinations/${id}`, { method: 'DELETE' });
    state.message = 'Destination deleted.';
    const nextPage = state.destinations.length === 1 && state.pagination.page > 1
      ? state.pagination.page - 1
      : state.pagination.page;
    await loadDestinations(nextPage);
  } catch (error) {
    state.error = error.message;
    render();
  }
}

function startEdit(id) {
  state.editing = state.destinations.find((destination) => destination.id === id) || null;
  state.message = '';
  state.error = '';
  render();
  document.querySelector('#destinationForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
  state.editing = null;
  state.error = '';
  render();
}

function formMarkup() {
  const values = state.editing || emptyForm();
  const title = state.editing ? 'Edit destination' : 'Add destination';
  const action = state.editing ? 'Save changes' : 'Add destination';

  return `
    <form class="form-panel" id="destinationForm">
      <div class="form-heading">
        <h2>${title}</h2>
        ${state.editing ? '<button class="secondary" type="button" data-action="cancel">Cancel</button>' : ''}
      </div>
      <div class="form-grid">
        <label>Name<input name="name" required maxlength="120" value="${escapeHtml(values.name)}" /></label>
        <label>Country<input name="country" required maxlength="80" value="${escapeHtml(values.country)}" /></label>
        <label>Category<input name="category" required maxlength="60" value="${escapeHtml(values.category)}" /></label>
        <label>Rating<input name="rating" required type="number" min="0" max="5" step="0.1" value="${escapeHtml(values.rating)}" /></label>
        <label class="wide">Description<textarea name="description" required rows="3">${escapeHtml(values.description)}</textarea></label>
      </div>
      <button class="primary" type="submit">${action}</button>
    </form>
  `;
}

function tableMarkup() {
  if (state.loading) {
    return '<div class="empty-state">Loading destinations...</div>';
  }

  if (state.destinations.length === 0) {
    return '<div class="empty-state">No destinations found.</div>';
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Country</th>
            <th>Category</th>
            <th>Description</th>
            <th>Rating</th>
            <th class="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.destinations.map((destination) => `
            <tr>
              <td><strong>${escapeHtml(destination.name)}</strong></td>
              <td>${escapeHtml(destination.country)}</td>
              <td>${escapeHtml(destination.category)}</td>
              <td>${escapeHtml(destination.description)}</td>
              <td>${Number(destination.rating).toFixed(1)}</td>
              <td class="actions">
                <button class="secondary" type="button" data-action="edit" data-id="${destination.id}">Edit</button>
                <button class="danger" type="button" data-action="delete" data-id="${destination.id}" data-name="${escapeHtml(destination.name)}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function paginationMarkup() {
  const { page, totalPages, total } = state.pagination;
  return `
    <div class="pagination">
      <p>Page ${page} of ${Math.max(totalPages, 1)} · ${total} destinations</p>
      <div>
        <button class="secondary" type="button" data-action="previous" ${page <= 1 ? 'disabled' : ''}>Previous</button>
        <button class="secondary" type="button" data-action="next" ${page >= totalPages ? 'disabled' : ''}>Next</button>
      </div>
    </div>
  `;
}

function render() {
  app.innerHTML = `
    <main class="shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">COS30043 Lab 10</p>
          <h1>Travel Destinations</h1>
        </div>
      </header>

      ${state.message ? `<div class="notice success">${escapeHtml(state.message)}</div>` : ''}
      ${state.error ? `<div class="notice error">${escapeHtml(state.error)}</div>` : ''}

      <section class="layout">
        ${formMarkup()}
        <section class="panel" aria-label="Travel destination records">
          <div class="panel-heading">
            <h2>Destination records</h2>
            <button class="secondary" type="button" data-action="refresh">Refresh</button>
          </div>
          ${tableMarkup()}
          ${paginationMarkup()}
        </section>
      </section>
    </main>
  `;

  document.querySelector('#destinationForm')?.addEventListener('submit', saveDestination);
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const id = Number(button.dataset.id);

  if (action === 'edit') startEdit(id);
  if (action === 'delete') deleteDestination(id, button.dataset.name);
  if (action === 'cancel') cancelEdit();
  if (action === 'previous') loadDestinations(state.pagination.page - 1);
  if (action === 'next') loadDestinations(state.pagination.page + 1);
  if (action === 'refresh') loadDestinations(state.pagination.page);
});

render();
loadDestinations(1);
