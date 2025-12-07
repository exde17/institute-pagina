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
    // Manejar diferentes tipos de errores
    const arr = Array.isArray(data?.message) ? data.message : null;
    let msg = arr ? arr.join(' • ') : (data?.message || data?.error || 'Error de red');
    
    // Mensajes específicos según el código de estado
    if (res.status === 401) {
      msg = 'Correo o contraseña incorrectos';
    } else if (res.status === 404) {
      msg = 'Usuario no encontrado';
    } else if (res.status === 403) {
      msg = 'Acceso denegado';
    } else if (res.status >= 500) {
      msg = 'Error del servidor. Intenta más tarde';
    }
    
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

// 👇 Ahora el registro usa firstName / lastName / telephone / address
export function registerReq(data: { firstName: string; lastName: string; email: string; password: string; telephone: string; address: string }) {
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

// 👇 Tipos y funciones para inscripciones y pagos
export type Pago = {
  id: string;
  monto: string;
  metodo: string | null;
  createdAt: string;
  updatedAt: string;
  referenciaPago: string;
  wompi_transaccion: string | null;
  fechaPago: string | null;
  raw_response: any | null;
  estado: 'Pendiente' | 'Completado' | 'Fallido';
};

export type Inscripcion = {
  id: string;
  observacion: string;
  estado: boolean;
  fechaInscripcion: string;
  user: User;
  programa: Programa & {
    imagen: string;
    modalidad: string;
    categoria: string;
    badge: string;
    badgeColor: string;
    semestres: any[];
    detalles: string[];
  };
  pagos: Pago[];
};

export function getInscripciones() {
  return apiGet<Inscripcion[]>('/inscripcion');
}

// Función para generar link de pago con Wompi
export async function generarLinkPago(
  pagoId: string, 
  monto: number, 
  nombreCompleto: string, 
  nombrePrograma: string
): Promise<{ url: string }> {
  const token = getToken();
  
  // Convertir el monto a centavos (Wompi requiere amount_in_cents)
  const amountInCents = Math.round(monto * 100);
  
  // Construir el nombre y descripción del link de pago
  const paymentLinkName = `Inscripción de ${nombreCompleto} al programa ${nombrePrograma}`;
  const paymentLinkDescription = "Pago de inscripción";
  
  // Obtener la clave privada de Wompi desde variables de entorno
  const wompiPrivateKey = import.meta.env.WOMPI_PRIVATE_KEY || 'prv_test_xX2lSTCi4QdKr6BGFmht6Xzu2yhqcJf9';
  const appEnv = import.meta.env.APP_ENV || 'dev';
  const wompiUrl = appEnv === 'prod' 
    ? (import.meta.env.PUBLIC_WOMPI_URL || 'https://api.wompi.co/v1')
    : (import.meta.env.SANDBOX_WOMPI_URL || 'https://sandbox.wompi.co/v1');
  
  // Crear el link de pago en Wompi
  const wompiResponse = await fetch(`${wompiUrl}/payment_links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${wompiPrivateKey}`,
    },
    body: JSON.stringify({
      name: paymentLinkName,
      description: paymentLinkDescription,
      single_use: true, // El link solo puede usarse una vez
      collect_shipping: false,
      currency: "COP",
      amount_in_cents: amountInCents,
    }),
  });
  
  const wompiData = await wompiResponse.json().catch(() => ({}));
  
  if (!wompiResponse.ok) {
    const errorMsg = wompiData?.error?.message || wompiData?.message || 'Error al crear link de pago en Wompi';
    throw new Error(errorMsg);
  }
  
  // Obtener el ID del link de pago creado
  const paymentLinkId = wompiData?.data?.id;
  
  if (!paymentLinkId) {
    throw new Error('No se recibió el ID del link de pago de Wompi');
  }
  
  // Construir la URL del checkout de Wompi
  const checkoutUrl = `https://checkout.wompi.co/l/${paymentLinkId}`;
  
  // Opcionalmente, actualizar el backend con el link generado
  try {
    await fetch(`${API_BASE}/pagos/${pagoId}/link-pago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        wompi_link_id: paymentLinkId,
        url: checkoutUrl,
      }),
    });
  } catch (error) {
    console.warn('No se pudo actualizar el backend con el link de pago:', error);
    // No lanzamos error aquí porque el link ya fue creado exitosamente
  }
  
  return { url: checkoutUrl };
}

export function getNoticias() {
  return apiGet<Noticia[]>('/noticias');
}
