import React from 'react';
import type { FormData } from '../../hooks/useFormPersistence';
import { useApiOptions, useMunicipios } from '../../hooks/useApiOptions';
import { SearchableSelect } from './SearchableSelect';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const Step2Document: React.FC<StepProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const { options: tiposDocumento, loading: loadingTipos } = useApiOptions('tipo-documento');
  const { options: departamentos, loading: loadingDeptos } = useApiOptions('departamento');
  const { options: municipios, loading: loadingMunicipios } = useApiOptions('municipio');
  const { municipios: municipiosNacimiento, loading: loadingMunicipiosNac } = useMunicipios(
    formData.departamentoNacimiento
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <h2 className="text-2xl font-bold">Documento de Identidad</h2>
      
      <label className="grid gap-1">
        <span className="text-sm font-medium">Tipo de Documento *</span>
        <select
          required
          value={formData.tipoDocumento}
          onChange={(e) => updateFormData({ tipoDocumento: e.target.value })}
          className="border rounded px-3 py-2"
          disabled={loadingTipos}
        >
          <option value="">Selecciona...</option>
          {tiposDocumento.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Número de Documento *</span>
        <input
          type="text"
          required
          value={formData.documentNumber}
          onChange={(e) => updateFormData({ documentNumber: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Tu número de documento"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Departamento de Nacimiento</span>
        <select
          value={formData.departamentoNacimiento}
          onChange={(e) => {
            updateFormData({ 
              departamentoNacimiento: e.target.value,
              municipioNacimiento: '' // Reset municipio cuando cambia departamento
            });
          }}
          className="border rounded px-3 py-2"
          disabled={loadingDeptos}
        >
          <option value="">Selecciona...</option>
          {departamentos.map((depto) => (
            <option key={depto.id} value={depto.id}>
              {depto.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Municipio de Nacimiento</span>
        <SearchableSelect
          options={municipiosNacimiento}
          value={formData.municipioNacimiento}
          onChange={(val) => updateFormData({ municipioNacimiento: val })}
          placeholder="Buscar municipio..."
          disabled={!formData.departamentoNacimiento || loadingMunicipiosNac}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Lugar de Expedición del Documento</span>
        <SearchableSelect
          options={municipios}
          value={formData.lugarExpedicion}
          onChange={(val) => updateFormData({ lugarExpedicion: val })}
          placeholder="Buscar municipio..."
          disabled={loadingMunicipios}
        />
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
