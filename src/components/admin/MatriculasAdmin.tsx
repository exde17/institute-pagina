// src/components/admin/MatriculasAdmin.tsx
import { useEffect, useState } from 'react';
import { getAllMatriculas, type Matricula } from '../../lib/matriculaApi';
import { getToken } from '../../lib/auth';

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'http://localhost:3000';

export default function MatriculasAdmin() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMatricula, setSelectedMatricula] = useState<Matricula | null>(null);

  useEffect(() => {
    loadMatriculas();
  }, []);

  async function loadMatriculas() {
    try {
      setLoading(true);
      setError('');
      
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const data = await getAllMatriculas(token);
      setMatriculas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar matrículas');
      console.error('Error loading matriculas:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getDocumentUrl(relativePath: string): string {
    // Construir URL completa apuntando al backend
    return `${API_BASE}/${relativePath}`;
  }

  function openDocument(relativePath: string) {
    const fullUrl = getDocumentUrl(relativePath);
    window.open(fullUrl, '_blank');
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-600">Cargando matrículas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (matriculas.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <svg className="w-24 h-24 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No hay matrículas registradas</h3>
        <p className="text-slate-600">Aún no se han enviado matrículas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabla de matrículas */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-slate-200">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Estudiante</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Programa</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Modalidad</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Fecha Matrícula</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {matriculas.map((matricula) => (
              <tr key={matricula.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {matricula.estudiante.firstName} {matricula.estudiante.lastName}
                    </p>
                    <p className="text-sm text-slate-600">{matricula.estudiante.email}</p>
                    <p className="text-sm text-slate-500">Tel: {matricula.estudiante.telephone}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {matricula.inscripcion.programa.imagen && (
                      <img 
                        src={matricula.inscripcion.programa.imagen} 
                        alt={matricula.inscripcion.programa.nombre}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{matricula.inscripcion.programa.nombre}</p>
                      <p className="text-sm text-slate-600">{matricula.inscripcion.programa.duracion} semestres</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {matricula.inscripcion.programa.modalidad}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-900">{formatDate(matricula.createdAt)}</p>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedMatricula(matricula)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Ver Documentos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de documentos */}
      {selectedMatricula && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMatricula(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Documentos de {selectedMatricula.estudiante.firstName} {selectedMatricula.estudiante.lastName}
              </h3>
              <button
                onClick={() => setSelectedMatricula(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del estudiante */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-bold text-slate-900 mb-3">Información del Estudiante</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Nombre:</span>
                    <p className="font-semibold text-slate-900">
                      {selectedMatricula.estudiante.firstName} {selectedMatricula.estudiante.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Email:</span>
                    <p className="font-semibold text-slate-900">{selectedMatricula.estudiante.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Teléfono:</span>
                    <p className="font-semibold text-slate-900">{selectedMatricula.estudiante.telephone}</p>
                  </div>
                  {selectedMatricula.estudiante.documentNumber && (
                    <div>
                      <span className="text-slate-600">Documento:</span>
                      <p className="font-semibold text-slate-900">{selectedMatricula.estudiante.documentNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del programa */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-bold text-slate-900 mb-3">Programa Inscrito</h4>
                <div className="flex items-center gap-4">
                  {selectedMatricula.inscripcion.programa.imagen && (
                    <img 
                      src={selectedMatricula.inscripcion.programa.imagen} 
                      alt={selectedMatricula.inscripcion.programa.nombre}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <p className="font-bold text-lg text-slate-900">{selectedMatricula.inscripcion.programa.nombre}</p>
                    <p className="text-sm text-slate-700">
                      {selectedMatricula.inscripcion.programa.modalidad} • {selectedMatricula.inscripcion.programa.duracion} semestres
                    </p>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4">Documentos Cargados</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-slate-900">Documento de identidad del estudiante</p>
                        <p className="text-xs text-slate-600">Documento personal</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openDocument(selectedMatricula.documentoEstudiante)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Ver
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-slate-900">Diploma o certificado de grado 10°</p>
                        <p className="text-xs text-slate-600">Certificación educativa</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openDocument(selectedMatricula.diplomaCertificadoGrado10)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      Ver
                    </button>
                  </div>

                  {selectedMatricula.documentoAcudiente && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-slate-900">Documento de identidad del acudiente</p>
                          <p className="text-xs text-slate-600">Acudiente (menor de edad)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openDocument(selectedMatricula.documentoAcudiente!)}
                        className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
                      >
                        Ver
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-slate-900">Formulario de matrícula firmado</p>
                        <p className="text-xs text-slate-600">Documento oficial</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openDocument(selectedMatricula.formularioMatricula)}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
