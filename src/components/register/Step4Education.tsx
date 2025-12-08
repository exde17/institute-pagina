import React from 'react';
import type { FormData } from '../../hooks/useFormPersistence';
import { useApiOptions, useMunicipios } from '../../hooks/useApiOptions';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const Step4Education: React.FC<StepProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const { options: nivelesEducativos, loading: loadingNiveles } = useApiOptions('nivel-educativo');
  const { options: departamentos, loading: loadingDeptos } = useApiOptions('departamento');
  const { municipios, loading: loadingMunicipios } = useMunicipios(
    formData.departamentoInstitucion
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <h2 className="text-2xl font-bold">Información Educativa</h2>
      
      <label className="grid gap-1">
        <span className="text-sm font-medium">Nivel Educativo</span>
        <select
          value={formData.nivelEducativo}
          onChange={(e) => updateFormData({ nivelEducativo: e.target.value })}
          className="border rounded px-3 py-2"
          disabled={loadingNiveles}
        >
          <option value="">Selecciona...</option>
          {nivelesEducativos.map((nivel: any) => (
            <option key={nivel.id} value={nivel.id}>
              {nivel.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Año de Certificación</span>
        <input
          type="text"
          value={formData.anioCertificacion}
          onChange={(e) => updateFormData({ anioCertificacion: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Ej: 2020"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Institución Educativa</span>
        <input
          type="text"
          value={formData.institucionEducativa}
          onChange={(e) => updateFormData({ institucionEducativa: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Nombre de la institución"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Departamento de la Institución</span>
        <select
          value={formData.departamentoInstitucion}
          onChange={(e) => {
            updateFormData({ 
              departamentoInstitucion: e.target.value,
              municipioInstitucion: '' // Reset municipio cuando cambia departamento
            });
          }}
          className="border rounded px-3 py-2"
          disabled={loadingDeptos}
        >
          <option value="">Selecciona...</option>
          {departamentos.map((depto: any) => (
            <option key={depto.id} value={depto.id}>
              {depto.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Municipio de la Institución</span>
        <select
          value={formData.municipioInstitucion}
          onChange={(e) => updateFormData({ municipioInstitucion: e.target.value })}
          className="border rounded px-3 py-2"
          disabled={!formData.departamentoInstitucion || loadingMunicipios}
        >
          <option value="">Selecciona...</option>
          {municipios.map((mun: any) => (
            <option key={mun.id} value={mun.id}>
              {mun.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-50"
        >
          Atrás
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-800 text-white rounded px-4 py-2 hover:bg-blue-900"
        >
          Continuar
        </button>
      </div>
    </form>
  );
};
