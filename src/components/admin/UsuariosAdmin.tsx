import { useEffect, useState } from 'react';
import {
  getUsuarios,
  changeUserPassword,
  type Usuario,
  type PaginationInfo,
} from '../../lib/matriculaApi';
import { getToken } from '../../lib/auth';

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [changing, setChanging] = useState(false);

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset a página 1 cuando busca
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadUsuarios();
  }, [currentPage, roleFilter]);

  async function loadUsuarios() {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const response = await getUsuarios(token, {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
      });

      setUsuarios(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar usuarios'
      );
      console.error('Error loading usuarios:', err);
    } finally {
      setLoading(false);
    }
  }

  function openPasswordModal(usuario: Usuario) {
    setSelectedUsuario(usuario);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    setShowPasswordModal(false);
    setSelectedUsuario(null);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setPasswordError('');
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    // Validaciones
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Por favor completa todos los campos');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    try {
      setChanging(true);
      setPasswordError('');

      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      if (!selectedUsuario) return;

      await changeUserPassword(
        selectedUsuario.id,
        passwordForm.newPassword,
        token
      );

      alert('Contraseña cambiada exitosamente');
      closePasswordModal();
      await loadUsuarios(); // Recargar usuario con misma paginación
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Error al cambiar la contraseña'
      );
      console.error('Error changing password:', err);
    } finally {
      setChanging(false);
    }
  }

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Todos los roles</option>
          <option value="user">Usuario</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin">
            <svg
              className="w-8 h-8 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && usuarios.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900">
                      {usuario.firstName} {usuario.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{usuario.email}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                      {usuario.role?.[0] || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => openPasswordModal(usuario)}
                      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                      title="Cambiar contraseña"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                      Cambiar contraseña
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && usuarios.length === 0 && !error && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-slate-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v2H6v-2z"
            />
          </svg>
          <p className="text-slate-600">No hay usuarios para mostrar</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && usuarios.length > 0 && pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
          <div className="text-sm text-slate-600">
            Página <span className="font-semibold">{pagination.page}</span> de{' '}
            <span className="font-semibold">{pagination.pages}</span> •{' '}
            <span className="font-semibold">{pagination.total}</span> usuarios total
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.pages, currentPage + 1))
              }
              disabled={currentPage === pagination.pages || loading}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Cambiar contraseña
            </h2>
            <p className="text-slate-600 mb-4">
              Usuario: <strong>{selectedUsuario.firstName} {selectedUsuario.lastName}</strong>
            </p>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={changing}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Repite la contraseña"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={changing}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changing}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changing}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    'Cambiar contraseña'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
