import React from 'react';
import type { FormData } from '../../hooks/useFormPersistence';
import { useApiOptions } from '../../hooks/useApiOptions';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const Step5Guardian: React.FC<StepProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const { options: parentescos, loading: loadingParentescos } = useApiOptions('parentesco');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <h2 className="text-2xl font-bold">Información del Acudiente</h2>
      <p className="text-sm text-gray-600">
        Como eres menor de 18 años, necesitamos la información de tu acudiente.
      </p>
      
      <label className="grid gap-1">
        <span className="text-sm font-medium">Nombre Completo del Acudiente *</span>
        <input
          type="text"
          required
          value={formData.nombreAcudiente}
          onChange={(e) => updateFormData({ nombreAcudiente: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Nombre del acudiente"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Número de Contacto del Acudiente *</span>
        <input
          type="tel"
          required
          value={formData.numeroContactoAcudiente}
          onChange={(e) => updateFormData({ numeroContactoAcudiente: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Teléfono del acudiente"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Parentesco *</span>
        <select
          required
          value={formData.parentesco}
          onChange={(e) => updateFormData({ parentesco: e.target.value })}
          className="border rounded px-3 py-2"
          disabled={loadingParentescos}
        >
          <option value="">Selecciona...</option>
          {parentescos.map((parentesco: any) => (
            <option key={parentesco.id} value={parentesco.id}>
              {parentesco.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Dirección del Acudiente *</span>
        <input
          type="text"
          required
          value={formData.direccionAcudiente}
          onChange={(e) => updateFormData({ direccionAcudiente: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Dirección del acudiente"
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
