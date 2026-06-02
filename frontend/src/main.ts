import './style.css';

type User = {
  id: string;
  email: string;
};

type CalendarEvent = {
  id: string;
  startsAt: string;
  name: string;
  description: string;
};

type AuthResponse = {
  user: User;
  token: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const tokenKey = 'calendar_token';
const userKey = 'calendar_user';

let token = localStorage.getItem(tokenKey);
let user = readStoredUser();
let events: CalendarEvent[] = [];
let authMode: 'login' | 'register' = 'login';

const app = document.querySelector<HTMLDivElement>('#app')!;

render();

function render() {
  app.innerHTML = `
    <main class="shell">
      <section class="topbar">
        <div>
          <p class="eyebrow">Local Calendar</p>
          <h1>${user ? 'Your events' : 'Sign in to plan your day'}</h1>
        </div>
        ${
          user
            ? `<button class="secondary" id="logout" type="button">Sign out</button>`
            : ''
        }
      </section>

      ${
        user
          ? calendarTemplate()
          : authTemplate()
      }
    </main>
  `;

  if (user) {
    bindCalendar();
    void loadEvents();
  } else {
    bindAuth();
  }
}

function authTemplate() {
  return `
    <section class="auth-panel">
      <div class="mode-switch" role="tablist" aria-label="Authentication mode">
        <button class="${authMode === 'login' ? 'active' : ''}" id="login-mode" type="button">Login</button>
        <button class="${authMode === 'register' ? 'active' : ''}" id="register-mode" type="button">Register</button>
      </div>
      <form id="auth-form" class="form">
        <label>
          Email
          <input name="email" type="email" autocomplete="email" required>
        </label>
        <label>
          Password
          <input name="password" type="password" autocomplete="${authMode === 'login' ? 'current-password' : 'new-password'}" minlength="8" required>
        </label>
        <button type="submit">${authMode === 'login' ? 'Login' : 'Create account'}</button>
        <p class="message" id="auth-message"></p>
      </form>
    </section>
  `;
}

function calendarTemplate() {
  return `
    <section class="workspace">
      <form id="event-form" class="form event-form">
        <label>
          Date and time
          <input name="startsAt" type="datetime-local" required>
        </label>
        <label>
          Event name
          <input name="name" type="text" maxlength="120" required>
        </label>
        <label>
          Description
          <textarea name="description" rows="5" maxlength="1000"></textarea>
        </label>
        <button type="submit">Add event</button>
        <p class="message" id="event-message"></p>
      </form>
      <section class="events">
        <div class="events-head">
          <h2>Calendar</h2>
          <span>${user?.email}</span>
        </div>
        <div id="events-list" class="events-list">
          <p class="empty">Loading events...</p>
        </div>
      </section>
    </section>
  `;
}

function bindAuth() {
  document.querySelector<HTMLButtonElement>('#login-mode')?.addEventListener('click', () => {
    authMode = 'login';
    render();
  });

  document.querySelector<HTMLButtonElement>('#register-mode')?.addEventListener('click', () => {
    authMode = 'register';
    render();
  });

  document.querySelector<HTMLFormElement>('#auth-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget as HTMLFormElement;
    const form = new FormData(formElement);
    const message = document.querySelector<HTMLParagraphElement>('#auth-message')!;

    try {
      const result = await request<AuthResponse>(`/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify({
          email: String(form.get('email')),
          password: String(form.get('password')),
        }),
      });

      token = result.token;
      user = result.user;
      localStorage.setItem(tokenKey, result.token);
      localStorage.setItem(userKey, JSON.stringify(result.user));
      render();
    } catch (error) {
      message.textContent = errorMessage(error);
    }
  });
}

function bindCalendar() {
  document.querySelector<HTMLButtonElement>('#logout')?.addEventListener('click', () => {
    token = null;
    user = null;
    events = [];
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    render();
  });

  document.querySelector<HTMLFormElement>('#event-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget as HTMLFormElement;
    const form = new FormData(formElement);
    const message = document.querySelector<HTMLParagraphElement>('#event-message')!;

    try {
      await request<CalendarEvent>('/events', {
        method: 'POST',
        body: JSON.stringify({
          startsAt: new Date(String(form.get('startsAt'))).toISOString(),
          name: String(form.get('name')),
          description: String(form.get('description')),
        }),
      });

      formElement.reset();
      message.textContent = '';
      await loadEvents();
    } catch (error) {
      message.textContent = errorMessage(error);
    }
  });

  document.querySelector<HTMLDivElement>('#events-list')?.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-delete-event]');

    if (!button) {
      return;
    }

    await request(`/events/${button.dataset.deleteEvent}`, { method: 'DELETE' });
    await loadEvents();
  });
}

async function loadEvents() {
  try {
    events = await request<CalendarEvent[]>('/events');
    renderEvents();
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      token = null;
      user = null;
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      render();
      return;
    }

    document.querySelector<HTMLDivElement>('#events-list')!.innerHTML =
      `<p class="empty">${errorMessage(error)}</p>`;
  }
}

function renderEvents() {
  const list = document.querySelector<HTMLDivElement>('#events-list')!;

  if (events.length === 0) {
    list.innerHTML = '<p class="empty">No events yet.</p>';
    return;
  }

  list.innerHTML = events.map((event) => `
    <article class="event-card">
      <time datetime="${event.startsAt}">
        <strong>${formatDate(event.startsAt)}</strong>
        <span>${formatTime(event.startsAt)}</span>
      </time>
      <div>
        <h3>${escapeHtml(event.name)}</h3>
        <p>${escapeHtml(event.description || 'No description')}</p>
      </div>
      <button class="icon-button" type="button" data-delete-event="${event.id}" aria-label="Delete ${escapeHtml(event.name)}">Delete</button>
    </article>
  `).join('');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function readStoredUser() {
  const rawUser = localStorage.getItem(userKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return entities[character];
  });
}
