// src/lib/matriculaApi.ts
const API_BASE = import.meta.env.PUBLIC_API_BASE || 'http://localhost:3000/api';

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
  estudianteId: string;
  documentoEstudiante: File;
  diplomaCertificadoGrado10: File;
  documentoAcudiente?: File; // Opcional: solo para menores de 18 años
  formularioMatricula: File;
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
 * Envía los documentos de matrícula
 */
export async function submitMatricula(data: MatriculaDocuments, token: string): Promise<any> {
  const formData = new FormData();
  
  // Agregar el ID del estudiante como campo de texto
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
