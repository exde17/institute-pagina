import { useState, useEffect } from 'react';

const STORAGE_KEY = 'register_form_data';
const STEP_KEY = 'register_form_step';

export interface FormData {
  // Datos personales
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  barrio: string;
  
  // Documento
  tipoDocumento: string;
  documentNumber: string;
  lugarExpedicion: string;
  municipioNacimiento: string;
  departamentoNacimiento: string;
  
  // Contacto
  email: string;
  password: string;
  telephone: string;
  address: string;
  
  // Educación
  nivelEducativo: string;
  anioCertificacion: string;
  institucionEducativa: string;
  departamentoInstitucion: string;
  municipioInstitucion: string;
  
  // Acudiente (condicional si es menor de 18)
  nombreAcudiente: string;
  numeroContactoAcudiente: string;
  parentesco: string;
  direccionAcudiente: string;
  
  // Limitación
  limitacionFisicaCognitiva: boolean;
  descripcionLimitacion: string;
  
  // Grupo poblacional
  perteneceGrupoPoblacional: boolean;
  grupoId: string;
}

export const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  birthDate: '',
  nationality: '',
  barrio: '',
  tipoDocumento: '',
  documentNumber: '',
  lugarExpedicion: '',
  municipioNacimiento: '',
  departamentoNacimiento: '',
  email: '',
  password: '',
  telephone: '',
  address: '',
  nivelEducativo: '',
  anioCertificacion: '',
  institucionEducativa: '',
  departamentoInstitucion: '',
  municipioInstitucion: '',
  nombreAcudiente: '',
  numeroContactoAcudiente: '',
  parentesco: '',
  direccionAcudiente: '',
  limitacionFisicaCognitiva: false,
  descripcionLimitacion: '',
  perteneceGrupoPoblacional: false,
  grupoId: '',
};

export function useFormPersistence() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);

  // Cargar datos del localStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(STEP_KEY);
      
      if (savedData) {
        try {
          setFormData(JSON.parse(savedData));
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      }
      
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  const updateFormData = (newData: Partial<FormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...newData };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STEP_KEY, step.toString());
    }
  };

  const clearFormData = () => {
    setFormData(initialFormData);
    setCurrentStep(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_KEY);
    }
  };

  // Calcular si el usuario es mayor de 18 años
  const isAdult = (): boolean => {
    if (!formData.birthDate) return true;
    const today = new Date();
    const birthDate = new Date(formData.birthDate);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };

  return {
    formData,
    updateFormData,
    currentStep,
    goToStep,
    clearFormData,
    isAdult,
  };
}
