import React, { useState } from 'react';
import type { FormData } from '../../hooks/useFormPersistence';
import { useApiOptions } from '../../hooks/useApiOptions';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onSubmit: () => Promise<void>;
  onBack?: () => void;
  isSubmitting: boolean;
  error: string;
}

export const Step6Final: React.FC<StepProps> = ({ 
  formData, 
  updateFormData, 
  onSubmit, 
  onBack,
  isSubmitting,
  error 
}) => {
  const { options: grupos, loading: loadingGrupos } = useApiOptions('grupos');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <h2 className="text-2xl font-bold">Información Adicional</h2>
      
      <div className="border rounded p-4 bg-gray-50">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={formData.limitacionFisicaCognitiva}
            onChange={(e) => updateFormData({ limitacionFisicaCognitiva: e.target.checked })}
            className="mt-1"
          />
          <span className="text-sm">
            ¿Tienes alguna limitación física o cognitiva que debamos conocer?
          </span>
        </label>
      </div>

      {formData.limitacionFisicaCognitiva && (
        <label className="grid gap-1">
          <span className="text-sm font-medium">Describe la limitación</span>
          <textarea
            value={formData.descripcionLimitacion}
            onChange={(e) => updateFormData({ descripcionLimitacion: e.target.value })}
            className="border rounded px-3 py-2"
            rows={3}
            placeholder="Por favor describe tu situación para poder brindarte el mejor apoyo"
          />
        </label>
      )}

      <div className="border rounded p-4 bg-gray-50 mt-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={formData.perteneceGrupoPoblacional}
            onChange={(e) => {
              updateFormData({ 
                perteneceGrupoPoblacional: e.target.checked,
                grupoId: e.target.checked ? formData.grupoId : ''
              });
            }}
            className="mt-1"
          />
          <span className="text-sm">
            ¿Perteneces a algún grupo poblacional?
          </span>
        </label>
      </div>

      {formData.perteneceGrupoPoblacional && (
        <label className="grid gap-1">
          <span className="text-sm font-medium">Selecciona el grupo poblacional</span>
          <select
            value={formData.grupoId}
            onChange={(e) => updateFormData({ grupoId: e.target.value })}
            className="border rounded px-3 py-2"
            required
            disabled={loadingGrupos}
          >
            <option value="">{loadingGrupos ? 'Cargando...' : 'Selecciona un grupo'}</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nombre}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="border rounded p-4 bg-blue-50 mt-4">
        <h3 className="font-semibold mb-2">Resumen de tu información</h3>
        <div className="text-sm space-y-1">
          <p><strong>Nombre:</strong> {formData.firstName} {formData.lastName}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Teléfono:</strong> {formData.telephone}</p>
          <p><strong>Documento:</strong> {formData.documentNumber}</p>
        </div>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 border border-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-800 text-white rounded px-4 py-2 hover:bg-blue-900 disabled:opacity-50"
        >
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  );
};
