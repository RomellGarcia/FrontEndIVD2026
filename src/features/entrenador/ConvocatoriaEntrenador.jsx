import React, { useState, useEffect } from 'react';
import { eventosAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, Alert, CircularProgress, Chip, Avatar, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import {
  Event as EventIcon, ListAlt as ListAltIcon, LocationOn as LocationIcon,
  Visibility as VisibilityIcon, Close as CloseIcon, FilterList as FilterIcon,
  Clear as ClearIcon, CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020', purple: '#7A4069',
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

const formatearFechaLarga = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

const formatearFechaCorta = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ConvocatoriaEntrenador = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [convocatoriasDisponibles, setConvocatoriasDisponibles] = useState([]);

  const [filtroEvento, setFiltroEvento] = useState(searchParams.get('eventoId') || '');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroEdad, setFiltroEdad] = useState('');
  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 8;

  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [convocatoriaDetalle, setConvocatoriaDetalle] = useState(null);

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    cargarDatos();
  }, [user, navigate]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const convRes = await eventosAPI.getConvocatoriasAbiertas();
      setConvocatoriasDisponibles(convRes.data.convocatorias || convRes.data || []);
    } catch (err) {
      console.error('Error al cargar convocatorias:', err);
      setError('Error al cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  const inscripcionAbierta = (convocatoria) => {
    if (!convocatoria.fecha_cierre) return true;
    return new Date(convocatoria.fecha_cierre) > new Date();
  };

  const eventosUnicos = Array.from(
    new Map(convocatoriasDisponibles.map((c) => [String(c.evento_id), c.titulo])).entries()
  );
  const disciplinasUnicas = Array.from(
    new Set(convocatoriasDisponibles.map((c) => c.disciplina).filter(Boolean))
  ).sort();

  const convocatoriasFiltradas = convocatoriasDisponibles.filter((convocatoria) => {
    if (filtroEvento && String(convocatoria.evento_id) !== String(filtroEvento)) return false;
    if (filtroDisciplina && convocatoria.disciplina !== filtroDisciplina) return false;
    if (filtroGenero && (convocatoria.genero || '').toLowerCase() !== filtroGenero) return false;
    if (filtroEdad) {
      const edadNum = parseInt(filtroEdad, 10);
      if (
        !isNaN(edadNum) &&
        convocatoria.edad_min != null &&
        convocatoria.edad_max != null &&
        (edadNum < convocatoria.edad_min || edadNum > convocatoria.edad_max)
      )
        return false;
    }
    return true;
  });

  const hayFiltrosActivos = !!(filtroEvento || filtroDisciplina || filtroGenero || filtroEdad);

  const limpiarFiltros = () => {
    setFiltroEvento('');
    setFiltroDisciplina('');
    setFiltroGenero('');
    setFiltroEdad('');
    setSearchParams({});
  };

  useEffect(() => {
    setPagina(1);
  }, [filtroEvento, filtroDisciplina, filtroGenero, filtroEdad]);

  const convocatoriasPaginadas = convocatoriasFiltradas.slice(
    (pagina - 1) * registrosPorPagina,
    pagina * registrosPorPagina
  );
  const totalAbiertas = convocatoriasDisponibles.filter(inscripcionAbierta).length;

  const abrirModalDetalle = (convocatoria) => {
    setConvocatoriaDetalle(convocatoria);
    setModalDetalleAbierto(true);
  };

  const cerrarModalDetalle = () => {
    setModalDetalleAbierto(false);
    setConvocatoriaDetalle(null);
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
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Entrenador
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Convocatorias
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5, mb: 2 }}>
            Consulta el detalle de las convocatorias vigentes
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: { xs: 3, md: 4 }, bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px #00000024', display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', overflow: 'hidden',
          }}
        >
          <Box sx={{ p: { xs: 1.5, md: 2.5 }, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
              <ListAltIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: { xs: '1.2rem', md: '1.6rem' } }}>
              {convocatoriasDisponibles.length}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Convocatorias</Typography>
          </Box>
          <Box sx={{ p: { xs: 1.5, md: 2.5 }, textAlign: 'center' }}>
            <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
              <EventIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: { xs: '1.2rem', md: '1.6rem' } }}>{totalAbiertas}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Abiertas</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px #80002012', p: 2.5, mb: 3 }}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: COLORS.burgundy, fontWeight: 800, mb: 1.5 }}>
            <FilterIcon fontSize="small" /> Filtrar convocatorias
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr auto' }, gap: 1.5, alignItems: 'end' }}>
            <FormControl fullWidth size="small">
              <InputLabel>Evento</InputLabel>
              <Select
                label="Evento"
                value={filtroEvento}
                onChange={(e) => {
                  setFiltroEvento(e.target.value);
                  setSearchParams(e.target.value ? { eventoId: e.target.value } : {});
                }}
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
              fullWidth size="small" type="number" label="Edad dirigida" placeholder="15"
              value={filtroEdad} onChange={(e) => setFiltroEdad(e.target.value)} inputProps={{ min: 0, max: 100 }}
            />
            <Button
              onClick={limpiarFiltros} disabled={!hayFiltrosActivos}
              startIcon={<ClearIcon fontSize="small" />}
              sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700, height: 40 }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

        {convocatoriasFiltradas.length === 0 ? (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <EventIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
              {hayFiltrosActivos ? 'Ninguna convocatoria coincide con el filtro' : 'No hay convocatorias abiertas'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px #80002012' }}>
            <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                  {['Evento', 'Disciplina', 'Categoría', 'Género', 'Fecha', 'Estado', 'Detalle'].map((h) => (
                    <TableCell key={h} sx={{ ...estilosCabeceraTabla, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {convocatoriasPaginadas.map((convocatoria) => (
                  <TableRow key={convocatoria.convocatoria_id} hover>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap' }}>{convocatoria.titulo}</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <LocationIcon sx={{ fontSize: 12 }} /> {convocatoria.lugar}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink, whiteSpace: 'nowrap' }}>{convocatoria.disciplina}</TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip label={convocatoria.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, bgcolor: 'transparent', color: COLORS.purple }} />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip label={textoGenero(convocatoria.genero)} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink, whiteSpace: 'nowrap' }}>{formatearFechaCorta(convocatoria.fecha)}</TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Chip
                        label={inscripcionAbierta(convocatoria) ? 'Abierta' : 'Cerrada'}
                        size="small"
                        sx={{ bgcolor: inscripcionAbierta(convocatoria) ? COLORS.burgundy : COLORS.lineSoft, color: inscripcionAbierta(convocatoria) ? '#fff' : COLORS.ink, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: COLORS.line }}>
                      <Button
                        size="small" variant="outlined" startIcon={<VisibilityIcon fontSize="small" />}
                        onClick={() => abrirModalDetalle(convocatoria)}
                        sx={{ borderColor: COLORS.purple, color: COLORS.purple, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundy, color: COLORS.burgundy, bgcolor: 'transparent' } }}
                      >
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
            {convocatoriasFiltradas.length > registrosPorPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={Math.ceil(convocatoriasFiltradas.length / registrosPorPagina)} page={pagina} onChange={(e, v) => setPagina(v)} />
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Modal de detalle de la convocatoria (solo lectura) */}
      <Dialog open={modalDetalleAbierto} onClose={cerrarModalDetalle} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Detalle de la convocatoria</Typography>
            <IconButton onClick={cerrarModalDetalle} size="small" sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          {convocatoriaDetalle && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Evento</Typography>
                <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{convocatoriaDetalle.titulo}</Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Disciplina</Typography>
                  <Typography sx={{ color: COLORS.ink }}>{convocatoriaDetalle.disciplina}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría</Typography>
                  <Typography sx={{ color: COLORS.ink }}>{convocatoriaDetalle.categoria}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Género</Typography>
                  <Typography sx={{ color: COLORS.ink }}>{textoGenero(convocatoriaDetalle.genero)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Edad dirigida</Typography>
                  <Typography sx={{ color: COLORS.ink }}>
                    {convocatoriaDetalle.edad_min != null && convocatoriaDetalle.edad_max != null
                      ? `${convocatoriaDetalle.edad_min} - ${convocatoriaDetalle.edad_max} años`
                      : 'Sin restricción'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon sx={{ fontSize: 18, color: COLORS.burgundy }} />
                <Typography sx={{ color: COLORS.ink }}>{convocatoriaDetalle.lugar}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: 18, color: COLORS.burgundy }} />
                <Typography sx={{ color: COLORS.ink }}>
                  Fecha del evento: {formatearFechaLarga(convocatoriaDetalle.fecha)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={inscripcionAbierta(convocatoriaDetalle) ? 'Abierta' : 'Cerrada'}
                  size="small"
                  sx={{ bgcolor: inscripcionAbierta(convocatoriaDetalle) ? COLORS.burgundy : COLORS.lineSoft, color: inscripcionAbierta(convocatoriaDetalle) ? '#fff' : COLORS.ink, fontWeight: 700 }}
                />
                {convocatoriaDetalle.fecha_cierre && (
                  <Typography variant="caption" sx={{ color: COLORS.purple }}>
                    Cierre de inscripciones: {formatearFechaLarga(convocatoriaDetalle.fecha_cierre)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarModalDetalle} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConvocatoriaEntrenador;