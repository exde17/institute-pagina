// src/components/admin/MatriculasAdmin.tsx
import { useEffect, useState } from 'react';
import {
  getAllMatriculas,
  getEntidadesActivas,
  markAsBecado,
  removeBecado,
  generarLinkPagoMatricula,
  enviarEmailLinkPago,
  type Matricula,
  type Entidad,
  type Cuota,
} from '../../lib/matriculaApi';
import { getToken } from '../../lib/auth';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://apifcm.bg3sas.com';

export default function MatriculasAdmin() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMatricula, setSelectedMatricula] = useState<Matricula | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMatricula, setPaymentMatricula] = useState<Matricula | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Estados para gestión de becas
  const [showBecaModal, setShowBecaModal] = useState(false);
  const [becaMatricula, setBecaMatricula] = useState<Matricula | null>(null);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [selectedEntidad, setSelectedEntidad] = useState<string>('');
  const [savingBeca, setSavingBeca] = useState(false);

  // Estados para cuotas
  const [showCuotasModal, setShowCuotasModal] = useState(false);
  const [cuotasMatricula, setCuotasMatricula] = useState<Matricula | null>(null);
  const [sendingLinkCuota, setSendingLinkCuota] = useState<string | null>(null);

  // Estado para resultado del envío
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadMatriculas();
    loadEntidades();
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

  async function loadEntidades() {
    try {
      const token = getToken();
      if (!token) return;

      const data = await getEntidadesActivas(token);
      setEntidades(data);
    } catch (err) {
      console.error('Error loading entidades:', err);
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

  function formatCurrency(value: number | null) {
    if (value === null || value === undefined) return '-';
    return `$${Number(value).toLocaleString('es-CO')}`;
  }

  function getDocumentUrl(relativePath: string): string {
    return `${API_BASE}/${relativePath}`;
  }

  function openDocument(relativePath: string) {
    const fullUrl = getDocumentUrl(relativePath);
    window.open(fullUrl, '_blank');
  }

  function openPaymentModal(matricula: Matricula) {
    setPaymentMatricula(matricula);
    setSendResult(null);
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setPaymentMatricula(null);
    setSendResult(null);
  }

  function openBecaModal(matricula: Matricula) {
    setBecaMatricula(matricula);
    setSelectedEntidad(matricula.entidad?.id || '');
    setShowBecaModal(true);
  }

  function closeBecaModal() {
    setShowBecaModal(false);
    setBecaMatricula(null);
    setSelectedEntidad('');
  }

  function openCuotasModal(matricula: Matricula) {
    setCuotasMatricula(matricula);
    setShowCuotasModal(true);
  }

  function closeCuotasModal() {
    setShowCuotasModal(false);
    setCuotasMatricula(null);
  }

  async function handleSendPaymentLink() {
    if (!paymentMatricula) return;

    try {
      setGeneratingLink(true);
      setSendResult(null);

      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      // Determinar el email destinatario
      const email = paymentMatricula.esBecado && paymentMatricula.entidad?.correo
        ? paymentMatricula.entidad.correo
        : paymentMatricula.estudiante.email;

      // Determinar monto y cuota según tipo de pago
      // Si está becado, siempre se cobra el monto TOTAL a la entidad (no por cuotas)
      let monto: number;
      let cuotaId: string | undefined;

      if (paymentMatricula.esBecado) {
        // Becado: siempre el monto total, sin importar si eligió cuotas
        monto = Number(paymentMatricula.valorTotal) || 0;
        cuotaId = undefined; // No es pago de cuota, es pago total
      } else if (paymentMatricula.tipoPago === 'CUOTAS' && paymentMatricula.cuotas?.length > 0) {
        // No becado con cuotas: pagar cuota por cuota
        const primeraCuotaPendiente = [...paymentMatricula.cuotas]
          .sort((a, b) => a.numeroCuota - b.numeroCuota)
          .find(c => !c.pagado);
        if (primeraCuotaPendiente) {
          cuotaId = primeraCuotaPendiente.id;
          monto = Number(primeraCuotaPendiente.monto);
        } else {
          setSendResult({
            success: false,
            message: 'No hay cuotas pendientes de pago',
          });
          return;
        }
      } else {
        // No becado, pago de contado
        monto = Number(paymentMatricula.valorTotal) || 0;
      }

      const nombreCompleto = `${paymentMatricula.estudiante.firstName} ${paymentMatricula.estudiante.lastName}`;
      const nombrePrograma = paymentMatricula.inscripcion.programa.nombre;

      // 1. Primero generar el link de Wompi (con cuotaId para referencia en el SKU)
      const wompiResult = await generarLinkPagoMatricula(
        paymentMatricula.id,
        monto / 1000, // La función espera el monto en miles
        nombreCompleto,
        nombrePrograma,
        token,
        cuotaId // Pasar cuotaId para que Wompi lo guarde en el SKU
      );

      // 2. Luego enviar el email con el link generado (incluye linkId para asociar en BD)
      const result = await enviarEmailLinkPago(
        paymentMatricula.id,
        email,
        wompiResult.url,
        monto,
        cuotaId,
        token,
        wompiResult.linkId
      );

      setSendResult({
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        // Esperar 3 segundos antes de cerrar
        setTimeout(() => {
          closePaymentModal();
          setSendResult(null);
        }, 3000);
      }
    } catch (err) {
      setSendResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al enviar link de pago',
      });
      console.error('Error enviando link de pago:', err);
    } finally {
      setGeneratingLink(false);
    }
  }

  async function handleSendCuotaLink(cuota: Cuota) {
    if (!cuotasMatricula) return;

    try {
      setSendingLinkCuota(cuota.id);

      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const email = cuotasMatricula.esBecado && cuotasMatricula.entidad?.correo
        ? cuotasMatricula.entidad.correo
        : cuotasMatricula.estudiante.email;

      const monto = Number(cuota.monto);
      const nombreCompleto = `${cuotasMatricula.estudiante.firstName} ${cuotasMatricula.estudiante.lastName}`;
      const nombrePrograma = cuotasMatricula.inscripcion.programa.nombre;

      // 1. Primero generar el link de Wompi (con cuota.id para referencia en el SKU)
      const wompiResult = await generarLinkPagoMatricula(
        cuotasMatricula.id,
        monto / 1000, // La función espera el monto en miles
        nombreCompleto,
        nombrePrograma,
        token,
        cuota.id // Pasar cuota.id para que Wompi lo guarde en el SKU
      );

      // 2. Luego enviar el email con el link generado (incluye linkId para asociar en BD)
      const result = await enviarEmailLinkPago(
        cuotasMatricula.id,
        email,
        wompiResult.url,
        monto,
        cuota.id,
        token,
        wompiResult.linkId
      );

      if (result.success) {
        alert(`Link de pago para la cuota #${cuota.numeroCuota} enviado exitosamente a ${result.email}`);
      } else {
        alert('Error al enviar el link de pago');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al enviar link de pago');
      console.error('Error enviando link de cuota:', err);
    } finally {
      setSendingLinkCuota(null);
    }
  }

  async function handleSaveBeca() {
    if (!becaMatricula) return;

    try {
      setSavingBeca(true);
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      if (selectedEntidad) {
        await markAsBecado(becaMatricula.id, selectedEntidad, token);
      } else {
        await removeBecado(becaMatricula.id, token);
      }

      await loadMatriculas();
      closeBecaModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar estado de beca');
      console.error('Error saving beca:', err);
    } finally {
      setSavingBeca(false);
    }
  }

  async function handleRemoveBeca() {
    if (!becaMatricula) return;

    try {
      setSavingBeca(true);
      const token = getToken();
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      await removeBecado(becaMatricula.id, token);
      await loadMatriculas();
      closeBecaModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al quitar beca');
      console.error('Error removing beca:', err);
    } finally {
      setSavingBeca(false);
    }
  }


  function getEstadoMatriculaBadge(estadoMatricula: string | undefined) {
    switch (estadoMatricula) {
      case 'PAGADO':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Pagado</span>;
      case 'PAGO_PARCIAL':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pago Parcial</span>;
      case 'PENDIENTE_PAGO':
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Pendiente</span>;
    }
  }

  function getTipoPagoBadge(tipoPago: string | null) {
    if (!tipoPago) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">No definido</span>;
    }
    switch (tipoPago) {
      case 'CONTADO':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Contado</span>;
      case 'CUOTAS':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Cuotas</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{tipoPago}</span>;
    }
  }

  function getCuotaEstadoBadge(estado: string) {
    switch (estado) {
      case 'PAGADO':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Pagado</span>;
      case 'VENCIDO':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Vencido</span>;
      case 'PENDIENTE':
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>;
    }
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
              <th className="px-4 py-4 text-left text-sm font-semibold">Estudiante</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Programa</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Tipo Pago</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Valor</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Estado</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Beca</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Fecha</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {matriculas.map((matricula) => (
              <tr key={matricula.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {matricula.estudiante.firstName} {matricula.estudiante.lastName}
                    </p>
                    <p className="text-xs text-slate-600">{matricula.estudiante.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-900 text-sm">{matricula.inscripcion.programa.nombre}</p>
                  <p className="text-xs text-slate-600">{matricula.inscripcion.programa.modalidad}</p>
                </td>
                <td className="px-4 py-4">
                  {getTipoPagoBadge(matricula.tipoPago)}
                  {matricula.tipoPago === 'CUOTAS' && matricula.cuotas?.length > 0 && (
                    <button
                      onClick={() => openCuotasModal(matricula)}
                      className="ml-2 text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      Ver cuotas ({matricula.cuotas.filter(c => c.pagado).length}/{matricula.cuotas.length})
                    </button>
                  )}
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-900">{formatCurrency(matricula.valorTotal)}</p>
                </td>
                <td className="px-4 py-4">
                  {getEstadoMatriculaBadge(matricula.estadoMatricula)}
                </td>
                <td className="px-4 py-4">
                  {matricula.esBecado ? (
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Becado
                      </span>
                      {matricula.entidad && (
                        <p className="text-xs text-slate-600 mt-1">{matricula.entidad.razonSocial}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs text-slate-900">{formatDate(matricula.createdAt)}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setSelectedMatricula(matricula)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Documentos
                    </button>
                    <button
                      onClick={() => openBecaModal(matricula)}
                      className="px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      Beca
                    </button>
                    <button
                      onClick={() => openPaymentModal(matricula)}
                      className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      Pago
                    </button>
                  </div>
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
                      {selectedMatricula.inscripcion.programa.modalidad} - {selectedMatricula.inscripcion.programa.duracion} semestres
                    </p>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4">Documentos Cargados</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-slate-900">Documento de identidad del estudiante</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openDocument(selectedMatricula.documentoEstudiante)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Ver
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-slate-900">Certificado de estudio</p>
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
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-slate-900">Documento de identidad del acudiente</p>
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

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-slate-900">Consentimiento de matrícula</p>
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

      {/* Modal de beca */}
      {showBecaModal && becaMatricula && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeBecaModal}>
          <div className="bg-white rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-bold text-white">Gestionar Beca</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Estudiante:</span> {becaMatricula.estudiante.firstName} {becaMatricula.estudiante.lastName}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Programa:</span> {becaMatricula.inscripcion.programa.nombre}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Estado actual:</span> {becaMatricula.esBecado ? 'Becado' : 'No becado'}
                </p>
              </div>

              <div>
                <label htmlFor="entidad" className="block text-sm font-semibold text-slate-900 mb-2">
                  Entidad Patrocinadora
                </label>
                <select
                  id="entidad"
                  value={selectedEntidad}
                  onChange={(e) => setSelectedEntidad(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={savingBeca}
                >
                  <option value="">-- Sin beca --</option>
                  {entidades.map((entidad) => (
                    <option key={entidad.id} value={entidad.id}>
                      {entidad.razonSocial} ({entidad.nit})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Selecciona una entidad para marcar como becado, o deja vacío para quitar la beca.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeBecaModal}
                  disabled={savingBeca}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBeca}
                  disabled={savingBeca}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingBeca ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cuotas */}
      {showCuotasModal && cuotasMatricula && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeCuotasModal}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Cuotas de Pago</h3>
              <button
                onClick={closeCuotasModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Estudiante:</span> {cuotasMatricula.estudiante.firstName} {cuotasMatricula.estudiante.lastName}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Valor total:</span> {formatCurrency(cuotasMatricula.valorTotal)}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Plan:</span> {cuotasMatricula.planPagoSeleccionado?.nombre || 'N/A'}
                </p>
              </div>

              <div className="space-y-3">
                {[...cuotasMatricula.cuotas].sort((a, b) => a.numeroCuota - b.numeroCuota).map((cuota) => (
                  <div key={cuota.id} className={`p-4 rounded-lg border ${cuota.pagado ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">Cuota #{cuota.numeroCuota}</p>
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(cuota.monto)}</p>
                        <p className="text-xs text-slate-600">
                          Vencimiento: {new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES')}
                        </p>
                        {cuota.fechaPago && (
                          <p className="text-xs text-green-600">
                            Pagado: {new Date(cuota.fechaPago).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {getCuotaEstadoBadge(cuota.estado)}
                        {!cuota.pagado && (
                          <button
                            onClick={() => handleSendCuotaLink(cuota)}
                            disabled={sendingLinkCuota === cuota.id}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 block w-full"
                          >
                            {sendingLinkCuota === cuota.id ? 'Enviando...' : 'Enviar link de pago'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {cuotasMatricula.cuotas.length === 0 && (
                <p className="text-center text-slate-600 py-4">No hay cuotas registradas.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago - Confirmación de envío de link */}
      {showPaymentModal && paymentMatricula && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closePaymentModal}>
          <div className="bg-white rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-bold text-white">Enviar Link de Pago</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Resultado del envío */}
              {sendResult && (
                <div className={`p-4 rounded-lg ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {sendResult.success ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <p className={`font-semibold ${sendResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {sendResult.message}
                    </p>
                  </div>
                </div>
              )}

              {!sendResult && (
                <>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Estudiante:</span> {paymentMatricula.estudiante.firstName} {paymentMatricula.estudiante.lastName}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Programa:</span> {paymentMatricula.inscripcion.programa.nombre}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Tipo de pago:</span> {paymentMatricula.tipoPago === 'CONTADO' ? 'Contado' : 'Cuotas'}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Valor total:</span> {formatCurrency(paymentMatricula.valorTotal)}
                    </p>
                    {paymentMatricula.esBecado && paymentMatricula.entidad && (
                      <p className="text-sm text-amber-700">
                        <span className="font-semibold">Beca:</span> {paymentMatricula.entidad.razonSocial}
                      </p>
                    )}
                  </div>

                  {/* Info del pago que se enviará */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Se enviará:</h4>
                    {paymentMatricula.esBecado ? (
                      // Becado: siempre muestra el pago total (la entidad paga todo)
                      <div className="text-sm text-blue-800">
                        <p><span className="font-semibold">Concepto:</span> Pago Total - Beca</p>
                        <p><span className="font-semibold">Monto:</span> {formatCurrency(paymentMatricula.valorTotal)}</p>
                        <p className="text-amber-700 mt-1">
                          <span className="font-semibold">Pagado por:</span> {paymentMatricula.entidad?.razonSocial || 'Entidad'}
                        </p>
                      </div>
                    ) : paymentMatricula.tipoPago === 'CUOTAS' && paymentMatricula.cuotas?.length > 0 ? (
                      // No becado con cuotas
                      <>
                        {(() => {
                          const cuotaPendiente = [...paymentMatricula.cuotas]
                            .sort((a, b) => a.numeroCuota - b.numeroCuota)
                            .find(c => !c.pagado);
                          if (cuotaPendiente) {
                            return (
                              <div className="text-sm text-blue-800">
                                <p><span className="font-semibold">Cuota:</span> #{cuotaPendiente.numeroCuota} de {paymentMatricula.cuotas.length}</p>
                                <p><span className="font-semibold">Monto:</span> {formatCurrency(cuotaPendiente.monto)}</p>
                                <p><span className="font-semibold">Vencimiento:</span> {new Date(cuotaPendiente.fechaVencimiento).toLocaleDateString('es-ES')}</p>
                              </div>
                            );
                          }
                          return <p className="text-sm text-green-700">Todas las cuotas están pagadas</p>;
                        })()}
                      </>
                    ) : (
                      // No becado, pago de contado
                      <div className="text-sm text-blue-800">
                        <p><span className="font-semibold">Concepto:</span> Pago Total - Matrícula</p>
                        <p><span className="font-semibold">Monto:</span> {formatCurrency(paymentMatricula.valorTotal)}</p>
                      </div>
                    )}
                  </div>

                  {/* Destinatario */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Destinatario del email:</span>
                      <br />
                      {paymentMatricula.esBecado && paymentMatricula.entidad?.correo
                        ? `${paymentMatricula.entidad.correo} (Entidad patrocinadora)`
                        : paymentMatricula.estudiante.email
                      }
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={closePaymentModal}
                      disabled={generatingLink}
                      className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSendPaymentLink}
                      disabled={generatingLink || (paymentMatricula.tipoPago === 'CUOTAS' && !paymentMatricula.cuotas?.find(c => !c.pagado))}
                      className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generatingLink ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        'Enviar Link de Pago'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
