// src/components/matricula/MatriculaForm.tsx
import { useEffect, useState } from 'react';
import { getInscripcionesUsuario, submitMatricula, type Inscripcion } from '../../lib/matriculaApi';
import { getToken, getUser } from '../../lib/auth';

export default function MatriculaForm() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [selectedInscripcion, setSelectedInscripcion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Estados para los archivos
  const [documentoEstudiante, setDocumentoEstudiante] = useState<File | null>(null);
  const [diplomaCertificado, setDiplomaCertificado] = useState<File | null>(null);
  const [documentoAcudiente, setDocumentoAcudiente] = useState<File | null>(null);
  const [formularioMatricula, setFormularioMatricula] = useState<File | null>(null);

  useEffect(() => {
    loadInscripciones();
  }, []);

  async function loadInscripciones() {
    try {
      setLoading(true);
      setError('');
      
      const user = getUser();
      const token = getToken();
      
      if (!user || !token) {
        window.location.href = '/auth/login';
        return;
      }

      const data = await getInscripcionesUsuario(user.id, token);
      
      // Filtrar solo inscripciones que no tienen matrícula
      const inscripcionesSinMatricula = data.filter(insc => !insc.matriculas || insc.matriculas.length === 0);
      
      setInscripciones(inscripcionesSinMatricula);
      
      if (inscripcionesSinMatricula.length === 0) {
        setError('No tienes inscripciones pendientes de matrícula.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inscripciones');
      console.error('Error loading inscripciones:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar los 5MB');
        return;
      }
      
      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Solo se permiten archivos PDF, JPG o PNG');
        return;
      }
      
      setter(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedInscripcion) {
      setError('Selecciona un programa inscrito');
      return;
    }
    
    if (!documentoEstudiante || !diplomaCertificado || !documentoAcudiente || !formularioMatricula) {
      setError('Todos los documentos son requeridos');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess(false);
      
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }
      
      await submitMatricula({
        estudianteId: selectedInscripcion,
        documentoEstudiante,
        diplomaCertificadoGrado10: diplomaCertificado,
        documentoAcudiente,
        formularioMatricula,
      }, token);
      
      setSuccess(true);
      
      // Reset form
      setSelectedInscripcion('');
      setDocumentoEstudiante(null);
      setDiplomaCertificado(null);
      setDocumentoAcudiente(null);
      setFormularioMatricula(null);
      
      // Reload inscripciones
      setTimeout(() => {
        loadInscripciones();
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la matrícula');
      console.error('Error submitting matricula:', err);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPrograma = inscripciones.find(insc => insc.id === selectedInscripcion);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-600">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">¡Matrícula enviada exitosamente!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {inscripciones.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <svg className="w-24 h-24 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No hay programas para matricular</h3>
          <p className="text-slate-600 mb-6">Ya has completado la matrícula en todos tus programas inscritos.</p>
          <a href="/programas" className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Ver Programas
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Selección de programa */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Selecciona tu programa</h2>
            <select
              value={selectedInscripcion}
              onChange={(e) => setSelectedInscripcion(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">-- Selecciona un programa --</option>
              {inscripciones.map((insc) => (
                <option key={insc.id} value={insc.id}>
                  {insc.programa.nombre} - {insc.programa.modalidad}
                </option>
              ))}
            </select>

            {selectedPrograma && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-4">
                  {selectedPrograma.programa.imagen && (
                    <img 
                      src={selectedPrograma.programa.imagen} 
                      alt={selectedPrograma.programa.nombre}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{selectedPrograma.programa.nombre}</h3>
                    <p className="text-slate-600 text-sm">{selectedPrograma.programa.descripcion}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-slate-700">
                        <strong>Duración:</strong> {selectedPrograma.programa.duracion} semestres
                      </span>
                      <span className="text-slate-700">
                        <strong>Costo:</strong> ${parseInt(selectedPrograma.programa.costo).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Documentos requeridos */}
          {selectedInscripcion && (
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Documentos requeridos</h2>
              <p className="text-slate-600 mb-6">Sube los siguientes documentos en formato PDF, JPG o PNG (máx. 5MB cada uno)</p>

              <div className="space-y-6">
                {/* Documento del estudiante */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    1. Documento de identidad del estudiante *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => handleFileChange(e, setDocumentoEstudiante)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  {documentoEstudiante && (
                    <p className="mt-2 text-sm text-green-600">✓ {documentoEstudiante.name}</p>
                  )}
                </div>

                {/* Diploma o certificado */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    2. Diploma o certificado de grado 10° *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => handleFileChange(e, setDiplomaCertificado)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  {diplomaCertificado && (
                    <p className="mt-2 text-sm text-green-600">✓ {diplomaCertificado.name}</p>
                  )}
                </div>

                {/* Documento del acudiente */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    3. Documento de identidad del acudiente *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => handleFileChange(e, setDocumentoAcudiente)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  {documentoAcudiente && (
                    <p className="mt-2 text-sm text-green-600">✓ {documentoAcudiente.name}</p>
                  )}
                </div>

                {/* Formulario de matrícula */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    4. Formulario de matrícula firmado *
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => handleFileChange(e, setFormularioMatricula)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  {formularioMatricula && (
                    <p className="mt-2 text-sm text-green-600">✓ {formularioMatricula.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botón de envío */}
          {selectedInscripcion && (
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => window.location.href = '/mis-inscripciones'}
                className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Matrícula'
                )}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
