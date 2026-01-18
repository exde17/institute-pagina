// src/components/admin/EntidadesAdmin.tsx
import { useEffect, useState } from 'react';
import {
  getAllEntidades,
  createEntidad,
  updateEntidad,
  deleteEntidad,
  type Entidad,
} from '../../lib/matriculaApi';
import { getToken } from '../../lib/auth';

export default function EntidadesAdmin() {
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEntidad, setEditingEntidad] = useState<Entidad | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    razonSocial: '',
    nit: '',
    direccion: '',
    correo: '',
    telefono: '',
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entidadToDelete, setEntidadToDelete] = useState<Entidad | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEntidades();
  }, []);

  async function loadEntidades() {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const data = await getAllEntidades(token);
      setEntidades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar entidades');
      console.error('Error loading entidades:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingEntidad(null);
    setFormData({
      razonSocial: '',
      nit: '',
      direccion: '',
      correo: '',
      telefono: '',
    });
    setShowModal(true);
  }

  function openEditModal(entidad: Entidad) {
    setEditingEntidad(entidad);
    setFormData({
      razonSocial: entidad.razonSocial,
      nit: entidad.nit,
      direccion: entidad.direccion || '',
      correo: entidad.correo || '',
      telefono: entidad.telefono || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingEntidad(null);
    setFormData({
      razonSocial: '',
      nit: '',
      direccion: '',
      correo: '',
      telefono: '',
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.razonSocial || !formData.nit) {
      alert('La razón social y el NIT son obligatorios');
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      if (editingEntidad) {
        await updateEntidad(editingEntidad.id, formData, token);
      } else {
        await createEntidad(formData, token);
      }

      await loadEntidades();
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la entidad');
      console.error('Error saving entidad:', err);
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(entidad: Entidad) {
    setEntidadToDelete(entidad);
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    setShowDeleteConfirm(false);
    setEntidadToDelete(null);
  }

  async function handleDelete() {
    if (!entidadToDelete) return;

    try {
      setDeleting(true);
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      await deleteEntidad(entidadToDelete.id, token);
      await loadEntidades();
      closeDeleteConfirm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la entidad');
      console.error('Error deleting entidad:', err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(entidad: Entidad) {
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      await updateEntidad(entidad.id, { isActive: !entidad.isActive }, token);
      await loadEntidades();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
      console.error('Error toggling active:', err);
    }
  }

  // Filter entidades by search term
  const filteredEntidades = entidades.filter(
    (e) =>
      e.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.correo && e.correo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-slate-600">Cargando entidades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por razón social, NIT o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Entidad
        </button>
      </div>

      {/* Table */}
      {filteredEntidades.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <svg className="w-24 h-24 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchTerm ? 'No se encontraron resultados' : 'No hay entidades registradas'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Crea una nueva entidad para comenzar.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-slate-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Razón Social</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">NIT</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Correo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Teléfono</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntidades.map((entidad) => (
                <tr key={entidad.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{entidad.razonSocial}</p>
                    {entidad.direccion && (
                      <p className="text-xs text-slate-500">{entidad.direccion}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{entidad.nit}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{entidad.correo || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{entidad.telefono || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(entidad)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        entidad.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {entidad.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(entidad)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(entidad)}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-bold text-white">
                {editingEntidad ? 'Editar Entidad' : 'Nueva Entidad'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="razonSocial" className="block text-sm font-semibold text-slate-900 mb-1">
                  Razón Social *
                </label>
                <input
                  type="text"
                  id="razonSocial"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Nombre de la entidad"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="nit" className="block text-sm font-semibold text-slate-900 mb-1">
                  NIT *
                </label>
                <input
                  type="text"
                  id="nit"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ej: 900123456-7"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="direccion" className="block text-sm font-semibold text-slate-900 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Dirección de la entidad"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="correo" className="block text-sm font-semibold text-slate-900 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="correo"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="correo@entidad.com"
                  disabled={saving}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Este correo se usará para enviar links de pago cuando un estudiante sea becado por esta entidad.
                </p>
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-semibold text-slate-900 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ej: 3001234567"
                  disabled={saving}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    editingEntidad ? 'Actualizar' : 'Crear'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && entidadToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeDeleteConfirm}>
          <div className="bg-white rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-bold text-white">Confirmar Eliminación</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-700">
                ¿Estás seguro de que deseas eliminar la entidad <strong>{entidadToDelete.razonSocial}</strong>?
              </p>
              <p className="text-sm text-slate-500">
                Esta acción no se puede deshacer. Si la entidad está asociada a matrículas, no podrá ser eliminada.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
