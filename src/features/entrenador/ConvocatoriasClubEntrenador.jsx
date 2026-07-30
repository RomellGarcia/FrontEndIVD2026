import React, { useState, useEffect } from 'react';
import { eventosAPI, entrenadorAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, Alert, CircularProgress, Chip, Avatar, Divider, Pagination,
} from '@mui/material';
import {
  Download as DownloadIcon, Event as EventIcon, HowToReg as InscritoIcon,
  ListAlt as ListAltIcon, Groups as GroupsIcon, CheckCircle as CheckIcon,
  Visibility as VisibilityIcon, ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon, AccessTime as TimeIcon, LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: '#8000202E', lineSoft: '#80002014',
};

const estilosCabeceraTabla = { fontWeight: 700, color: '#fff', fontSize: '0.72rem', textTransform: 'uppercase', py: 2 };

const textoGenero = (genero) => {
  const g = (genero || '').toLowerCase();
  if (g === 'masculino') return 'Masculino';
  if (g === 'femenino') return 'Femenino';
  if (g === 'mixto') return 'Mixto';
  return genero || 'N/A';
};

const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

const formatearFechaLarga = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

const formatearFechaCorta = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const obtenerNombreAtleta = (inscripcion) =>
  [inscripcion?.nombre, inscripcion?.apellido_paterno, inscripcion?.apellido_materno].filter(Boolean).join(' ');

const ConvocatoriasClubEntrenador = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inscripciones, setInscripciones] = useState([]);
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [sinClub, setSinClub] = useState(false);

  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState(null);
  const [vista, setVista] = useState('lista');

  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 8;

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    cargarDatos();
  }, [user, navigate]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setMensajeError('');
      setSinClub(false);

      const perfilRes = await entrenadorAPI.getPerfil();
      if (!perfilRes.data.entrenador?.club_id) {
        setSinClub(true);
        setCargando(false);
        return;
      }

      const response = await eventosAPI.getMisInscripcionesClub();
      const data = response.data.inscripciones || response.data || [];
      setInscripciones(data);
      if (data.length === 0) setMensajeError('Tu club aún no ha inscrito a ningún atleta en convocatorias.');
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
              sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: '#FFFFFF1A' } }}
            >
              Volver a convocatorias del club
            </Button>
          )}
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Entrenador
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.4rem', md: '2.125rem' } }}>
            {vista === 'lista' ? 'Convocatorias del Club' : 'Detalle de la Inscripción'}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {sinClub ? (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', mt: { xs: -5, md: -6 }, textAlign: 'center', py: 6, boxShadow: '0 2px 12px #80002012' }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <GroupsIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700, mb: 1 }}>
              Todavía no perteneces a ningún club
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.ink, opacity: 0.75, mb: 3 }}>
              Únete a un club para poder ver en qué convocatorias está inscrito.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/entrenador/buscar-clubes')}
              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
            >
              Buscar un club
            </Button>
          </Box>
        ) : vista === 'lista' ? (
          <>
            {/* Tarjeta de estadísticas */}
            <Box sx={{ mt: { xs: -5, md: -6 }, mb: { xs: 3, md: 4 }, bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 10px 28px #00000024', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden' }}>
              <Box sx={{ p: { xs: 1.5, md: 2.5 }, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
                <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><ListAltIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: { xs: '1.1rem', md: '1.6rem' } }}>{inscripcionesActivas.length}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Inscripciones totales</Typography>
              </Box>
              <Box sx={{ p: { xs: 1.5, md: 2.5 }, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
                <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><GroupsIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: { xs: '1.1rem', md: '1.6rem' } }}>{atletasDistintos}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Atletas distintos</Typography>
              </Box>
              <Box sx={{ p: { xs: 1.5, md: 2.5 }, textAlign: 'center' }}>
                <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: { xs: '1.1rem', md: '1.6rem' } }}>{totalFuturas}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Eventos próximos</Typography>
              </Box>
            </Box>

            {mensajeError && <Alert severity="info" sx={{ mb: 3 }}>{mensajeError}</Alert>}

            {inscripcionesActivas.length === 0 ? (
              <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', textAlign: 'center', py: 6 }}>
                <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}><InscritoIcon sx={{ fontSize: 32, color: COLORS.purple }} /></Avatar>
                <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>Sin inscripciones registradas</Typography>
                <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5 }}>
                  Cuando tu club inscriba atletas en convocatorias, aparecerán aquí.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px #80002012' }}>
                <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                      {['Atleta', 'Evento', 'Disciplina', 'Categoría', 'Bib', 'Fecha', 'Estado', 'Detalle'].map((h) => (
                        <TableCell key={h} sx={{ ...estilosCabeceraTabla, whiteSpace: 'nowrap' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inscripcionesPaginadas.map((insc) => (
                      <TableRow key={insc.id} hover>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap' }}>{obtenerNombreAtleta(insc)}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap' }}>{insc.titulo}</Typography>
                          <Typography variant="caption" sx={{ color: COLORS.purple }}>{insc.lugar}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink, whiteSpace: 'nowrap' }}>{insc.disciplina}</TableCell>
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
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap' }}>{formatearFechaCorta(insc.fecha)}</Typography>
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
                          <Button size="small" onClick={() => manejarVerDetalles(insc)} endIcon={<VisibilityIcon />} sx={{ color: COLORS.burgundy, fontWeight: 700, textTransform: 'none' }}>
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </Box>
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: { xs: 2, md: 3 }, alignItems: 'flex-start', mt: { xs: -4, md: -5 } }}>
            {/* Columna izquierda: imagen y datos del evento */}
            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', p: { xs: 2.5, md: 3 }, boxShadow: '0 2px 12px #80002012', position: { md: 'sticky' }, top: { md: 24 } }}>
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

            {/* Columna derecha: datos de la inscripción */}
            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', p: { xs: 3, md: 5 }, boxShadow: '0 2px 12px #80002012' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.burgundy, mb: 1 }}>{inscripcionSeleccionada?.titulo}</Typography>
                  <Typography variant="subtitle1" sx={{ color: COLORS.purple }}>{obtenerNombreAtleta(inscripcionSeleccionada)}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 3 }, mt: 3, mb: 4 }}>
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
              </Box>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ConvocatoriasClubEntrenador;