import { useState, useEffect } from 'react';

export interface ApiOption {
  id: string;
  name: string;
  [key: string]: any;
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://apifcm.bg3sas.com';

export function useApiOptions(endpoint: string) {
  const [options, setOptions] = useState<ApiOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint) return;

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/${endpoint}`);
        if (!response.ok) {
          throw new Error(`Error al cargar ${endpoint}`);
        }
        const data = await response.json();
        setOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [endpoint]);

  return { options, loading, error };
}

// Hook para cargar municipios filtrados por departamento
export function useMunicipios(departamentoId: string) {
  const [municipios, setMunicipios] = useState<ApiOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!departamentoId) {
      setMunicipios([]);
      return;
    }

    const fetchMunicipios = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/municipio?departamentoId=${departamentoId}`);
        if (!response.ok) {
          throw new Error('Error al cargar municipios');
        }
        const data = await response.json();
        setMunicipios(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setMunicipios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipios();
  }, [departamentoId]);

  return { municipios, loading, error };
}
