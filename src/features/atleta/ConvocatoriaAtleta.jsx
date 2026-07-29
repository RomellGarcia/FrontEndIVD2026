import React, { useState, useEffect } from 'react';
import { eventosAPI, perfilEmpresaAPI, notificacionesAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, IconButton, Alert, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider, Pagination,
  Checkbox, FormControlLabel, FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import {
  Download as DownloadIcon, Close as CloseIcon, Event as EventIcon,
  LocationOn as LocationIcon, SportsScore as SportsIcon, Person as PersonIcon,
  CheckCircle as CheckIcon, HowToReg as RegisterIcon, ListAlt as ListAltIcon,
  Visibility as VisibilityIcon, ArrowBack as ArrowBackIcon, Warning as WarningIcon,
  FilterList as FilterIcon, Clear as ClearIcon, NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
};

const tableHeadSx = { fontWeight: 700, color: '#fff', fontSize: '0.72rem', textTransform: 'uppercase', py: 2 };

// Los PDF los abre el navegador solo; Word/Excel pasan por el visor
// público de Google Docs (mismo patrón que en Eventos y Mis Convocatorias).
const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

const ConvocatoriasAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [convocatorias, setConvocatorias] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');

  const [filtroEvento, setFiltroEvento] = useState(searchParams.get('eventoId') || '');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroEdad, setFiltroEdad] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');

  const [inscribiendo, setInscribiendo] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [aceptaRiesgos, setAceptaRiesgos] = useState(false);

  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState(null);
  const [vista, setVista] = useState('lista');

  const [yaInscritos, setYaInscritos] = useState([]);
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
      // Si falla marcar como leída, no pasa nada grave: se volverá a
      // mostrar la próxima vez, que es un fallo tolerable.
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true); setErrorMessage('');
      const edad = calcularEdad(user.fecha_nacimiento);
      const genero = (user.genero || '').toLowerCase();

      if (!edad || !genero) {
        setErrorMessage('Verifica que tu fecha de nacimiento y género estén registrados en tu perfil.');
        setConvocatorias([]); return;
      }

      const [convRes, logoRes, inscRes] = await Promise.allSettled([
        eventosAPI.getMisConvocatorias(),
        perfilEmpresaAPI.get(),
        eventosAPI.getMisInscripciones(),
      ]);

      if (inscRes.status === 'fulfilled') {
        const inscripciones = inscRes.value.data.inscripciones || inscRes.value.data || [];
        const ids = inscripciones
          .map(i => i.convocatoria_id ?? i.convocatoriaId ?? i.eventoId ?? i.id ?? i._id)
          .filter((v) => v !== undefined && v !== null)
          .map(String);
        setYaInscritos(ids);
      }

      if (convRes.status === 'fulfilled') {
        const data = convRes.value.data.convocatorias || [];
        setConvocatorias(data);
        if (data.length === 0) {
          setErrorMessage(`No hay convocatorias disponibles para tu edad (${edad} años).`);
        }
      }

      if (logoRes.status === 'fulfilled') setLogoUrl(logoRes.value.data.perfil?.logo || '');

    } catch {
      setErrorMessage('Error al cargar los datos.');
    } finally { setLoading(false); }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date(), nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const fmt = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const fmtCorta = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const inscripcionAbierta = (conv) => {
    if (!conv.fecha_cierre && !conv.fechaCierre) return true;
    return new Date(conv.fecha_cierre || conv.fechaCierre) > new Date();
  };

  const getConvId = (conv) => String(conv?.convocatoria_id ?? conv?._id ?? conv?.id ?? '');

  const puedeInscribirse = (conv) => {
    if (!conv) return false;
    const generoConv = (conv.genero || '').toLowerCase();
    const generoAtleta = (user?.genero || '').toLowerCase();
    if (!generoConv || generoConv === 'mixto') return true;
    return generoConv === generoAtleta;
  };

  const textoGenero = (genero) => {
    const g = (genero || '').toLowerCase();
    if (g === 'masculino') return 'Masculino';
    if (g === 'femenino') return 'Femenino';
    if (g === 'mixto') return 'Mixto';
    return genero || 'N/A';
  };

  const estaInscrito = (conv) => {
    const id = getConvId(conv);
    return !!id && yaInscritos.includes(id);
  };

  const convocatoriasDisponibles = convocatorias.filter(conv => !estaInscrito(conv));

  const eventosUnicos = Array.from(
    new Map(
      convocatoriasDisponibles
        .filter((c) => c.evento_id || c.eventoId)
        .map((c) => [String(c.evento_id ?? c.eventoId), c.titulo])
    ).entries()
  );
  const disciplinasUnicas = Array.from(new Set(convocatoriasDisponibles.map((c) => c.disciplina).filter(Boolean))).sort();

  const convocatoriasFiltradas = convocatoriasDisponibles.filter((conv) => {
    if (filtroEvento && String(conv.evento_id ?? conv.eventoId ?? '') !== String(filtroEvento)) return false;
    if (filtroDisciplina && conv.disciplina !== filtroDisciplina) return false;
    if (filtroGenero && (conv.genero || '').toLowerCase() !== filtroGenero) return false;
    if (filtroEdad) {
      const edadNum = parseInt(filtroEdad, 10);
      const min = conv.edadMin ?? conv.edad_min;
      const max = conv.edadMax ?? conv.edad_max;
      if (!isNaN(edadNum) && min != null && max != null && (edadNum < min || edadNum > max)) return false;
    }
    return true;
  });

  const hayFiltrosActivos = !!(filtroEvento || filtroDisciplina || filtroGenero || filtroEdad);
  const limpiarFiltros = () => {
    setFiltroEvento(''); setFiltroDisciplina(''); setFiltroGenero(''); setFiltroEdad('');
    setSearchParams({});
  };

  const totalAbiertas = convocatoriasDisponibles.filter(inscripcionAbierta).length;

  const handleVerDetalles = (conv) => {
    setConvocatoriaSeleccionada(conv);
    setVista('detalle');
  };

  const handleAbrirInscripcion = (conv) => {
    if (!user.nombre || !user.curp) {
      Swal.fire({ icon: 'warning', title: 'Perfil incompleto', text: 'Completa tu perfil antes de inscribirte.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    if (!puedeInscribirse(conv)) {
      Swal.fire({ icon: 'warning', title: 'No disponible', text: `Esta convocatoria es solo para ${textoGenero(conv.genero).toLowerCase()}.`, confirmButtonColor: COLORS.burgundy });
      return;
    }
    setConvocatoriaSeleccionada(conv);
    setAceptaRiesgos(false);
    setModalOpen(true);
  };

  const handleConfirmarInscripcion = async () => {
    if (!aceptaRiesgos || !convocatoriaSeleccionada) return;
    setInscribiendo(true);
    const idConv = getConvId(convocatoriaSeleccionada);
    try {
      const response = await eventosAPI.inscribir({ convocatoria_id: Number(idConv) });
      const bib = response.data?.inscripcion?.bib;

      setYaInscritos((prev) => (prev.includes(idConv) ? prev : [...prev, idConv]));
      setModalOpen(false);
      setVista('lista');
      Swal.fire({
        icon: 'success',
        title: 'Inscripción exitosa',
        text: bib
          ? `Tu número de corredor es ${String(bib).padStart(3, '0')}. Puedes consultarlo en "Mis Convocatorias".`
          : 'Puedes consultarla en "Mis Convocatorias".',
        confirmButtonColor: COLORS.burgundy,
      });
      cargarDatos();
    } catch (error) {
      const mensaje = error.response?.data?.error || error.response?.data?.mensaje || '';
      const yaEstabaInscrito = error.response?.status === 409 || /ya\s+(te\s+encuentras|est[aá]s|te\s+has)\s+inscrit/i.test(mensaje);

      if (yaEstabaInscrito) {
        setYaInscritos((prev) => (prev.includes(idConv) ? prev : [...prev, idConv]));
        setModalOpen(false);
        setVista('lista');
        Swal.fire({
          icon: 'info',
          title: 'Ya estabas inscrito',
          text: 'Este evento ya aparece en "Mis Convocatorias".',
          confirmButtonColor: COLORS.burgundy,
        });
        cargarDatos();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: mensaje || 'Error al inscribirse.', confirmButtonColor: COLORS.burgundy });
      }
    } finally { setInscribiendo(false); }
  };

  const descargarDocumentoOficial = (conv) => {
    if (!conv.documentoConvocatoria) {
      Swal.fire({ icon: 'info', title: 'Sin documento', text: 'Este evento no tiene un documento oficial subido todavía.', confirmButtonColor: COLORS.burgundy });
      return;
    }
    abrirDocumentoParaVer(conv.documentoConvocatoria);
  };

  const convocatoriasPaginadas = convocatoriasFiltradas.slice((page - 1) * porPagina, page * porPagina);

  useEffect(() => { setPage(1); }, [filtroEvento, filtroDisciplina, filtroGenero, filtroEdad]);

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
            <Box sx={{ textAlign: 'left', mb: 1 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setVista('lista')}
                sx={{ color: '#fff', textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Volver a la lista
              </Button>
            </Box>
          )}
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Atleta
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            {vista === 'lista' ? 'Convocatorias Disponibles' : 'Detalles de Convocatoria'}
          </Typography>

           <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
             Consulta las convocatorias que hay disponibles para tu edad y género, filtra por evento, disciplina o categoría, y regístrate en las que te interesen.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>

        {vista === 'lista' ? (
          <>
            <Box sx={{ mt: -6, mb: 4, bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.14)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
                <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><ListAltIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.7rem' }}>{convocatoriasDisponibles.length}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Disponibles</Typography>
              </Box>
              <Box sx={{ p: 2.5, textAlign: 'center' }}>
                <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.7rem' }}>{totalAbiertas}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Abiertas</Typography>
              </Box>
            </Box>

            {errorMessage && <Alert severity="error" sx={{ mb: 3 }}>{errorMessage}</Alert>}

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

            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)', p: 2.5, mb: 3 }}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: .75, color: COLORS.burgundy, fontWeight: 800, mb: 1.5 }}>
                <FilterIcon fontSize="small" /> Filtrar convocatorias
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr auto' }, gap: 1.5, alignItems: 'end' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Evento</InputLabel>
                  <Select
                    label="Evento"
                    value={filtroEvento}
                    onChange={(e) => { setFiltroEvento(e.target.value); setSearchParams(e.target.value ? { eventoId: e.target.value } : {}); }}
                  >
                    <MenuItem value="">Todos los eventos</MenuItem>
                    {eventosUnicos.map(([id, titulo]) => (
                      <MenuItem key={id} value={id}>{titulo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Disciplina</InputLabel>
                  <Select label="Disciplina" value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)}>
                    <MenuItem value="">Todas las disciplinas</MenuItem>
                    {disciplinasUnicas.map((d) => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Género</InputLabel>
                  <Select label="Género" value={filtroGenero} onChange={(e) => setFiltroGenero(e.target.value)}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="masculino">Masculino</MenuItem>
                    <MenuItem value="femenino">Femenino</MenuItem>
                    <MenuItem value="mixto">Mixto</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Edad dirigida"
                  placeholder="Ej. 15"
                  value={filtroEdad}
                  onChange={(e) => setFiltroEdad(e.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                />

                <Button
                  onClick={limpiarFiltros}
                  disabled={!hayFiltrosActivos}
                  startIcon={<ClearIcon fontSize="small" />}
                  sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700, height: 40 }}
                >
                  Limpiar
                </Button>
              </Box>
            </Box>

            {convocatoriasFiltradas.length === 0 ? (
              <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', textAlign: 'center', py: 6 }}>
                <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}><EventIcon sx={{ fontSize: 32, color: COLORS.purple }} /></Avatar>
                <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
                  {hayFiltrosActivos ? 'Ninguna convocatoria coincide con el filtro' : 'Sin convocatorias nuevas'}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5 }}>
                  {hayFiltrosActivos
                    ? 'Prueba con otro evento, disciplina o edad.'
                    : 'Ya estás inscrito en todas las disponibles o no hay eventos actuales para ti.'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                      {['Evento', 'Disciplina', 'Categoría', 'Género', 'Fecha', 'Estado', 'Acciones'].map((h) => (
                        <TableCell key={h} sx={tableHeadSx}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {convocatoriasPaginadas.map((conv) => (
                      <TableRow key={conv.id || conv.convocatoria_id} hover>
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
                            label={textoGenero(conv.genero)}
                            size="small"
                            sx={{
                              border: `1px solid ${puedeInscribirse(conv) ? COLORS.purple : COLORS.line}`,
                              bgcolor: 'transparent',
                              color: puedeInscribirse(conv) ? COLORS.purple : COLORS.ink,
                              opacity: puedeInscribirse(conv) ? 1 : 0.7,
                            }}
                          />
                          {!puedeInscribirse(conv) && (
                            <Typography variant="caption" sx={{ display: 'block', color: COLORS.ink, opacity: 0.6, mt: 0.3 }}>
                              No disponible para ti
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{fmtCorta(conv.fecha)}</Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                           <Chip label={inscripcionAbierta(conv) ? 'Abierta' : 'Cerrada'} size="small"
                                 sx={{ border: `1px solid ${inscripcionAbierta(conv) ? COLORS.purple : COLORS.line}`, bgcolor: 'transparent', color: inscripcionAbierta(conv) ? COLORS.purple : COLORS.ink }} />
                        </TableCell>
                        <TableCell sx={{ borderColor: COLORS.line }}>
                          <Button size="small" onClick={() => handleVerDetalles(conv)} endIcon={<VisibilityIcon />} sx={{ color: COLORS.burgundy, fontWeight: 700, textTransform: 'none' }}>
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {convocatoriasFiltradas.length > porPagina && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <Pagination count={Math.ceil(convocatoriasFiltradas.length / porPagina)} page={page} onChange={(e, v) => setPage(v)} />
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : (
          <Box>
            <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', mt: -6, p: { xs: 3, md: 5 }, boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.burgundy, mb: 1 }}>{convocatoriaSeleccionada?.titulo}</Typography>
              <Typography variant="subtitle1" sx={{ color: COLORS.purple, mb: 4 }}>Información Oficial de la Convocatoria</Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
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

                {estaInscrito(convocatoriaSeleccionada) ? (
                  <Chip
                    icon={<CheckIcon />}
                    label="Ya estás inscrito en este evento"
                    sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700, px: 1, py: 2.2 }}
                  />
                ) : !puedeInscribirse(convocatoriaSeleccionada) ? (
                  <Chip
                    icon={<WarningIcon />}
                    label={`Convocatoria solo para ${textoGenero(convocatoriaSeleccionada?.genero)}`}
                    sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontWeight: 700, px: 1, py: 2.2 }}
                  />
                ) : inscripcionAbierta(convocatoriaSeleccionada) && (
                  <Button
                    variant="contained"
                    startIcon={<RegisterIcon />}
                    onClick={() => handleAbrirInscripcion(convocatoriaSeleccionada)}
                    sx={{ bgcolor: COLORS.burgundy, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: COLORS.burgundyDark } }}
                  >
                    Inscribirme a esta Convocatoria
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Container>

      {/* ── Confirmar Inscripción y Aceptar Riesgos ── */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          Confirmar Inscripción
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
            Estás a punto de inscribirte al evento: <span style={{ color: COLORS.burgundy }}>{convocatoriaSeleccionada?.titulo}</span>
          </Typography>

          <Box sx={{ p: 2, bgcolor: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#E65100', mb: 1 }}>
              <WarningIcon fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Documento de Riesgos y Responsabilidades</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#E65100', mb: 2 }}>
              Es obligatorio leer el documento de riesgos proporcionado por el administrador antes de confirmar tu participación.
            </Typography>

            {convocatoriaSeleccionada?.documentoDeslinde && (
              <Box sx={{ mb: 2 }}>
                <Button
                  onClick={() => abrirDocumentoParaVer(convocatoriaSeleccionada.documentoDeslinde)}
                  variant="contained"
                  size="small"
                  sx={{ bgcolor: '#E65100', color: '#fff', textTransform: 'none', '&:hover': { bgcolor: '#BF360C' } }}
                >
                  Ver Documento de Riesgos
                </Button>
              </Box>
            )}

            <FormControlLabel
              sx={{ display: 'flex', alignItems: 'flex-start', ml: 0 }}
              control={
                <Checkbox
                  checked={aceptaRiesgos}
                  onChange={(e) => setAceptaRiesgos(e.target.checked)}
                  sx={{ color: '#E65100', '&.Mui-checked': { color: '#E65100' } }}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#E65100', mt: 1 }}>He leído y acepto los riesgos del evento.</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined" sx={{ color: COLORS.purple, borderColor: COLORS.purple, fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmarInscripcion}
            variant="contained"
            disabled={!aceptaRiesgos || inscribiendo}
            sx={{ bgcolor: COLORS.burgundy, fontWeight: 700, '&:hover': { bgcolor: COLORS.burgundyDark } }}
          >
            {inscribiendo ? 'Procesando...' : 'Confirmar Inscripción'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConvocatoriasAtleta;