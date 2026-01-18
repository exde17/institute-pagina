// src/components/admin/PlanesAdmin.tsx
import { useEffect, useState } from 'react';
import {
  getAllPlanesPago,
  createPlanPago,
  updatePlanPago,
  deletePlanPago,
  seedPlanesPago,
  type PlanPagoPredefinido,
} from '../../lib/matriculaApi';
import { getToken } from '../../lib/auth';

export default function PlanesAdmin() {
  const [planes, setPlanes] = useState<PlanPagoPredefinido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanPagoPredefinido | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    numeroCuotas: 2,
    descripcion: '',
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanPagoPredefinido | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Seed state
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadPlanes();
  }, []);

  async function loadPlanes() {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const data = await getAllPlanesPago(token);
      setPlanes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar planes de pago');
      console.error('Error loading planes:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPlan(null);
    setFormData({
      nombre: '',
      numeroCuotas: 2,
      descripcion: '',
    });
    setShowModal(true);
  }

  function openEditModal(plan: PlanPagoPredefinido) {
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre,
      numeroCuotas: plan.numeroCuotas,
      descripcion: plan.descripcion || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPlan(null);
    setFormData({
      nombre: '',
      numeroCuotas: 2,
      descripcion: '',
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.nombre || formData.numeroCuotas < 1) {
      alert('El nombre es obligatorio y el número de cuotas debe ser al menos 1');
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      if (editingPlan) {
        await updatePlanPago(editingPlan.id, formData, token);
      } else {
        await createPlanPago(formData, token);
      }

      await loadPlanes();
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar el plan de pago');
      console.error('Error saving plan:', err);
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(plan: PlanPagoPredefinido) {
    setPlanToDelete(plan);
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    setShowDeleteConfirm(false);
    setPlanToDelete(null);
  }

  async function handleDelete() {
    if (!planToDelete) return;

    try {
      setDeleting(true);
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      await deletePlanPago(planToDelete.id, token);
      await loadPlanes();
      closeDeleteConfirm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el plan de pago');
      console.error('Error deleting plan:', err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(plan: PlanPagoPredefinido) {
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      await updatePlanPago(plan.id, { isActive: !plan.isActive }, token);
      await loadPlanes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
      console.error('Error toggling active:', err);
    }
  }

  async function handleSeed() {
    if (!confirm('¿Deseas crear los planes de pago predefinidos (2, 3 y 6 cuotas)?')) {
      return;
    }

    try {
      setSeeding(true);
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      await seedPlanesPago(token);
      await loadPlanes();
      alert('Planes de pago creados exitosamente');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear planes de pago');
      console.error('Error seeding planes:', err);
    } finally {
      setSeeding(false);
    }
  }

  // Filter planes by search term
  const filteredPlanes = planes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-slate-600">Cargando planes de pago...</p>
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
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex gap-2">
          {planes.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {seeding ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Crear Planes Predefinidos
                </>
              )}
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Plan
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredPlanes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <svg className="w-24 h-24 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchTerm ? 'No se encontraron resultados' : 'No hay planes de pago registrados'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Crea un nuevo plan de pago o usa "Crear Planes Predefinidos" para comenzar.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-slate-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">N° de Cuotas</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Descripción</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPlanes.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{plan.nombre}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      {plan.numeroCuotas} {plan.numeroCuotas === 1 ? 'cuota' : 'cuotas'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 text-sm">{plan.descripcion || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        plan.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(plan)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(plan)}
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
                {editingPlan ? 'Editar Plan de Pago' : 'Nuevo Plan de Pago'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-semibold text-slate-900 mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ej: Plan 3 Cuotas"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="numeroCuotas" className="block text-sm font-semibold text-slate-900 mb-1">
                  Número de Cuotas *
                </label>
                <input
                  type="number"
                  id="numeroCuotas"
                  min="1"
                  max="24"
                  value={formData.numeroCuotas}
                  onChange={(e) => setFormData({ ...formData, numeroCuotas: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                  disabled={saving}
                />
                <p className="text-xs text-slate-500 mt-1">
                  El monto total de la matrícula se dividirá entre este número de cuotas.
                </p>
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-semibold text-slate-900 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  placeholder="Descripción opcional del plan de pago"
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
                    editingPlan ? 'Actualizar' : 'Crear'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && planToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeDeleteConfirm}>
          <div className="bg-white rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-bold text-white">Confirmar Eliminación</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-700">
                ¿Estás seguro de que deseas eliminar el plan <strong>{planToDelete.nombre}</strong>?
              </p>
              <p className="text-sm text-slate-500">
                Esta acción no se puede deshacer. Si el plan está siendo usado en matrículas, no podrá ser eliminado.
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
