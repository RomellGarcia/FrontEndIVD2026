import React, { useState, useEffect } from 'react';
import { eventosAPI, notificacionesAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, Alert, CircularProgress, Chip, Avatar, Divider, Pagination,
} from '@mui/material';
import {
  Download as DownloadIcon, Event as EventIcon, HowToReg as InscritoIcon,
  ListAlt as ListAltIcon, Groups as GroupsIcon, CheckCircle as CheckIcon,
  Visibility as VisibilityIcon, ArrowBack as ArrowBackIcon, EventAvailable as EventAvailableIcon,
  Cancel as CancelIcon, NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
};

const tableHeadSx = { fontWeight: 700, color: '#fff', fontSize: '0.72rem', textTransform: 'uppercase', py: 2 };

// Los PDF los abre el navegador solo; Word/Excel pasan por el visor
// público de Google Docs (mismo patrón que en Eventos y Convocatoria).
const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

const MisConvocatoriasAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [misConvocatorias, setMisConvocatorias] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Vistas y selección
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState(null);
  const [vista, setVista] = useState('lista'); // 'lista' o 'detalle'

  const [page, setPage] = useState(1);
  const porPagina = 8;
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatos();
    cargarNotificaciones();
  }, [user]);

  const cargarNotificaciones = async () => {
    try {
      const response = await notificacionesAPI.getMias();
      setNotificaciones(response.data.notificaciones || []);
    } catch {
      // No es crítico si falla; simplemente no se muestra el banner.
    }
  };

  const handleCerrarNotificacion = async (id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificacionesAPI.marcarLeidas([id]);
    } catch {
      // Si falla marcar como leída, no pasa nada grave: se vuelve a
      // mostrar la próxima vez, que es un fallo tolerable.
    }
  };

  const getConvId = (conv) => String(conv?.convocatoria_id ?? conv?._id ?? conv?.id ?? '');

  const cargarDatos = async () => {
    try {
      setLoading(true); setErrorMessage('');

      const [convRes, inscRes] = await Promise.allSettled([
        eventosAPI.getMisConvocatorias(),
        eventosAPI.getMisInscripciones(),
      ]);

      if (inscRes.status !== 'fulfilled' || convRes.status !== 'fulfilled') {
        setErrorMessage('Error al cargar tus convocatorias registradas.');
        setMisConvocatorias([]);
        return;
      }

      const inscripciones = inscRes.value.data.inscripciones || inscRes.value.data || [];
      const idsInscritos = inscripciones
        .map(i => i.convocatoria_id ?? i.convocatoriaId ?? i.eventoId ?? i.id ?? i._id)
        .filter((v) => v !== undefined && v !== null)
        .map(String);

      const todasLasConvocatorias = convRes.value.data.convocatorias || [];

      // Cruzamos ambas fuentes: solo nos quedamos con las convocatorias
      // que aparecen también en la lista de inscripciones del atleta.
      const registradas = todasLasConvocatorias
        .filter((conv) => idsInscritos.includes(getConvId(conv)))
        .map((conv) => {
          // Si el backend trae la inscripción con más datos (folio, fecha de
          // registro, etc.), los anexamos a la convocatoria para mostrarlos.
          const inscripcion = inscripciones.find(
            (i) => String(i.convocatoria_id ?? i.convocatoriaId ?? i.eventoId ?? i.id ?? i._id) === getConvId(conv)
          );
          return { ...conv, _inscripcion: inscripcion || null };
        });

      setMisConvocatorias(registradas);
      if (registradas.length === 0) {
        setErrorMessage('Aún no te has inscrito a ninguna convocatoria.');
      }
    } catch {
      setErrorMessage('Error al cargar tus convocatorias registradas.');
    } finally { setLoading(false); }
  };

  const fmt = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const fmtCorta = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const esProxima = (conv) => {
    if (!conv.fecha) return false;
    return new Date(conv.fecha) >= new Date();
  };

  const totalProximas = misConvocatorias.filter(esProxima).length;

  // El backend puede exponer el conteo de inscritos con distintos nombres de
  // campo según cómo se haya construido el endpoint; contemplamos varias.
  const totalInscritosEnConv = (conv) =>
    conv?.total_inscritos ?? conv?.inscritos_count ?? conv?.numero_inscritos ?? conv?.inscritosCount ?? null;

  const handleVerDetalles = (conv) => {
    setConvocatoriaSeleccionada(conv);
    setVista('detalle');
  };

  const handleCancelarInscripcion = async (conv) => {
    const inscripcionId = conv?._inscripcion?.id;
    if (!inscripcionId) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró el registro de esta inscripción.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    const result = await Swal.fire({
      title: '¿Cancelar inscripción?',
      text: `Se cancelará tu inscripción a "${conv.titulo}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: COLORS.burgundy,
      cancelButtonColor: COLORS.purple,
      confirmButtonText: 'Sí, cancelar inscripción',
      cancelButtonText: 'No, mantenerla',
    });
    if (!result.isConfirmed) return;

    try {
      await eventosAPI.cancelarInscripcion(inscripcionId);
      Swal.fire({ icon: 'success', title: 'Inscripción cancelada', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
      if (vista === 'detalle') setVista('lista');
      await cargarDatos();
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al cancelar la inscripción.';
      Swal.fire({ icon: 'error', title: 'No se pudo cancelar', text: mensaje, confirmButtonColor: COLORS.burgundy });
    }
  };

  const descargarDocumentoOficial = (conv) => {
    if (!conv.documentoConvocatoria) {
      Swal.fire({ icon: 'info', title: 'Sin documento', text: 'Este evento no tiene un documento oficial subido todavía.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    abrirDocumentoParaVer(conv.documentoConvocatoria);
  };

  const misConvocatoriasPaginadas = misConvocatorias.slice((page - 1) * porPagina, page * porPagina);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>

      {/* ── Franja de bienvenida ── */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          {vista === 'detalle' && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setVista('lista')}
              sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Volver a mis convocatorias
            </Button>
          )}
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Atleta
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            {vista === 'lista' ? 'Mis Convocatorias' : 'Detalle de mi Inscripción'}
          </Typography>
          {vista === 'lista' && (
            <Button
              onClick={() => navigate('/atleta/convocatoria')}
              startIcon={<EventAvailableIcon />}
              sx={{ mt: 2, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', textTransform: 'none', fontWeight: 700 }}
              variant="outlined"
              size="small"
            >
              Ver convocatorias disponibles
            </Button>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>

        {vista === 'lista' ? (
          <>
            {/* Stat-strip */}
            <Box sx={{ mt: -6, mb: 4, bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.14)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
                <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><ListAltIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.7rem' }}>{misConvocatorias.length}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Inscripciones totales</Typography>
              </Box>
              <Box sx={{ p: 2.5, textAlign: 'center' }}>
                <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.7rem' }}>{totalProximas}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Eventos próximos</Typography>
              </Box>
            </Box>

            {errorMessage && <Alert severity="info" sx={{ mb: 3 }}>{errorMessage}</Alert>}

            {/* ── Notificaciones (ej. convocatorias/eventos cancelados) ── */}
            {notificaciones.map((n) => (
              <Alert
                key={n.id}
                severity="warning"
                icon={<NotificationsActiveIcon />}
                onClose={() => handleCerrarNotificacion(n.id)}
                sx={{ mb: 2, borderRadius: '8px' }}
              >
                {n.mensaje}
              </Alert>
            ))}

            {misConvocatorias.length === 0 ? (
              <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', textAlign: 'center', py: 6 }}>
                <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}><InscritoIcon sx={{ fontSize: 32, color: COLORS.purple }} /></Avatar>
                <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>Sin inscripciones registradas</Typography>
                <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5, mb: 3 }}>
                  Explora las convocatorias disponibles e inscríbete a tu próximo evento.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/atleta/convocatoria')}
                  sx={{ bgcolor: COLORS.burgundy, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: COLORS.burgundyDark } }}
                >
                  Ver convocatorias disponibles
                </Button>
              </Box>
            ) : (
              <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                      {['Evento', 'Disciplina', 'Categoría', 'Fecha', 'Estado', 'Acciones'].map((h) => (
                        <TableCell key={h} sx={tableHeadSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {misConvocatoriasPaginadas.map((conv) => (
                      <TableRow key={getConvId(conv)} hover>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{conv.titulo}</Typography>
                          <Typography variant="caption" sx={{ color: COLORS.purple }}>{conv.lugar}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{conv.disciplina}</TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Chip label={conv.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, color: COLORS.purple }} />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{fmtCorta(conv.fecha)}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Chip
                            icon={<CheckIcon sx={{ fontSize: 16 }} />}
                            label="Inscrito"
                            size="small"
                            sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Box sx={{ display: 'flex', gap: .5, flexWrap: 'wrap' }}>
                            <Button size="small" onClick={() => handleVerDetalles(conv)} endIcon={<VisibilityIcon />} sx={{ color: COLORS.burgundy, fontWeight: 700, textTransform: 'none' }}>
                              Ver detalles
                            </Button>
                            {esProxima(conv) && (
                              <Button size="small" onClick={() => handleCancelarInscripcion(conv)} startIcon={<CancelIcon fontSize="small" />} sx={{ color: '#A13A3A', fontWeight: 700, textTransform: 'none' }}>
                                Cancelar
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {misConvocatorias.length > porPagina && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <Pagination count={Math.ceil(misConvocatorias.length / porPagina)} page={page} onChange={(e, v) => setPage(v)} />
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : (
          /* ── VISTA DE DETALLE ── */
          <Box>
            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', mt: -6, p: { xs: 3, md: 5 }, boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.burgundy, mb: 1 }}>{convocatoriaSeleccionada?.titulo}</Typography>
                  <Typography variant="subtitle1" sx={{ color: COLORS.purple }}>Información Oficial de la Convocatoria</Typography>
                </Box>
                <Chip
                  icon={<CheckIcon />}
                  label="Ya estás inscrito"
                  sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700, px: 1, py: 2.2 }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 3, mb: 4 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Disciplina</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{convocatoriaSeleccionada?.disciplina}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría y Género</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{convocatoriaSeleccionada?.categoria} ({convocatoriaSeleccionada?.genero})</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar y Fecha del Evento</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{convocatoriaSeleccionada?.lugar} - {fmt(convocatoriaSeleccionada?.fecha)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Cierre de Inscripciones</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{fmt(convocatoriaSeleccionada?.fecha_cierre || convocatoriaSeleccionada?.fechaCierre)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Atletas inscritos</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    <GroupsIcon sx={{ fontSize: 20, color: COLORS.purple }} />
                    {totalInscritosEnConv(convocatoriaSeleccionada) ?? 'No disponible'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => descargarDocumentoOficial(convocatoriaSeleccionada)}
                  sx={{ borderColor: COLORS.burgundy, color: COLORS.burgundy, fontWeight: 700, textTransform: 'none' }}
                >
                  Descargar Documento Oficial
                </Button>
                {esProxima(convocatoriaSeleccionada) && (
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancelarInscripcion(convocatoriaSeleccionada)}
                    sx={{ borderColor: '#A13A3A', color: '#A13A3A', fontWeight: 700, textTransform: 'none' }}
                  >
                    Cancelar Inscripción
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default MisConvocatoriasAtleta;