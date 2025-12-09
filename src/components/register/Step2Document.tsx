import React from 'react';
import type { FormData } from '../../hooks/useFormPersistence';
import { useApiOptions, useMunicipios } from '../../hooks/useApiOptions';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const Step2Document: React.FC<StepProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const { options: tiposDocumento, loading: loadingTipos } = useApiOptions('tipo-documento');
  const { options: departamentos, loading: loadingDeptos } = useApiOptions('departamento');
  const { municipios: municipiosNacimiento, loading: loadingMunicipiosNac } = useMunicipios(
    formData.departamentoNacimiento
  );
  const { municipios: municipiosExpedicion, loading: loadingMunicipiosExp } = useMunicipios(
    formData.lugarExpedicion ? formData.lugarExpedicion.split('-')[0] : ''
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
        <select
          value={formData.municipioNacimiento}
          onChange={(e) => updateFormData({ municipioNacimiento: e.target.value })}
          className="border rounded px-3 py-2"
          disabled={!formData.departamentoNacimiento || loadingMunicipiosNac}
        >
          <option value="">Selecciona...</option>
          {municipiosNacimiento.map((mun) => (
            <option key={mun.id} value={mun.id}>
              {mun.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Lugar de Expedición del Documento</span>
        <input
          type="text"
          value={formData.lugarExpedicion}
          onChange={(e) => updateFormData({ lugarExpedicion: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Ciudad/Municipio de expedición"
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
