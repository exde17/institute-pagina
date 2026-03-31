// src/lib/matriculaApi.ts
const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://apifcm.bg3sas.com';

export interface Inscripcion {
  id: string;
  observacion: string;
  estado: boolean;
  fechaInscripcion: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string | null;
    birthDate: string | null;
    nationality: string | null;
    barrio: string | null;
    email: string;
    isActive: boolean;
    role: string[];
    createAt: string;
    updatedAt: string;
    telephone: string;
    address: string;
    nombreAcudiente: string | null;
    numeroContactoAcudiente: string | null;
    direccionAcudiente: string | null;
    anioCertificacion: string | null;
    institucionEducativa: string | null;
    limitacionFisicaCognitiva: string | null;
    descripcionLimitacion: string | null;
  };
  programa: {
    id: string;
    nombre: string;
    imagen: string;
    descripcion: string;
    duracion: number;
    modalidad: string;
    categoria: string;
    badge?: string;
    badgeColor?: string;
    semestres?: any[];
    detalles?: string[];
    costo: string;
  };
  matriculas: any[];
}

export interface MatriculaDocuments {
  inscripcionId: string;
  estudianteId: string;
  documentoEstudiante: File;
  diplomaCertificadoGrado10: File;
  documentoAcudiente?: File;
  formularioMatricula: File;
  tipoPago?: 'CONTADO' | 'CUOTAS';
  planPagoId?: string;
  valorTotal?: number;
}

export type TipoPago = 'CONTADO' | 'CUOTAS';
export type EstadoMatricula = 'PENDIENTE_PAGO' | 'PAGO_PARCIAL' | 'PAGADO';
export type EstadoCuota = 'PENDIENTE' | 'PAGADO' | 'VENCIDO';

export interface Entidad {
  id: string;
  razonSocial: string;
  nit: string;
  direccion: string | null;
  correo: string | null;
  telefono: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanPagoPredefinido {
  id: string;
  nombre: string;
  numeroCuotas: number;
  descripcion: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cuota {
  id: string;
  numeroCuota: number;
  monto: number;
  pagado: boolean;
  fechaVencimiento: string;
  fechaPago: string | null;
  wompiLinkId: string | null;
  wompiTransaccion: string | null;
  estado: EstadoCuota;
  createdAt: string;
  updatedAt: string;
}

export interface Matricula {
  id: string;
  documentoEstudiante: string;
  diplomaCertificadoGrado10: string;
  documentoAcudiente: string | null;
  formularioMatricula: string;
  tipoPago: TipoPago | null;
  esBecado: boolean;
  estadoMatricula: EstadoMatricula;
  valorTotal: number | null;
  createdAt: string;
  updatedAt: string;
  estudiante: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    documentNumber: string | null;
    birthDate: string | null;
    address: string;
    nombreAcudiente: string | null;
    numeroContactoAcudiente: string | null;
    tipoDocumento: { id: string; nombre: string } | null;
    departamentoNacimiento: { id: string; nombre: string } | null;
    municipioNacimiento: { id: string; nombre: string } | null;
    institucionEducativa: string | null;
    limitacionFisicaCognitiva: boolean | null;
    descripcionLimitacion: string | null;
    grupo: { id: string; nombre: string } | null;
  };
  inscripcion: {
    id: string;
    observacion: string;
    estado: boolean;
    fechaInscripcion: string;
    programa: {
      id: string;
      nombre: string;
      imagen: string;
      descripcion: string;
      modalidad: string;
      duracion: number;
      categoria: string;
      badge?: string;
      badgeColor?: string;
      costo: string;
    };
  };
  entidad: Entidad | null;
  planPagoSeleccionado: PlanPagoPredefinido | null;
  cuotas: Cuota[];
}

export interface ResumenPago {
  matriculaId: string;
  tipoPago: TipoPago | null;
  esBecado: boolean;
  entidad: Entidad | null;
  estadoMatricula: EstadoMatricula;
  valorTotal: number | null;
  totalPagado: number;
  totalPendiente: number;
  numeroCuotas: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  cuotas: Cuota[];
}

/**
 * Obtiene las inscripciones del usuario autenticado
 */
export async function getInscripcionesUsuario(userId: string, token: string): Promise<Inscripcion[]> {
  const res = await fetch(`${API_BASE}/api/inscripcion/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron cargar las inscripciones`);
  }

  return res.json();
}

/**
 * Obtiene todas las matrículas (solo admin)
 */
export async function getAllMatriculas(token: string): Promise<Matricula[]> {
  const res = await fetch(`${API_BASE}/api/matricula`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron cargar las matrículas`);
  }

  return res.json();
}

/**
 * Obtiene los planes de pago predefinidos activos
 */
export async function getPlanesPagoPredefinidos(token: string): Promise<PlanPagoPredefinido[]> {
  const res = await fetch(`${API_BASE}/api/plan-pago-predefinido`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron cargar los planes de pago`);
  }

  return res.json();
}

/**
 * Genera un link de pago para una matrícula
 * @param matriculaId - ID de la matrícula
 * @param monto - Monto en miles (ej: 1500 = $1,500,000)
 * @param nombreCompleto - Nombre completo del estudiante
 * @param nombrePrograma - Nombre del programa
 * @param token - Token de autenticación
 * @param cuotaId - ID de la cuota (opcional, para pagos a cuotas)
 */
export async function generarLinkPagoMatricula(
  matriculaId: string,
  monto: number,
  nombreCompleto: string,
  nombrePrograma: string,
  token: string,
  cuotaId?: string
): Promise<{ url: string; linkId: string }> {
  const amountInCents = Math.round(monto * 1000 * 100);

  const paymentLinkName = `Matrícula de ${nombreCompleto} al programa ${nombrePrograma}`;
  const paymentLinkDescription = cuotaId
    ? "Pago de cuota de matrícula"
    : "Pago de matrícula";

  const wompiPrivateKey = import.meta.env.WOMPI_PRIVATE_KEY || 'prv_test_xX2lSTCi4QdKr6BGFmht6Xzu2yhqcJf9';
  const appEnv = import.meta.env.APP_ENV || 'dev';
  const wompiUrl = appEnv === 'prod'
    ? (import.meta.env.PUBLIC_WOMPI_URL || 'https://api.wompi.co/v1')
    : (import.meta.env.SANDBOX_WOMPI_URL || 'https://sandbox.wompi.co/v1');

  // El SKU contiene el identificador de referencia para el webhook de Wompi
  // Formato: "c:{uuid}" para cuotas o "m:{uuid}" para pago de contado
  // Se quitan los guiones del UUID para cumplir con el límite de 36 caracteres de Wompi
  const sku = cuotaId
    ? `c:${cuotaId.replace(/-/g, '')}`
    : `m:${matriculaId.replace(/-/g, '')}`;

  console.log('Generando link de pago para matrícula:', {
    matriculaId,
    cuotaId,
    monto,
    amountInCents,
    nombreCompleto,
    nombrePrograma,
    sku,
  });

  const wompiResponse = await fetch(`${wompiUrl}/payment_links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${wompiPrivateKey}`,
    },
    body: JSON.stringify({
      name: paymentLinkName,
      description: paymentLinkDescription,
      single_use: true,
      collect_shipping: false,
      currency: "COP",
      amount_in_cents: amountInCents,
      sku: sku,
    }),
  });

  const wompiData = await wompiResponse.json().catch(() => ({}));

  if (!wompiResponse.ok) {
    const errorMsg = wompiData?.error?.message || wompiData?.message || 'Error al crear link de pago en Wompi';
    throw new Error(errorMsg);
  }

  const paymentLinkId = wompiData?.data?.id;

  if (!paymentLinkId) {
    throw new Error('No se recibió el ID del link de pago de Wompi');
  }

  const checkoutUrl = `https://checkout.wompi.co/l/${paymentLinkId}`;

  console.log('Link de pago generado:', {
    paymentLinkId,
    checkoutUrl,
    sku,
    wompiData,
  });

  return { url: checkoutUrl, linkId: paymentLinkId };
}

/**
 * Envía los documentos de matrícula
 */
export async function submitMatricula(data: MatriculaDocuments, token: string): Promise<any> {
  const formData = new FormData();

  formData.append('inscripcionId', data.inscripcionId);
  formData.append('estudianteId', data.estudianteId);

  formData.append('documentoEstudiante', data.documentoEstudiante);
  formData.append('diplomaCertificadoGrado10', data.diplomaCertificadoGrado10);

  if (data.documentoAcudiente) {
    formData.append('documentoAcudiente', data.documentoAcudiente);
  }

  formData.append('formularioMatricula', data.formularioMatricula);

  if (data.tipoPago) {
    formData.append('tipoPago', data.tipoPago);
  }

  if (data.planPagoId) {
    formData.append('planPagoId', data.planPagoId);
  }

  if (data.valorTotal !== undefined) {
    formData.append('valorTotal', data.valorTotal.toString());
  }

  const res = await fetch(`${API_BASE}/api/matricula`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo enviar la matrícula`);
  }

  return res.json();
}

// ==================== ENTIDAD API ====================

/**
 * Obtiene todas las entidades
 */
export async function getAllEntidades(token: string): Promise<Entidad[]> {
  const res = await fetch(`${API_BASE}/api/entidad`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron cargar las entidades`);
  }

  return res.json();
}

/**
 * Obtiene entidades activas
 */
export async function getEntidadesActivas(token: string): Promise<Entidad[]> {
  const res = await fetch(`${API_BASE}/api/entidad/activas`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron cargar las entidades`);
  }

  return res.json();
}

/**
 * Crea una nueva entidad
 */
export async function createEntidad(
  data: { razonSocial: string; nit: string; direccion?: string; correo?: string; telefono?: string },
  token: string
): Promise<Entidad> {
  const res = await fetch(`${API_BASE}/api/entidad`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo crear la entidad`);
  }

  return res.json();
}

/**
 * Actualiza una entidad
 */
export async function updateEntidad(
  id: string,
  data: Partial<{ razonSocial: string; nit: string; direccion: string; correo: string; telefono: string; isActive: boolean }>,
  token: string
): Promise<Entidad> {
  const res = await fetch(`${API_BASE}/api/entidad/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo actualizar la entidad`);
  }

  return res.json();
}

/**
 * Elimina una entidad
 */
export async function deleteEntidad(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/entidad/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo eliminar la entidad`);
  }
}

// ==================== MATRICULA ADMIN API ====================

/**
 * Actualiza el tipo de pago de una matrícula
 */
export async function updateTipoPagoMatricula(
  matriculaId: string,
  data: { tipoPago: TipoPago; planPagoId?: string; valorTotal: number },
  token: string
): Promise<Matricula> {
  const res = await fetch(`${API_BASE}/api/matricula/${matriculaId}/tipo-pago`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo actualizar el tipo de pago`);
  }

  return res.json();
}

/**
 * Marca una matrícula como becada
 */
export async function markAsBecado(
  matriculaId: string,
  entidadId: string | null,
  token: string
): Promise<Matricula> {
  const res = await fetch(`${API_BASE}/api/matricula/${matriculaId}/becado`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      esBecado: true,
      entidadId,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo marcar como becado`);
  }

  return res.json();
}

/**
 * Quita el estado de becado de una matrícula
 */
export async function removeBecado(matriculaId: string, token: string): Promise<Matricula> {
  const res = await fetch(`${API_BASE}/api/matricula/${matriculaId}/becado`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      esBecado: false,
      entidadId: null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo quitar el estado de becado`);
  }

  return res.json();
}

/**
 * Obtiene las cuotas de una matrícula
 */
export async function getCuotasMatricula(matriculaId: string, token: string): Promise<Cuota[]> {
  const res = await fetch(`${API_BASE}/api/cuota/matricula/${matriculaId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron cargar las cuotas`);
  }

  return res.json();
}

/**
 * Marca una cuota como pagada
 */
export async function marcarCuotaPagada(cuotaId: string, token: string): Promise<Cuota> {
  const res = await fetch(`${API_BASE}/api/cuota/${cuotaId}/marcar-pagado`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo marcar la cuota como pagada`);
  }

  return res.json();
}

/**
 * Genera un link de pago para una cuota específica
 */
export async function generarLinkPagoCuota(
  cuotaId: string,
  email: string,
  token: string
): Promise<{ url: string; linkId: string }> {
  const res = await fetch(`${API_BASE}/api/cuota/${cuotaId}/generar-link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo generar el link de pago`);
  }

  return res.json();
}

/**
 * Obtiene el resumen de pago de una matrícula
 */
export async function getResumenPagoMatricula(matriculaId: string, token: string): Promise<ResumenPago> {
  const res = await fetch(`${API_BASE}/api/matricula/${matriculaId}/resumen-pago`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo obtener el resumen de pago`);
  }

  return res.json();
}

/**
 * Envía email con link de pago al estudiante/entidad
 * El link de Wompi ya debe estar generado
 * @param linkId - ID del link de pago de Wompi (payment_link_id) para asociar con la cuota/matrícula
 */
export async function enviarEmailLinkPago(
  matriculaId: string,
  email: string,
  linkPago: string,
  monto: number,
  cuotaId?: string,
  token?: string,
  linkId?: string
): Promise<{
  success: boolean;
  url: string;
  email: string;
  monto: number;
  conceptoPago: string;
  numeroCuota?: number;
  totalCuotas?: number;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/api/matricula/${matriculaId}/generar-link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, linkPago, monto, cuotaId, linkId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo enviar el link de pago`);
  }

  return res.json();
}

/**
 * Seed de planes de pago predefinidos
 */
export async function seedPlanesPago(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/plan-pago-predefinido/seed`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron crear los planes de pago`);
  }
}

// ==================== PLAN PAGO PREDEFINIDO CRUD API ====================

/**
 * Obtiene todos los planes de pago (incluyendo inactivos)
 */
export async function getAllPlanesPago(token: string): Promise<PlanPagoPredefinido[]> {
  const res = await fetch(`${API_BASE}/api/plan-pago-predefinido/todos`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron cargar los planes de pago`);
  }

  return res.json();
}

/**
 * Crea un nuevo plan de pago
 */
export async function createPlanPago(
  data: { nombre: string; numeroCuotas: number; descripcion?: string },
  token: string
): Promise<PlanPagoPredefinido> {
  const res = await fetch(`${API_BASE}/api/plan-pago-predefinido`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo crear el plan de pago`);
  }

  return res.json();
}

/**
 * Actualiza un plan de pago
 */
export async function updatePlanPago(
  id: string,
  data: Partial<{ nombre: string; numeroCuotas: number; descripcion: string; isActive: boolean }>,
  token: string
): Promise<PlanPagoPredefinido> {
  const res = await fetch(`${API_BASE}/api/plan-pago-predefinido/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo actualizar el plan de pago`);
  }

  return res.json();
}

/**
 * Elimina un plan de pago
 */
export async function deletePlanPago(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/plan-pago-predefinido/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo eliminar el plan de pago`);
  }
}

// ==================== USUARIOS API ====================

export interface Usuario {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string[];
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UsuariosResponse {
  data: Usuario[];
  pagination: PaginationInfo;
}

export interface GetUsuariosParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  email?: string;
}

/**
 * Obtiene usuarios con paginación y filtros (solo para admin)
 */
export async function getUsuarios(
  token: string,
  params?: GetUsuariosParams
): Promise<UsuariosResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.email) queryParams.append('email', params.email);

  const url = `${API_BASE}/api/auth/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudieron cargar los usuarios`);
  }

  return res.json();
}

/**
 * Cambia la contraseña de un usuario
 */
export async function changeUserPassword(userId: string, newPassword: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/change-password/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `Error ${res.status}: No se pudo cambiar la contraseña`);
  }
}
