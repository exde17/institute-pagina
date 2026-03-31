import { useEffect, useState } from 'react';
import { getToken, getUser, saveAuth, logout } from '../../lib/auth';
import { useApiOptions, useMunicipios } from '../../hooks/useApiOptions';
import { SearchableSelect } from '../register/SearchableSelect';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://apifcm.bg3sas.com';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  address: string;
  documentNumber: string;
  birthDate: string;
  nationality: string;
  barrio: string;
  tipoDocumento: { id: string } | null;
  lugarExpedicion: { id: string } | null;
  municipioNacimiento: { id: string } | null;
  departamentoNacimiento: { id: string } | null;
  nivelEducativo: { id: string } | null;
  anioCertificacion: string;
  institucionEducativa: string;
  departamentoInstitucion: { id: string } | null;
  municipioInstitucion: { id: string } | null;
  nombreAcudiente: string;
  numeroContactoAcudiente: string;
  parentesco: { id: string } | null;
  direccionAcudiente: string;
  limitacionFisicaCognitiva: boolean;
  descripcionLimitacion: string;
  grupo: { id: string } | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  address: string;
  documentNumber: string;
  birthDate: string;
  nationality: string;
  barrio: string;
  tipoDocumento: string;
  lugarExpedicion: string;
  municipioNacimiento: string;
  departamentoNacimiento: string;
  nivelEducativo: string;
  anioCertificacion: string;
  institucionEducativa: string;
  departamentoInstitucion: string;
  municipioInstitucion: string;
  nombreAcudiente: string;
  numeroContactoAcudiente: string;
  parentesco: string;
  direccionAcudiente: string;
  limitacionFisicaCognitiva: boolean;
  descripcionLimitacion: string;
  grupoId: string;
}

function profileToForm(p: UserProfile): FormState {
  return {
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    email: p.email || '',
    telephone: p.telephone || '',
    address: p.address || '',
    documentNumber: p.documentNumber || '',
    birthDate: p.birthDate || '',
    nationality: p.nationality || '',
    barrio: p.barrio || '',
    tipoDocumento: p.tipoDocumento?.id || '',
    lugarExpedicion: p.lugarExpedicion?.id || '',
    municipioNacimiento: p.municipioNacimiento?.id || '',
    departamentoNacimiento: p.departamentoNacimiento?.id || '',
    nivelEducativo: p.nivelEducativo?.id || '',
    anioCertificacion: p.anioCertificacion || '',
    institucionEducativa: p.institucionEducativa || '',
    departamentoInstitucion: p.departamentoInstitucion?.id || '',
    municipioInstitucion: p.municipioInstitucion?.id || '',
    nombreAcudiente: p.nombreAcudiente || '',
    numeroContactoAcudiente: p.numeroContactoAcudiente || '',
    parentesco: p.parentesco?.id || '',
    direccionAcudiente: p.direccionAcudiente || '',
    limitacionFisicaCognitiva: p.limitacionFisicaCognitiva || false,
    descripcionLimitacion: p.descripcionLimitacion || '',
    grupoId: p.grupo?.id || '',
  };
}

export default function MiCuenta() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  // Password
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // API options
  const { options: tiposDocumento } = useApiOptions('tipo-documento');
  const { options: departamentos } = useApiOptions('departamento');
  const { options: allMunicipios, loading: loadingAllMunicipios } = useApiOptions('municipio');
  const { options: nivelesEducativos } = useApiOptions('nivel-educativo');
  const { options: parentescos } = useApiOptions('parentesco');
  const { options: grupos } = useApiOptions('grupos');
  const { municipios: municipiosNacimiento, loading: loadingMunicNac } = useMunicipios(form?.departamentoNacimiento || '');
  const { municipios: municipiosInstitucion, loading: loadingMunicInst } = useMunicipios(form?.departamentoInstitucion || '');

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    if (!t || !u) {
      window.location.href = '/auth/login';
      return;
    }
    setToken(t);
    setUser(u);
  }, []);

  useEffect(() => {
    if (token && user) fetchProfile(token, user.id);
  }, [token, user]);

  async function fetchProfile(authToken: string, userId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Error al cargar perfil');
      const data: UserProfile = await res.json();
      setForm(profileToForm(data));
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  function update(partial: Partial<FormState>) {
    setForm((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !user) return;

    setSaving(true);
    setMessage(null);
    try {
      const body: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        telephone: form.telephone,
        address: form.address,
        documentNumber: form.documentNumber,
        birthDate: form.birthDate,
        nationality: form.nationality,
        barrio: form.barrio,
        anioCertificacion: form.anioCertificacion,
        institucionEducativa: form.institucionEducativa,
        nombreAcudiente: form.nombreAcudiente,
        numeroContactoAcudiente: form.numeroContactoAcudiente,
        direccionAcudiente: form.direccionAcudiente,
        limitacionFisicaCognitiva: form.limitacionFisicaCognitiva,
        descripcionLimitacion: form.descripcionLimitacion,
      };

      // Relations: send as { id } objects
      if (form.tipoDocumento) body.tipoDocumento = { id: form.tipoDocumento };
      if (form.lugarExpedicion) body.lugarExpedicion = { id: form.lugarExpedicion };
      if (form.departamentoNacimiento) body.departamentoNacimiento = { id: form.departamentoNacimiento };
      if (form.municipioNacimiento) body.municipioNacimiento = { id: form.municipioNacimiento };
      if (form.nivelEducativo) body.nivelEducativo = { id: form.nivelEducativo };
      if (form.departamentoInstitucion) body.departamentoInstitucion = { id: form.departamentoInstitucion };
      if (form.municipioInstitucion) body.municipioInstitucion = { id: form.municipioInstitucion };
      if (form.parentesco) body.parentesco = { id: form.parentesco };
      if (form.grupoId) body.grupo = { id: form.grupoId };

      const res = await fetch(`${API_BASE}/api/auth/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al actualizar');
      }

      const updated = await res.json();
      // Update localStorage
      saveAuth(token!, {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
      });

      setMessage({ type: 'success', text: 'Datos actualizados correctamente' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Error al cambiar contraseña';
        throw new Error(msg);
      }

      setPasswordMsg({ type: 'success', text: 'contraseña actualizada correctamente' });
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setSavingPassword(false);
    }
  }

  function handleLogout() {
    if (confirm('Seguro que quieres cerrar sesion?')) {
      logout();
      window.location.href = '/';
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Cargando perfil...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        No se pudo cargar el perfil.
      </div>
    );
  }

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelCls = 'block text-sm font-semibold text-slate-700 mb-1';
  const sectionCls = 'bg-white rounded-lg shadow-md border border-slate-200 p-6';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Mi cuenta</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:underline cursor-pointer"
        >
          Cerrar sesion
        </button>
      </div>

      {/* Mensaje global */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Cambiar contraseña */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Cambiar contraseña</h2>
          <button
            type="button"
            onClick={() => { setShowPassword(!showPassword); setPasswordMsg(null); setShowPasswordText(false); }}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            {showPassword ? 'Cancelar' : 'Cambiar'}
          </button>
        </div>

        {showPassword && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordMsg && (
              <div className={`p-3 rounded-lg text-sm ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {passwordMsg.text}
              </div>
            )}
            <div>
              <label className={labelCls}>Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls}
                  placeholder="Minimo 8 caracteres, mayuscula, minuscula y numero"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPasswordText ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPasswordText ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingPassword ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Datos personales */}
        <div className={sectionCls}>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Datos Personales</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombres *</label>
              <input type="text" required value={form.firstName} onChange={(e) => update({ firstName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Apellidos *</label>
              <input type="text" required value={form.lastName} onChange={(e) => update({ lastName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha de Nacimiento</label>
              <input type="date" value={form.birthDate} onChange={(e) => update({ birthDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nacionalidad</label>
              <input type="text" value={form.nationality} onChange={(e) => update({ nationality: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Barrio</label>
              <input type="text" value={form.barrio} onChange={(e) => update({ barrio: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Documento */}
        <div className={sectionCls}>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Documento de Identidad</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo de Documento</label>
              <select value={form.tipoDocumento} onChange={(e) => update({ tipoDocumento: e.target.value })} className={inputCls}>
                <option value="">Selecciona...</option>
                {tiposDocumento.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Numero de Documento</label>
              <input type="text" value={form.documentNumber} onChange={(e) => update({ documentNumber: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Departamento de Nacimiento</label>
              <select
                value={form.departamentoNacimiento}
                onChange={(e) => update({ departamentoNacimiento: e.target.value, municipioNacimiento: '' })}
                className={inputCls}
              >
                <option value="">Selecciona...</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Municipio de Nacimiento</label>
              <SearchableSelect
                options={municipiosNacimiento}
                value={form.municipioNacimiento}
                onChange={(val) => update({ municipioNacimiento: val })}
                placeholder="Buscar municipio..."
                disabled={!form.departamentoNacimiento || loadingMunicNac}
              />
            </div>
            <div>
              <label className={labelCls}>Lugar de Expedicion</label>
              <SearchableSelect
                options={allMunicipios}
                value={form.lugarExpedicion}
                onChange={(val) => update({ lugarExpedicion: val })}
                placeholder="Buscar municipio..."
                disabled={loadingAllMunicipios}
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className={sectionCls}>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Contacto</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Correo Electronico *</label>
              <input type="email" required value={form.email} onChange={(e) => update({ email: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Telefono</label>
              <input type="tel" value={form.telephone} onChange={(e) => update({ telephone: e.target.value })} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Direccion</label>
              <input type="text" value={form.address} onChange={(e) => update({ address: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Educacion */}
        <div className={sectionCls}>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Informacion Educativa</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nivel Educativo</label>
              <select value={form.nivelEducativo} onChange={(e) => update({ nivelEducativo: e.target.value })} className={inputCls}>
                <option value="">Selecciona...</option>
                {nivelesEducativos.map((n) => (
                  <option key={n.id} value={n.id}>{n.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ano de Certificacion</label>
              <input type="number" value={form.anioCertificacion} onChange={(e) => update({ anioCertificacion: e.target.value })} className={inputCls} placeholder="Ej: 2020" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Institucion Educativa</label>
              <input type="text" value={form.institucionEducativa} onChange={(e) => update({ institucionEducativa: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Departamento de la Institucion</label>
              <select
                value={form.departamentoInstitucion}
                onChange={(e) => update({ departamentoInstitucion: e.target.value, municipioInstitucion: '' })}
                className={inputCls}
              >
                <option value="">Selecciona...</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Municipio de la Institucion</label>
              <SearchableSelect
                options={municipiosInstitucion}
                value={form.municipioInstitucion}
                onChange={(val) => update({ municipioInstitucion: val })}
                placeholder="Buscar municipio..."
                disabled={!form.departamentoInstitucion || loadingMunicInst}
              />
            </div>
          </div>
        </div>

        {/* Acudiente */}
        <div className={sectionCls}>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Informacion del Acudiente</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre del Acudiente</label>
              <input type="text" value={form.nombreAcudiente} onChange={(e) => update({ nombreAcudiente: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Telefono del Acudiente</label>
              <input type="tel" value={form.numeroContactoAcudiente} onChange={(e) => update({ numeroContactoAcudiente: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Parentesco</label>
              <select value={form.parentesco} onChange={(e) => update({ parentesco: e.target.value })} className={inputCls}>
                <option value="">Selecciona...</option>
                {parentescos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Direccion del Acudiente</label>
              <input type="text" value={form.direccionAcudiente} onChange={(e) => update({ direccionAcudiente: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Condiciones especiales */}
        <div className={sectionCls}>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Condiciones Especiales</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.limitacionFisicaCognitiva}
                onChange={(e) => update({ limitacionFisicaCognitiva: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Tengo una limitacion fisica o cognitiva</span>
            </label>
            {form.limitacionFisicaCognitiva && (
              <div>
                <label className={labelCls}>Descripcion de la limitacion</label>
                <textarea
                  value={form.descripcionLimitacion}
                  onChange={(e) => update({ descripcionLimitacion: e.target.value })}
                  className={inputCls}
                  rows={3}
                />
              </div>
            )}
            <div>
              <label className={labelCls}>Grupo Poblacional</label>
              <select value={form.grupoId} onChange={(e) => update({ grupoId: e.target.value })} className={inputCls}>
                <option value="">Ninguno</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Boton guardar */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
