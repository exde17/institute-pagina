import axios from 'axios';

// Usar variable de entorno o hardcodear la URL como fallback
const API_URL = import.meta.env.PUBLIC_API_URL || 'https://apifcm.bg3sas.com';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export interface Semestre {
  nombre: string;
  numero?: string;
  asignaturas?: string[];
  materias?: string[];
}

export interface Programa {
  id: string;
  nombre: string;
  imagen: string;
  descripcion: string;
  duracion: number;
  modalidad: string;
  categoria: string;
  badge: string;
  badgeColor: string;
  semestres: Semestre[];
  detalles: string[];
  costo: number;
}

export interface CreateProgramaDTO {
  nombre: string;
  imagen: string;
  descripcion: string;
  duracion: number;
  modalidad: string;
  categoria: string;
  badge: string;
  badgeColor: string;
  semestres: Semestre[];
  detalles: string[];
  costo: number;
}

export interface UpdateProgramaDTO {
  nombre?: string;
  imagen?: string;
  descripcion?: string;
  duracion?: number;
  modalidad?: string;
  categoria?: string;
  badge?: string;
  badgeColor?: string;
  semestres?: Semestre[];
  detalles?: string[];
  costo?: number;
}

export const programasApi = {
  // Crear programa
  crear: async (data: CreateProgramaDTO): Promise<Programa> => {
    const response = await axios.post(`${API_URL}/api/programas`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Obtener todos
  obtenerTodos: async (): Promise<Programa[]> => {
    const response = await axios.get(`${API_URL}/api/programas`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id: string): Promise<Programa> => {
    const response = await axios.get(`${API_URL}/api/programas/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Actualizar
  actualizar: async (id: string, data: UpdateProgramaDTO): Promise<Programa> => {
    const response = await axios.patch(`${API_URL}/api/programas/${id}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Eliminar
  eliminar: async (id: string): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_URL}/api/programas/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};
