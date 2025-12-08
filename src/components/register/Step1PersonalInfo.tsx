import React from 'react';
import type { FormData } from '../../hooks/useFormPersistence';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const Step1PersonalInfo: React.FC<StepProps> = ({ formData, updateFormData, onNext }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <h2 className="text-2xl font-bold">Datos Personales</h2>
      
      <label className="grid gap-1">
        <span className="text-sm font-medium">Nombres *</span>
        <input
          type="text"
          required
          value={formData.firstName}
          onChange={(e) => updateFormData({ firstName: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Tus nombres"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Apellidos *</span>
        <input
          type="text"
          required
          value={formData.lastName}
          onChange={(e) => updateFormData({ lastName: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Tus apellidos"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Fecha de Nacimiento *</span>
        <input
          type="date"
          required
          value={formData.birthDate}
          onChange={(e) => updateFormData({ birthDate: e.target.value })}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Nacionalidad</span>
        <input
          type="text"
          value={formData.nationality}
          onChange={(e) => updateFormData({ nationality: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Ej: Colombiana"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Barrio</span>
        <input
          type="text"
          value={formData.barrio}
          onChange={(e) => updateFormData({ barrio: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Tu barrio"
        />
      </label>

      <button
        type="submit"
        className="mt-4 bg-blue-800 text-white rounded px-4 py-2 hover:bg-blue-900"
      >
        Continuar
      </button>
    </form>
  );
};
