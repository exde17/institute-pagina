import React, { useState } from 'react';
import type { FormData } from '../../hooks/useFormPersistence';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const Step3Contact: React.FC<StepProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const [passwordError, setPasswordError] = useState('');

  const validatePassword = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && password.length >= 6;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(formData.password)) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número');
      return;
    }
    
    setPasswordError('');
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <h2 className="text-2xl font-bold">Información de Contacto</h2>
      
      <label className="grid gap-1">
        <span className="text-sm font-medium">Correo Electrónico *</span>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="tu@email.com"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Contraseña *</span>
        <input
          type="password"
          required
          minLength={6}
          value={formData.password}
          onChange={(e) => {
            updateFormData({ password: e.target.value });
            setPasswordError('');
          }}
          className="border rounded px-3 py-2"
          placeholder="Mínimo 6 caracteres"
        />
        {passwordError && <span className="text-sm text-red-600">{passwordError}</span>}
        <span className="text-xs text-gray-600">
          Debe contener: mayúscula, minúscula y número
        </span>
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Teléfono *</span>
        <input
          type="tel"
          required
          value={formData.telephone}
          onChange={(e) => updateFormData({ telephone: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Tu número de teléfono"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Dirección *</span>
        <input
          type="text"
          required
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          className="border rounded px-3 py-2"
          placeholder="Tu dirección completa"
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
