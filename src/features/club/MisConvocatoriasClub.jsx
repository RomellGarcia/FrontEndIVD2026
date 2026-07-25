import React, { useState, useEffect } from 'react';
import { eventosAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, Alert, CircularProgress, Chip, Avatar, Divider, Pagination,
} from '@mui/material';
import {
  Download as DownloadIcon, Event as EventIcon, HowToReg as InscritoIcon,
  ListAlt as ListAltIcon, Groups as GroupsIcon, CheckCircle as CheckIcon,
  Visibility as VisibilityIcon, ArrowBack as ArrowBackIcon, EventAvailable as EventAvailableIcon,
  CalendarToday as CalendarIcon, AccessTime as TimeIcon, LocationOn as LocationIcon,
  Cancel as CancelIcon,
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

// Devuelve el texto legible para el género
const textoGenero = (genero) => {
  const g = (genero || '').toLowerCase();
  if (g === 'masculino') return 'Masculino';
  if (g === 'femenino') return 'Femenino';
  if (g === 'mixto') return 'Mixto';
  return genero || 'N/A';
};

// Abre un documento en el visor correspondiente
const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

// Formatea fecha en formato largo
const formatearFechaLarga = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

// Formatea fecha en formato corto
const formatearFechaCorta = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Obtiene el nombre completo de un atleta desde una inscripción
const obtenerNombreAtleta = (inscripcion) =>
  [inscripcion?.nombre, inscripcion?.apellido_paterno, inscripcion?.apellido_materno].filter(Boolean).join(' ');

const MisConvocatoriasClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inscripciones, setInscripciones] = useState([]);
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(true);

  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState(null);
  const [vista, setVista] = useState('lista');

  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 8;

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    cargarDatos();
  }, [user, navigate]);

  // Carga las inscripciones del club desde el backend
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setMensajeError('');
      const response = await eventosAPI.getMisInscripcionesClub();
      const data = response.data.inscripciones || response.data || [];
      setInscripciones(data);
      if (data.length === 0) setMensajeError('Aún no has inscrito a ningún atleta en convocatorias.');
    } catch (err) {
      console.error('Error al cargar inscripciones del club:', err);
      setMensajeError('Error al cargar las inscripciones de tu club.');
    } finally {
      setCargando(false);
    }
  };

  // Determina si una inscripción ya finalizó (evento finalizado, convocatoria cerrada o fecha pasada)
  const haTerminado = (inscripcion) =>
    !!inscripcion.evento_finalizado ||
    inscripcion.convocatoria_estado === false ||
    (inscripcion.fecha && new Date(inscripcion.fecha) < new Date());

  const esFuturo = (inscripcion) => !haTerminado(inscripcion);

  const inscripcionesActivas = inscripciones.filter((i) => !haTerminado(i));
  const totalFuturas = inscripcionesActivas.length;
  const atletasDistintos = new Set(inscripcionesActivas.map((i) => i.atleta_id)).size;

  const inscripcionesPaginadas = inscripcionesActivas.slice((pagina - 1) * registrosPorPagina, pagina * registrosPorPagina);

  // Navega al detalle de una inscripción
  const manejarVerDetalles = (inscripcion) => {
    setInscripcionSeleccionada(inscripcion);
    setVista('detalle');
  };

  // Descarga el documento oficial de la convocatoria
  const manejarDescargarDocumentoOficial = (inscripcion) => {
    if (!inscripcion?.documentoConvocatoria) {
      Swal.fire({ icon: 'info', title: 'Sin documento', text: 'Este evento no tiene un documento oficial subido todavía.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    abrirDocumentoParaVer(inscripcion.documentoConvocatoria);
  };

  // Cancela una inscripción
  const manejarCancelarInscripcion = async (inscripcion) => {
    const result = await Swal.fire({
      title: '¿Cancelar esta inscripción?',
      text: `Se cancelará la inscripción de ${obtenerNombreAtleta(inscripcion)} a "${inscripcion.titulo}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: COLORS.burgundy,
      cancelButtonColor: COLORS.purple,
      confirmButtonText: 'Sí, cancelar inscripción',
      cancelButtonText: 'No, mantenerla',
    });
    if (!result.isConfirmed) return;

    try {
      await eventosAPI.cancelarInscripcionClub(inscripcion.id);
      Swal.fire({ icon: 'success', title: 'Inscripción cancelada', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
      if (vista === 'detalle') setVista('lista');
      await cargarDatos();
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al cancelar la inscripción.';
      Swal.fire({ icon: 'error', title: 'No se pudo cancelar', text: mensaje, confirmButtonColor: COLORS.burgundy });
    }
  };

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
            IVD · Panel de Club
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            {vista === 'lista' ? 'Mis Convocatorias' : 'Detalle de la Inscripción'}
          </Typography>
          {vista === 'lista' && (
            <Button
              onClick={() => navigate('/club/convocatoria')}
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
            <Box sx={{ mt: -6, mb: 4, bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.14)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
                <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><ListAltIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{inscripcionesActivas.length}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Inscripciones totales</Typography>
              </Box>
              <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
                <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><GroupsIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{atletasDistintos}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Atletas distintos</Typography>
              </Box>
              <Box sx={{ p: 2.5, textAlign: 'center' }}>
                <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{totalFuturas}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Eventos próximos</Typography>
              </Box>
            </Box>

            {mensajeError && <Alert severity="info" sx={{ mb: 3 }}>{mensajeError}</Alert>}

            {inscripcionesActivas.length === 0 ? (
              <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', textAlign: 'center', py: 6 }}>
                <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}><InscritoIcon sx={{ fontSize: 32, color: COLORS.purple }} /></Avatar>
                <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>Sin inscripciones registradas</Typography>
                <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5, mb: 3 }}>
                  Explora las convocatorias disponibles e inscribe a tus atletas.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/club/convocatoria')}
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
                      {['Atleta', 'Evento', 'Disciplina', 'Categoría', 'Bib', 'Fecha', 'Estado', 'Acciones'].map((h) => (
                        <TableCell key={h} sx={estilosCabeceraTabla}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inscripcionesPaginadas.map((insc) => (
                      <TableRow key={insc.id} hover>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{obtenerNombreAtleta(insc)}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{insc.titulo}</Typography>
                          <Typography variant="caption" sx={{ color: COLORS.purple }}>{insc.lugar}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{insc.disciplina}</TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Chip label={insc.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, color: COLORS.purple }} />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Chip
                            label={insc.bib ? String(insc.bib).padStart(3, '0') : '—'}
                            size="small"
                            sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 800, fontFamily: 'monospace' }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{formatearFechaCorta(insc.fecha)}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Chip
                            icon={<CheckIcon sx={{ fontSize: 16 }} />}
                            label={insc.validado ? 'Validado' : 'Inscrito'}
                            size="small"
                            sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Box sx={{ display: 'flex', gap: .5, flexWrap: 'wrap' }}>
                            <Button size="small" onClick={() => manejarVerDetalles(insc)} endIcon={<VisibilityIcon />} sx={{ color: COLORS.burgundy, fontWeight: 700, textTransform: 'none' }}>
                              Ver detalles
                            </Button>
                            {esFuturo(insc) && (
                              <Button size="small" onClick={() => manejarCancelarInscripcion(insc)} startIcon={<CancelIcon fontSize="small" />} sx={{ color: '#A13A3A', fontWeight: 700, textTransform: 'none' }}>
                                Cancelar
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {inscripcionesActivas.length > registrosPorPagina && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <Pagination count={Math.ceil(inscripcionesActivas.length / registrosPorPagina)} page={pagina} onChange={(e, v) => setPagina(v)} />
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : (
          /* Vista de detalle de una inscripción */
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 3, alignItems: 'flex-start', mt: { xs: -4, md: -5 } }}>
            {/* Columna izquierda: imagen y datos del evento */}
            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', p: { xs: 2.5, md: 3 }, boxShadow: '0 2px 12px rgba(128,0,32,0.07)', position: { md: 'sticky' }, top: { md: 24 } }}>
              {inscripcionSeleccionada?.imagen_url && (
                <Box component="img" src={inscripcionSeleccionada.imagen_url} alt={inscripcionSeleccionada.titulo}
                  sx={{ width: '100%', height: { xs: 220, md: 260 }, objectFit: 'cover', borderRadius: '8px', mb: 2.5 }} />
              )}
              <Chip
                icon={<CheckIcon sx={{ fontSize: 16, color: `${COLORS.burgundy} !important` }} />}
                label={inscripcionSeleccionada?.validado ? 'Validado' : 'Inscrito'}
                size="small"
                sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaLarga(inscripcionSeleccionada?.fecha)}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <TimeIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Hora</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{inscripcionSeleccionada?.hora || '—'}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <LocationIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{inscripcionSeleccionada?.lugar}</Typography>
                </Box>
                {inscripcionSeleccionada?.descripcion && (
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ mt: .3, lineHeight: 1.6, color: COLORS.ink, wordBreak: 'break-word' }}>
                      {inscripcionSeleccionada.descripcion}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Columna derecha: datos de la inscripción y acciones */}
            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', p: { xs: 3, md: 5 }, boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.burgundy, mb: 1 }}>{inscripcionSeleccionada?.titulo}</Typography>
                  <Typography variant="subtitle1" sx={{ color: COLORS.purple }}>{obtenerNombreAtleta(inscripcionSeleccionada)}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 3, mb: 4 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Disciplina</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{inscripcionSeleccionada?.disciplina}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría y Género</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{inscripcionSeleccionada?.categoria} ({textoGenero(inscripcionSeleccionada?.genero)})</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Cierre de Inscripciones</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaLarga(inscripcionSeleccionada?.fecha_cierre)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Número de corredor</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.burgundy, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                    {inscripcionSeleccionada?.bib ? String(inscripcionSeleccionada.bib).padStart(3, '0') : 'No disponible'}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha de inscripción</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaCorta(inscripcionSeleccionada?.fecha_inscripcion)}</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => manejarDescargarDocumentoOficial(inscripcionSeleccionada)}
                  sx={{ borderColor: COLORS.burgundy, color: COLORS.burgundy, fontWeight: 700, textTransform: 'none' }}
                >
                  Descargar Documento Oficial
                </Button>
                {esFuturo(inscripcionSeleccionada) && (
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => manejarCancelarInscripcion(inscripcionSeleccionada)}
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

export default MisConvocatoriasClub;