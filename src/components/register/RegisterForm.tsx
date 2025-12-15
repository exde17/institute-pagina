import React, { useState } from 'react';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { Step1PersonalInfo } from './Step1PersonalInfo';
import { Step2Document } from './Step2Document';
import { Step3Contact } from './Step3Contact';
import { Step4Education } from './Step4Education';
import { Step5Guardian } from './Step5Guardian';
import { Step6Final } from './Step6Final';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://apifcm.bg3sas.com';

export const RegisterForm: React.FC = () => {
  const { formData, updateFormData, currentStep, goToStep, clearFormData, isAdult } = useFormPersistence();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Determinar el total de pasos según si es adulto o no
  const totalSteps = isAdult() ? 6 : 7; // Sin acudiente: 6 pasos, Con acudiente: 7 pasos
  
  // Ajustar índice de pasos si es adulto (saltamos el paso 5 - Guardian)
  const getStepComponent = (step: number) => {
    if (isAdult() && step >= 4) {
      // Si es adulto, después del paso 4 (Education) va directo al paso 6 (Final)
      return step + 1;
    }
    return step;
  };

  const handleNext = () => {
    if (isAdult() && currentStep === 3) {
      // Si es adulto y está en el paso 4 (Education), saltar al paso 5 (Final en el índice)
      goToStep(4);
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (isAdult() && currentStep === 4) {
      // Si es adulto y está en el paso Final (5), volver al paso Education (3)
      goToStep(3);
    } else {
      goToStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Preparar datos para enviar
      const dataToSend: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        telephone: formData.telephone,
        address: formData.address,
        tipoDocumento: formData.tipoDocumento,
        documentNumber: formData.documentNumber,
      };

      // Agregar campos opcionales si tienen valor
      if (formData.birthDate) dataToSend.birthDate = formData.birthDate;
      if (formData.nationality) dataToSend.nationality = formData.nationality;
      if (formData.barrio) dataToSend.barrio = formData.barrio;
      if (formData.lugarExpedicion) dataToSend.lugarExpedicion = formData.lugarExpedicion;
      if (formData.municipioNacimiento) dataToSend.municipioNacimiento = formData.municipioNacimiento;
      if (formData.departamentoNacimiento) dataToSend.departamentoNacimiento = formData.departamentoNacimiento;
      if (formData.nivelEducativo) dataToSend.nivelEducativo = formData.nivelEducativo;
      if (formData.anioCertificacion) dataToSend.anioCertificacion = formData.anioCertificacion;
      if (formData.institucionEducativa) dataToSend.institucionEducativa = formData.institucionEducativa;
      if (formData.departamentoInstitucion) dataToSend.departamentoInstitucion = formData.departamentoInstitucion;
      if (formData.municipioInstitucion) dataToSend.municipioInstitucion = formData.municipioInstitucion;
      if (formData.limitacionFisicaCognitiva !== undefined) {
        dataToSend.limitacionFisicaCognitiva = formData.limitacionFisicaCognitiva;
      }
      if (formData.descripcionLimitacion) dataToSend.descripcionLimitacion = formData.descripcionLimitacion;
      
      // Agregar grupo poblacional si pertenece a uno
      if (formData.perteneceGrupoPoblacional && formData.grupoId) {
        dataToSend.grupo = formData.grupoId;
      }

      // Agregar datos del acudiente solo si es menor de edad
      if (!isAdult()) {
        if (formData.nombreAcudiente) dataToSend.nombreAcudiente = formData.nombreAcudiente;
        if (formData.numeroContactoAcudiente) dataToSend.numeroContactoAcudiente = formData.numeroContactoAcudiente;
        if (formData.parentesco) dataToSend.parentesco = formData.parentesco;
        if (formData.direccionAcudiente) dataToSend.direccionAcudiente = formData.direccionAcudiente;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la cuenta');
      }

      const result = await response.json();
      
      // Guardar token y datos del usuario
      const { token, ...user } = result;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }

      // Limpiar el formulario
      clearFormData();

      // Redirigir
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    // Calcular el paso actual mostrado al usuario
    let displayStep = currentStep + 1;
    let displaySteps = isAdult() ? 5 : 6;
    
    // Si es adulto y está en el paso final (índice 4), mostrarlo como paso 5 de 5
    if (isAdult() && currentStep === 4) {
      displayStep = 5;
    }
    
    const progress = (displayStep / displaySteps) * 100;

    return (
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Paso {displayStep} de {displaySteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-800 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStep = () => {
    const props = {
      formData,
      updateFormData,
      onNext: handleNext,
      onBack: currentStep > 0 ? handleBack : undefined,
    };

    switch (currentStep) {
      case 0:
        return <Step1PersonalInfo {...props} />;
      case 1:
        return <Step2Document {...props} />;
      case 2:
        return <Step3Contact {...props} />;
      case 3:
        return <Step4Education {...props} />;
      case 4:
        // Si es adulto, mostrar Step6Final, si no, mostrar Step5Guardian
        if (isAdult()) {
          return (
            <Step6Final
              formData={formData}
              updateFormData={updateFormData}
              onSubmit={handleSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
              error={error}
            />
          );
        } else {
          return <Step5Guardian {...props} />;
        }
      case 5:
        // Este caso solo se alcanza si NO es adulto
        return (
          <Step6Final
            formData={formData}
            updateFormData={updateFormData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            error={error}
          />
        );
      default:
        return <Step1PersonalInfo {...props} />;
    }
  };

  return (
    <div className="w-full">
      {renderProgressBar()}
      {renderStep()}
      
      {/* Botón para limpiar el progreso (útil para desarrollo/testing) */}
      {currentStep > 0 && (
        <button
          type="button"
          onClick={() => {
            if (confirm('¿Estás seguro de que quieres reiniciar el formulario? Se perderá todo el progreso.')) {
              clearFormData();
            }
          }}
          className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Reiniciar formulario
        </button>
      )}
    </div>
  );
};
