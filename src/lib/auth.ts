// src/lib/auth.ts
const API_BASE = import.meta.env.PUBLIC_API_BASE || 'http://localhost:3000/api';

export type User = { 
  id: string; 
  firstName?: string; 
  lastName?: string; 
  name?: string; 
  email: string;
  isActive?: boolean;
  role?: string[];
  createAt?: string;
  updatedAt?: string;
};

export type AuthResponse = User & { token: string };

export function saveAuth(token: string, user: User) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}
export function getUser(): User | null {
  const raw = localStorage.getItem('auth_user');
  return raw ? (JSON.parse(raw) as User) : null;
}
export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Tu API puede responder { message: [...] } o { message: '...' } o { error: '...' }
    const arr = Array.isArray(data?.message) ? data.message : null;
    const msg = arr ? arr.join(' • ') : (data?.message || data?.error || 'Error de red');
    throw new Error(msg);
  }
  return data as T;
}

// Función genérica para peticiones GET con token
async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers,
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const arr = Array.isArray(data?.message) ? data.message : null;
    const msg = arr ? arr.join(' • ') : (data?.message || data?.error || 'Error de red');
    throw new Error(msg);
  }
  return data as T;
}

// 👇 Ahora el registro usa firstName / lastName
export function registerReq(data: { firstName: string; lastName: string; email: string; password: string }) {
  return apiPost<AuthResponse>('/auth/register', data);
}
export function loginReq(data: { email: string; password: string }) {
  return apiPost<AuthResponse>('/auth/login', data);
}

// 👇 Nueva función para obtener programas
export type Programa = {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: number;
  costo: number;
};

export function getProgramas() {
  return apiGet<Programa[]>('/programas');
}

// 👇 Nueva función para obtener noticias
export type Noticia = {
  id: string;
  titulo: string;
  contenido: string;
  fecha: string;
};

export function getNoticias() {
  return apiGet<Noticia[]>('/noticias');
}
