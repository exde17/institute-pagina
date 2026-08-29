import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  getUsuarios,
  changeUserPassword,
  type Usuario,
  type PaginationInfo,
} from '../../lib/matriculaApi';
import { getToken } from '../../lib/auth';

export default function EstudiantesPassword() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  async function loadUsuarios() {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      // Un docente solo puede ver/gestionar estudiantes (rol "user").
      const response = await getUsuarios(token, {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        role: 'user',
      });

      setUsuarios(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar estudiantes'
      );
      console.error('Error loading estudiantes:', err);
    } finally {
      setLoading(false);
    }
  }

  function openPasswordModal(usuario: Usuario) {
    setSelectedUsuario(usuario);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    setShowPasswordModal(false);
    setSelectedUsuario(null);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function getPasswordRequirements(password: string) {
    return {
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }

  function areAllRequirementsMet(password: string): boolean {
    const req = getPasswordRequirements(password);
    return req.hasMinLength && req.hasUppercase && req.hasLowercase && req.hasNumber;
  }

  function handlePasswordInputChange(field: 'newPassword' | 'confirmPassword', value: string) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!areAllRequirementsMet(passwordForm.newPassword)) {
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }

    try {
      setChanging(true);

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

      closePasswordModal();

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Contraseña cambiada exitosamente',
        confirmButtonColor: '#f59e0b',
      });
      await loadUsuarios();
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err instanceof Error ? err.message : 'Error al cambiar la contraseña',
        confirmButtonColor: '#f59e0b',
      });
      console.error('Error changing password:', err);
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-2">
        <input
          type="text"
          placeholder="Buscar estudiante por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
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
          <p className="text-slate-600">No hay estudiantes para mostrar</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && usuarios.length > 0 && pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
          <div className="text-sm text-slate-600">
            Página <span className="font-semibold">{pagination.page}</span> de{' '}
            <span className="font-semibold">{pagination.pages}</span> •{' '}
            <span className="font-semibold">{pagination.total}</span> estudiantes total
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Cambiar contraseña
            </h2>
            <p className="text-slate-600 mb-4">
              Estudiante: <strong>{selectedUsuario.firstName} {selectedUsuario.lastName}</strong>
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      handlePasswordInputChange('newPassword', e.target.value)
                    }
                    placeholder="Mínimo 8 caracteres"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      passwordForm.newPassword && !areAllRequirementsMet(passwordForm.newPassword)
                        ? 'border-red-300 focus:ring-red-500'
                        : passwordForm.newPassword && areAllRequirementsMet(passwordForm.newPassword)
                        ? 'border-green-300 focus:ring-green-500'
                        : 'border-slate-300 focus:ring-amber-500'
                    }`}
                    disabled={changing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                    disabled={changing}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 1019.542 10 10.002 10.002 0 003.707 2.293zM15.378 12.089l-4.89-4.89a4 4 0 00-5.678 5.678l4.89 4.89a4 4 0 005.678-5.678z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>

                {passwordForm.newPassword && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Requisitos:</p>
                    <div className="space-y-1.5">
                      <div className={`flex items-center gap-2 text-xs ${getPasswordRequirements(passwordForm.newPassword).hasMinLength ? 'text-green-700' : 'text-red-700'}`}>
                        <span>Al menos 8 caracteres ({passwordForm.newPassword.length})</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${getPasswordRequirements(passwordForm.newPassword).hasUppercase ? 'text-green-700' : 'text-red-700'}`}>
                        <span>Una letra mayúscula</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${getPasswordRequirements(passwordForm.newPassword).hasLowercase ? 'text-green-700' : 'text-red-700'}`}>
                        <span>Una letra minúscula</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${getPasswordRequirements(passwordForm.newPassword).hasNumber ? 'text-green-700' : 'text-red-700'}`}>
                        <span>Un número</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      handlePasswordInputChange('confirmPassword', e.target.value)
                    }
                    placeholder="Repite la contraseña"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword
                        ? 'border-green-300 focus:ring-green-500'
                        : 'border-slate-300 focus:ring-amber-500'
                    }`}
                    disabled={changing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                    disabled={changing}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 1019.542 10 10.002 10.002 0 003.707 2.293zM15.378 12.089l-4.89-4.89a4 4 0 00-5.678 5.678l4.89 4.89a4 4 0 005.678-5.678z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
                )}
                {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                  <p className="mt-1 text-sm text-green-600">Las contraseñas coinciden</p>
                )}
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
                  disabled={changing || !areAllRequirementsMet(passwordForm.newPassword) || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changing ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
