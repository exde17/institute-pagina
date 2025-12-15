// src/lib/matriculaApi.ts
const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://apifcm.bg3sas.com/api';

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
  documentoAcudiente?: File; // Opcional: solo para menores de 18 años
  formularioMatricula: File;
}

export interface Matricula {
  id: string;
  documentoEstudiante: string;
  diplomaCertificadoGrado10: string;
  documentoAcudiente: string | null;
  formularioMatricula: string;
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
}

/**
 * Obtiene las inscripciones del usuario autenticado
 */
export async function getInscripcionesUsuario(userId: string, token: string): Promise<Inscripcion[]> {
  const res = await fetch(`${API_BASE}/inscripcion/user/${userId}`, {
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
  const res = await fetch(`${API_BASE}/matricula`, {
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
 * Genera un link de pago para una matrícula
 */
export async function generarLinkPagoMatricula(
  matriculaId: string,
  monto: number,
  nombreCompleto: string,
  nombrePrograma: string,
  token: string
): Promise<{ url: string }> {
  // Convertir el monto de miles de pesos a centavos (Wompi requiere amount_in_cents)
  const amountInCents = Math.round(monto * 1000 * 100); // miles * 1000 para pesos, * 100 para centavos
  
  // Construir el nombre y descripción del link de pago
  const paymentLinkName = `Matrícula de ${nombreCompleto} al programa ${nombrePrograma}`;
  const paymentLinkDescription = "Pago de matrícula";
  
  // Obtener la clave privada de Wompi desde variables de entorno
  const wompiPrivateKey = import.meta.env.WOMPI_PRIVATE_KEY || 'prv_test_xX2lSTCi4QdKr6BGFmht6Xzu2yhqcJf9';
  const appEnv = import.meta.env.APP_ENV || 'dev';
  const wompiUrl = appEnv === 'prod' 
    ? (import.meta.env.PUBLIC_WOMPI_URL || 'https://api.wompi.co/v1')
    : (import.meta.env.SANDBOX_WOMPI_URL || 'https://sandbox.wompi.co/v1');
  
  // Información para debug
  console.log('Generando link de pago para matrícula:', {
    matriculaId,
    monto,
    amountInCents,
    nombreCompleto,
    nombrePrograma,
  });
  
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
      single_use: true,
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
  
  const paymentLinkId = wompiData?.data?.id;
  
  if (!paymentLinkId) {
    throw new Error('No se recibió el ID del link de pago de Wompi');
  }
  
  const checkoutUrl = `https://checkout.wompi.co/l/${paymentLinkId}`;
  
  console.log('Link de pago generado:', {
    paymentLinkId,
    checkoutUrl,
    wompiData,
  });
  
  return { url: checkoutUrl };
}

/**
 * Envía los documentos de matrícula
 */
export async function submitMatricula(data: MatriculaDocuments, token: string): Promise<any> {
  const formData = new FormData();
  
  // Agregar el ID de la inscripción y del estudiante como campos de texto
  formData.append('inscripcionId', data.inscripcionId);
  formData.append('estudianteId', data.estudianteId);
  
  // Agregar todos los archivos
  formData.append('documentoEstudiante', data.documentoEstudiante);
  formData.append('diplomaCertificadoGrado10', data.diplomaCertificadoGrado10);
  
  // Agregar documento del acudiente solo si está presente (menores de 18)
  if (data.documentoAcudiente) {
    formData.append('documentoAcudiente', data.documentoAcudiente);
  }
  
  formData.append('formularioMatricula', data.formularioMatricula);

  const res = await fetch(`${API_BASE}/matricula`, {
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
