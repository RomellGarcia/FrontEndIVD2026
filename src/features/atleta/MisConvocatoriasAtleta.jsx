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
  CalendarToday as CalendarIcon, AccessTime as TimeIcon, LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
};

const estilosCabeceraTabla = { fontWeight: 700, color: '#fff', fontSize: '0.72rem', textTransform: 'uppercase', py: 2 };

// Abre un documento en el visor correspondiente (PDF directo, otros con Google Viewer)
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
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(true);

  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState(null);
  const [vista, setVista] = useState('lista');

  const [pagina, setPagina] = useState(1);
  const porPagina = 8;
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatos();
    cargarNotificaciones();
  }, [user]);

  // Carga las notificaciones del atleta
  const cargarNotificaciones = async () => {
    try {
      const response = await notificacionesAPI.getMias();
      setNotificaciones(response.data.notificaciones || []);
    } catch {
    }
  };

  // Marca una notificación como leída y la elimina de la lista local
  const manejarCerrarNotificacion = async (id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificacionesAPI.marcarLeidas([id]);
    } catch {
    }
  };

  // Obtiene el ID de una convocatoria de forma consistente
  const obtenerIdConvocatoria = (convocatoria) =>
    String(convocatoria?.convocatoria_id ?? convocatoria?._id ?? convocatoria?.id ?? '');

  // Carga los datos del atleta: convocatorias disponibles e inscripciones
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setMensajeError('');

      const [convRes, inscRes] = await Promise.allSettled([
        eventosAPI.getMisConvocatorias(),
        eventosAPI.getMisInscripciones(),
      ]);

      if (inscRes.status !== 'fulfilled' || convRes.status !== 'fulfilled') {
        setMensajeError('Error al cargar tus convocatorias registradas.');
        setMisConvocatorias([]);
        return;
      }

      const inscripciones = inscRes.value.data.inscripciones || inscRes.value.data || [];
      const idsInscritos = inscripciones
        .map(i => i.convocatoria_id ?? i.convocatoriaId ?? i.eventoId ?? i.id ?? i._id)
        .filter((v) => v !== undefined && v !== null)
        .map(String);

      const todasLasConvocatorias = convRes.value.data.convocatorias || [];

      // Filtra solo las convocatorias en las que el atleta está inscrito
      const registradas = todasLasConvocatorias
        .filter((conv) => idsInscritos.includes(obtenerIdConvocatoria(conv)))
        .map((conv) => {
          const inscripcion = inscripciones.find(
            (i) => String(i.convocatoria_id ?? i.convocatoriaId ?? i.eventoId ?? i.id ?? i._id) === obtenerIdConvocatoria(conv)
          );
          return { ...conv, _inscripcion: inscripcion || null };
        });

      setMisConvocatorias(registradas);
      if (registradas.length === 0) {
        setMensajeError('Aún no te has inscrito a ninguna convocatoria.');
      }
    } catch {
      setMensajeError('Error al cargar tus convocatorias registradas.');
    } finally {
      setCargando(false);
    }
  };

  // Formatea fecha en formato largo
  const formatearFechaLarga = (fecha) =>
    fecha ? new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  // Formatea fecha en formato corto
  const formatearFechaCorta = (fecha) =>
    fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Determina si una convocatoria es futura (fecha mayor o igual a hoy)
  const esFuturo = (convocatoria) => {
    if (!convocatoria.fecha) return false;
    return new Date(convocatoria.fecha) >= new Date();
  };

  // Total de convocatorias futuras
  const totalFuturas = misConvocatorias.filter(esFuturo).length;

  // Obtiene el número de inscritos de una convocatoria (varios nombres de campo posibles)
  const totalInscritosEnConvocatoria = (convocatoria) =>
    convocatoria?.total_inscritos ?? convocatoria?.inscritos_count ?? convocatoria?.numero_inscritos ?? convocatoria?.inscritosCount ?? null;

  // Navega al detalle de una convocatoria
  const manejarVerDetalles = (convocatoria) => {
    setConvocatoriaSeleccionada(convocatoria);
    setVista('detalle');
  };

  // Cancela la inscripción a una convocatoria
  const manejarCancelarInscripcion = async (convocatoria) => {
    const inscripcionId = convocatoria?._inscripcion?.id;
    if (!inscripcionId) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se encontró el registro de esta inscripción.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    const result = await Swal.fire({
      title: '¿Cancelar inscripción?',
      text: `Se cancelará tu inscripción a "${convocatoria.titulo}". Esta acción no se puede deshacer.`,
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

  // Descarga el documento oficial de la convocatoria
  const descargarDocumentoOficial = (convocatoria) => {
    if (!convocatoria.documentoConvocatoria) {
      Swal.fire({ icon: 'info', title: 'Sin documento', text: 'Este evento no tiene un documento oficial subido todavía.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    abrirDocumentoParaVer(convocatoria.documentoConvocatoria);
  };

  const misConvocatoriasPaginadas = misConvocatorias.slice((pagina - 1) * porPagina, pagina * porPagina);

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      {/* Cabecera superior */}
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
            {/* Tarjeta de estadísticas */}
            <Box sx={{ mt: -6, mb: 4, bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.14)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
                <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><ListAltIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.7rem' }}>{misConvocatorias.length}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Inscripciones totales</Typography>
              </Box>
              <Box sx={{ p: 2.5, textAlign: 'center' }}>
                <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.7rem' }}>{totalFuturas}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Eventos próximos</Typography>
              </Box>
            </Box>

            {mensajeError && <Alert severity="info" sx={{ mb: 3 }}>{mensajeError}</Alert>}

            {/* Notificaciones */}
            {notificaciones.map((n) => (
              <Alert
                key={n.id}
                severity="warning"
                icon={<NotificationsActiveIcon />}
                onClose={() => manejarCerrarNotificacion(n.id)}
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
                      {['Evento', 'Disciplina', 'Categoría', 'Bib', 'Fecha', 'Estado', 'Acciones'].map((h) => (
                        <TableCell key={h} sx={estilosCabeceraTabla}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {misConvocatoriasPaginadas.map((conv) => (
                      <TableRow key={obtenerIdConvocatoria(conv)} hover>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{conv.titulo}</Typography>
                          <Typography variant="caption" sx={{ color: COLORS.purple }}>{conv.lugar}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{conv.disciplina}</TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Chip label={conv.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, color: COLORS.purple }} />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Chip
                            label={conv._inscripcion?.bib ? String(conv._inscripcion.bib).padStart(3, '0') : '—'}
                            size="small"
                            sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 800, fontFamily: 'monospace' }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{formatearFechaCorta(conv.fecha)}</Typography>
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
                            <Button size="small" onClick={() => manejarVerDetalles(conv)} endIcon={<VisibilityIcon />} sx={{ color: COLORS.burgundy, fontWeight: 700, textTransform: 'none' }}>
                              Ver detalles
                            </Button>
                            {esFuturo(conv) && (
                              <Button size="small" onClick={() => manejarCancelarInscripcion(conv)} startIcon={<CancelIcon fontSize="small" />} sx={{ color: '#A13A3A', fontWeight: 700, textTransform: 'none' }}>
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
                    <Pagination count={Math.ceil(misConvocatorias.length / porPagina)} page={pagina} onChange={(e, v) => setPagina(v)} />
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : (
          /* Vista de detalle de una convocatoria */
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 3, alignItems: 'flex-start', mt: { xs: -4, md: -5 } }}>
            {/* Columna izquierda: imagen y datos del evento */}
            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', p: { xs: 2.5, md: 3 }, boxShadow: '0 2px 12px rgba(128,0,32,0.07)', position: { md: 'sticky' }, top: { md: 24 } }}>
              {convocatoriaSeleccionada?.imagen_url && (
                <Box component="img" src={convocatoriaSeleccionada.imagen_url} alt={convocatoriaSeleccionada.titulo}
                  sx={{ width: '100%', height: { xs: 380, md: 460 }, objectFit: 'cover', borderRadius: '8px', mb: 2.5 }} />
              )}
              <Chip
                icon={<CheckIcon sx={{ fontSize: 16, color: `${COLORS.burgundy} !important` }} />}
                label="Ya estás inscrito"
                size="small"
                sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaLarga(convocatoriaSeleccionada?.fecha)}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <TimeIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Hora</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{convocatoriaSeleccionada?.hora || '—'}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <LocationIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{convocatoriaSeleccionada?.lugar}</Typography>
                </Box>
                {convocatoriaSeleccionada?.descripcion && (
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ mt: .3, lineHeight: 1.6, color: COLORS.ink, wordBreak: 'break-word' }}>
                      {convocatoriaSeleccionada.descripcion}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Columna derecha: información y acciones */}
            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', p: { xs: 3, md: 5 }, boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.burgundy, mb: 1 }}>{convocatoriaSeleccionada?.titulo}</Typography>
                  <Typography variant="subtitle1" sx={{ color: COLORS.purple }}>Información Oficial de la Convocatoria</Typography>
                </Box>
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
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Cierre de Inscripciones</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaLarga(convocatoriaSeleccionada?.fecha_cierre || convocatoriaSeleccionada?.fechaCierre)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Tu número de corredor</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.burgundy, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                    {convocatoriaSeleccionada?._inscripcion?.bib
                      ? String(convocatoriaSeleccionada._inscripcion.bib).padStart(3, '0')
                      : 'No disponible'}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Atletas inscritos</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    <GroupsIcon sx={{ fontSize: 20, color: COLORS.purple }} />
                    {totalInscritosEnConvocatoria(convocatoriaSeleccionada) ?? 'No disponible'}
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
                {esFuturo(convocatoriaSeleccionada) && (
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => manejarCancelarInscripcion(convocatoriaSeleccionada)}
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