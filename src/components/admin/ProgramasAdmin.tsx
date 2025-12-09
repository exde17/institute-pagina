import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { programasApi, type Programa } from '../../lib/programasApi';
import ProgramForm from './ProgramForm';

export default function ProgramasAdmin() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [programaEditar, setProgramaEditar] = useState<Programa | null>(null);

  useEffect(() => {
    cargarProgramas();
  }, []);

  const cargarProgramas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await programasApi.obtenerTodos();
      setProgramas(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los programas');
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (data: any) => {
    try {
      await programasApi.crear(data);
      setSuccess('Programa creado exitosamente');
      await cargarProgramas();
      setShowForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      throw err;
    }
  };

  const handleEditar = (programa: Programa) => {
    setProgramaEditar(programa);
    setShowForm(true);
  };

  const handleActualizar = async (data: any) => {
    if (!programaEditar) return;
    
    try {
      await programasApi.actualizar(programaEditar.id, data);
      setSuccess('Programa actualizado exitosamente');
      await cargarProgramas();
      setShowForm(false);
      setProgramaEditar(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      throw err;
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el programa "${nombre}"?`)) {
      return;
    }

    try {
      await programasApi.eliminar(id);
      setSuccess('Programa eliminado exitosamente');
      await cargarProgramas();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el programa');
      setTimeout(() => setError(null), 3000);
    }
  };

  const programasFiltrados = programas.filter(programa =>
    programa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    programa.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    programa.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Administración de Programas
              </h1>
              <p className="text-slate-600">
                Gestiona los programas académicos del instituto
              </p>
            </div>
            <button
              onClick={() => {
                setProgramaEditar(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Crear Programa
            </button>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando programas...</p>
          </div>
        )}

        {/* Lista de programas */}
        {!loading && (
          <div className="grid gap-6">
            {programasFiltrados.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-slate-600 text-lg">
                  {searchTerm ? 'No se encontraron programas con ese criterio' : 'No hay programas registrados'}
                </p>
              </div>
            ) : (
              programasFiltrados.map((programa) => (
                <div
                  key={programa.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                >
                  <div className="md:flex">
                    {/* Imagen */}
                    <div className="md:w-1/4 flex items-center justify-center bg-slate-100 p-4">
                      <img
                        src={programa.imagen}
                        alt={programa.nombre}
                        className="w-full h-auto object-contain max-h-64"
                      />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-slate-900">
                              {programa.nombre}
                            </h3>
                            <span
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: programa.badgeColor }}
                            >
                              {programa.badge}
                            </span>
                          </div>
                          <p className="text-slate-600 mb-4">{programa.descripcion}</p>
                          
                          <div className="grid md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-xs text-slate-500 mb-1">Duración</p>
                              <p className="font-semibold text-slate-900">{programa.duracion} semestres</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-xs text-slate-500 mb-1">Modalidad</p>
                              <p className="font-semibold text-slate-900 capitalize">{programa.modalidad}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-xs text-slate-500 mb-1">Categoría</p>
                              <p className="font-semibold text-slate-900 capitalize">{programa.categoria}</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs text-blue-600 mb-1">Costo</p>
                              <p className="font-bold text-blue-700">{formatCurrency(programa.costo)}</p>
                            </div>
                          </div>

                          {/* Detalles */}
                          {programa.detalles.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-slate-700 mb-2">Detalles:</p>
                              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                {programa.detalles.map((detalle, index) => (
                                  <li key={index}>{detalle}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Semestres */}
                          {programa.semestres.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-2">
                                Plan de estudios ({programa.semestres.length} semestres):
                              </p>
                              <div className="grid md:grid-cols-2 gap-2">
                                {programa.semestres.map((semestre, index) => {
                                  const asignaturas = semestre.asignaturas || semestre.materias || [];
                                  return (
                                    <div key={index} className="bg-slate-50 rounded-lg p-3">
                                      <p className="font-semibold text-slate-900 text-sm mb-1">
                                        {semestre.nombre} {semestre.numero ? `(${semestre.numero})` : ''}
                                      </p>
                                      <p className="text-xs text-slate-600">
                                        {asignaturas.length} {asignaturas.length === 1 ? 'materia' : 'materias'}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditar(programa)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEliminar(programa.id, programa.nombre)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Contador */}
        {!loading && programas.length > 0 && (
          <div className="mt-6 text-center text-slate-600">
            Mostrando {programasFiltrados.length} de {programas.length} programas
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <ProgramForm
          programa={programaEditar}
          onClose={() => {
            setShowForm(false);
            setProgramaEditar(null);
          }}
          onSubmit={programaEditar ? handleActualizar : handleCrear}
        />
      )}
    </div>
  );
}
