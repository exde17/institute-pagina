import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Programa, CreateProgramaDTO, Semestre } from '../../lib/programasApi';

interface ProgramFormProps {
  programa?: Programa | null;
  onClose: () => void;
  onSubmit: (data: CreateProgramaDTO) => Promise<void>;
}

export default function ProgramForm({ programa, onClose, onSubmit }: ProgramFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateProgramaDTO>({
    nombre: '',
    imagen: '',
    descripcion: '',
    duracion: 4,
    modalidad: 'presencial',
    categoria: 'tecnologia',
    badge: 'Técnico',
    badgeColor: '#3B82F6',
    semestres: [],
    detalles: [],
    costo: 0
  });

  const [nuevoDetalle, setNuevoDetalle] = useState('');
  const [nuevoSemestre, setNuevoSemestre] = useState({ nombre: '', asignaturas: [''] });

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';

    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.left = '';
    };
  }, []);

  useEffect(() => {
    if (programa) {
      setFormData({
        nombre: programa.nombre,
        imagen: programa.imagen,
        descripcion: programa.descripcion,
        duracion: programa.duracion,
        modalidad: programa.modalidad,
        categoria: programa.categoria,
        badge: programa.badge,
        badgeColor: programa.badgeColor,
        semestres: programa.semestres,
        detalles: programa.detalles,
        costo: programa.costo
      });
    }
  }, [programa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el programa');
    } finally {
      setLoading(false);
    }
  };

  const agregarDetalle = () => {
    if (nuevoDetalle.trim()) {
      setFormData({
        ...formData,
        detalles: [...formData.detalles, nuevoDetalle.trim()]
      });
      setNuevoDetalle('');
    }
  };

  const eliminarDetalle = (index: number) => {
    setFormData({
      ...formData,
      detalles: formData.detalles.filter((_, i) => i !== index)
    });
  };

  const agregarSemestre = () => {
    if (nuevoSemestre.nombre.trim() && nuevoSemestre.asignaturas.some(a => a.trim())) {
      setFormData({
        ...formData,
        semestres: [...formData.semestres, {
          nombre: nuevoSemestre.nombre.trim(),
          asignaturas: nuevoSemestre.asignaturas.filter(a => a.trim())
        }]
      });
      setNuevoSemestre({ nombre: '', asignaturas: [''] });
    }
  };

  const eliminarSemestre = (index: number) => {
    setFormData({
      ...formData,
      semestres: formData.semestres.filter((_, i) => i !== index)
    });
  };

  const agregarAsignatura = () => {
    setNuevoSemestre({
      ...nuevoSemestre,
      asignaturas: [...nuevoSemestre.asignaturas, '']
    });
  };

  const actualizarAsignatura = (index: number, valor: string) => {
    const nuevasAsignaturas = [...nuevoSemestre.asignaturas];
    nuevasAsignaturas[index] = valor;
    setNuevoSemestre({
      ...nuevoSemestre,
      asignaturas: nuevasAsignaturas
    });
  };

  const eliminarAsignatura = (index: number) => {
    setNuevoSemestre({
      ...nuevoSemestre,
      asignaturas: nuevoSemestre.asignaturas.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {programa ? 'Editar Programa' : 'Crear Nuevo Programa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Información Básica */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre del Programa *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Técnico en Sistemas"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                URL de la Imagen *
              </label>
              <input
                type="text"
                required
                value={formData.imagen}
                onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Descripción *
            </label>
            <textarea
              required
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción del programa..."
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Duración (semestres) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.duracion}
                onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Modalidad *
              </label>
              <select
                required
                value={formData.modalidad}
                onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Categoría *
              </label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tecnologia">Tecnología</option>
                <option value="salud">Salud</option>
                <option value="educacion">Educación</option>
                <option value="negocios">Negocios</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Badge *
              </label>
              <input
                type="text"
                required
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Técnico"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Color del Badge *
              </label>
              <input
                type="color"
                required
                value={formData.badgeColor}
                onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                className="w-full h-10 px-2 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Costo (COP) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2500000"
              />
            </div>
          </div>

          {/* Detalles */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Detalles del Programa
            </label>
            <div className="space-y-2">
              {formData.detalles.map((detalle, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2 bg-slate-50 rounded-lg text-slate-700">
                    {detalle}
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarDetalle(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoDetalle}
                  onChange={(e) => setNuevoDetalle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarDetalle())}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Agregar detalle..."
                />
                <button
                  type="button"
                  onClick={agregarDetalle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Semestres */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Semestres
            </label>
            <div className="space-y-4">
              {formData.semestres.map((semestre, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{semestre.nombre}</h4>
                    <button
                      type="button"
                      onClick={() => eliminarSemestre(index)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <ul className="list-disc list-inside text-sm text-slate-600">
                    {(semestre.asignaturas || semestre.materias || []).map((asignatura, i) => (
                      <li key={i}>{asignatura}</li>
                    ))}
                  </ul>
                </div>
              ))}
              
              {/* Nuevo Semestre */}
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg space-y-3">
                <input
                  type="text"
                  value={nuevoSemestre.nombre}
                  onChange={(e) => setNuevoSemestre({ ...nuevoSemestre, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del semestre (Ej: Semestre 1)"
                />
                
                <div className="space-y-2">
                  {nuevoSemestre.asignaturas.map((asignatura, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={asignatura}
                        onChange={(e) => actualizarAsignatura(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nombre de la asignatura"
                      />
                      {nuevoSemestre.asignaturas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarAsignatura(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={agregarAsignatura}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    + Agregar asignatura
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={agregarSemestre}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Agregar Semestre
                </button>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Guardando...' : programa ? 'Actualizar' : 'Crear Programa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
