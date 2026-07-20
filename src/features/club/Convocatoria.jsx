import React, { useState, useEffect } from 'react';
import { eventosAPI, clubesAPI, atletasAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, Alert, CircularProgress, Chip, Avatar, Divider, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import {
  Event as EventIcon, ListAlt as ListAltIcon, LocationOn as LocationIcon,
  HowToReg as RegisterIcon, Close as CloseIcon, FilterList as FilterIcon,
  Clear as ClearIcon, Groups as GroupsIcon, CheckCircle as CheckIcon,
  PersonAdd as PersonAddIcon,
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

const textoGenero = (genero) => {
  const g = (genero || '').toLowerCase();
  if (g === 'masculino') return 'Masculino';
  if (g === 'femenino') return 'Femenino';
  if (g === 'mixto') return 'Mixto';
  return genero || 'N/A';
};

const Convocatoria = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clubId, setClubId] = useState(null);
  const [convocatorias, setConvocatorias] = useState([]);
  const [atletasClub, setAtletasClub] = useState([]);
  const [inscripcionesClub, setInscripcionesClub] = useState([]);

  const [filtroEvento, setFiltroEvento] = useState(searchParams.get('eventoId') || '');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroEdad, setFiltroEdad] = useState('');
  const [page, setPage] = useState(1);
  const porPagina = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState(null);
  const [atletaElegido, setAtletaElegido] = useState('');
  const [inscribiendo, setInscribiendo] = useState(false);

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    cargarTodo();
  }, [user, navigate]);

  const cargarTodo = async () => {
    try {
      setLoading(true); setError('');

      const clubRes = await clubesAPI.getAll();
      let clubes = clubRes.data.clubes || clubRes.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const club = clubes.find((c) => c.email === user.email);
      if (!club) { setError('No se encontró un club asociado a este usuario.'); setLoading(false); return; }
      const idClub = club.id || club._id;
      setClubId(idClub);

      const [convRes, atletasRes, inscRes] = await Promise.all([
        eventosAPI.getConvocatoriasAbiertas(),
        atletasAPI.getAll({ club_id: idClub }),
        eventosAPI.getMisInscripcionesClub(),
      ]);

      setConvocatorias(convRes.data.convocatorias || convRes.data || []);

      let atletas = atletasRes.data.atletas || atletasRes.data || [];
      if (!Array.isArray(atletas)) atletas = [];
      setAtletasClub(atletas);

      setInscripcionesClub(inscRes.data.inscripciones || inscRes.data || []);
    } catch (err) {
      console.error('Error al cargar convocatorias:', err);
      setError('Error al cargar los datos.');
    } finally { setLoading(false); }
  };

  const fmt = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const fmtCorta = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const nombreAtleta = (a) => [a.nombre, a.apellido_paterno, a.apellido_materno].filter(Boolean).join(' ');

  // Un atleta es elegible para una convocatoria si su edad cae en el rango
  // y su género coincide (o la convocatoria es mixta).
  const atletasElegibles = (conv) => {
    if (!conv) return [];
    const yaInscritosEnEsta = inscripcionesClub
      .filter((i) => String(i.convocatoria_id) === String(conv.convocatoria_id))
      .map((i) => String(i.atleta_id));

    return atletasClub.filter((a) => {
      if (yaInscritosEnEsta.includes(String(a.id))) return false;
      const edadOk = a.edad != null && conv.edad_min != null && conv.edad_max != null
        ? a.edad >= conv.edad_min && a.edad <= conv.edad_max
        : true;
      const generoConv = (conv.genero || '').toLowerCase();
      const generoAtleta = (a.genero || '').toLowerCase();
      const generoOk = !generoConv || generoConv === 'mixto' || generoConv === generoAtleta;
      return edadOk && generoOk;
    });
  };

  const inscritosEnConv = (conv) =>
    inscripcionesClub.filter((i) => String(i.convocatoria_id) === String(conv.convocatoria_id)).length;

  const inscripcionAbierta = (conv) => {
    if (!conv.fecha_cierre) return true;
    return new Date(conv.fecha_cierre) > new Date();
  };

  // Opciones de filtro derivadas de los datos ya cargados
  const eventosUnicos = Array.from(new Map(convocatorias.map((c) => [String(c.evento_id), c.titulo])).entries());
  const disciplinasUnicas = Array.from(new Set(convocatorias.map((c) => c.disciplina).filter(Boolean))).sort();

  const convocatoriasFiltradas = convocatorias.filter((conv) => {
    if (filtroEvento && String(conv.evento_id) !== String(filtroEvento)) return false;
    if (filtroDisciplina && conv.disciplina !== filtroDisciplina) return false;
    if (filtroGenero && (conv.genero || '').toLowerCase() !== filtroGenero) return false;
    if (filtroEdad) {
      const edadNum = parseInt(filtroEdad, 10);
      if (!isNaN(edadNum) && conv.edad_min != null && conv.edad_max != null && (edadNum < conv.edad_min || edadNum > conv.edad_max)) return false;
    }
    return true;
  });

  const hayFiltrosActivos = !!(filtroEvento || filtroDisciplina || filtroGenero || filtroEdad);
  const limpiarFiltros = () => { setFiltroEvento(''); setFiltroDisciplina(''); setFiltroGenero(''); setFiltroEdad(''); setSearchParams({}); };

  useEffect(() => { setPage(1); }, [filtroEvento, filtroDisciplina, filtroGenero, filtroEdad]);

  const convocatoriasPaginadas = convocatoriasFiltradas.slice((page - 1) * porPagina, page * porPagina);
  const totalAbiertas = convocatorias.filter(inscripcionAbierta).length;

  const handleAbrirModal = (conv) => {
    setConvocatoriaSeleccionada(conv);
    setAtletaElegido('');
    setModalOpen(true);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    setConvocatoriaSeleccionada(null);
    setAtletaElegido('');
  };

  const handleConfirmarInscripcion = async () => {
    if (!atletaElegido || !convocatoriaSeleccionada) return;
    setInscribiendo(true);
    try {
      await eventosAPI.inscribirClub({
        atleta_id: Number(atletaElegido),
        convocatoria_id: Number(convocatoriaSeleccionada.convocatoria_id),
      });
      handleCerrarModal();
      Swal.fire({
        icon: 'success', title: 'Atleta inscrito', confirmButtonColor: COLORS.burgundy,
        timer: 2000, showConfirmButton: false,
      });
      await cargarTodo();
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al inscribir al atleta.';
      Swal.fire({ icon: 'error', title: 'Error', text: mensaje, confirmButtonColor: COLORS.burgundy });
    } finally { setInscribiendo(false); }
  };

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
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Club
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Convocatorias Disponibles
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5, mb: 2 }}>
            Inscribe a los atletas de tu club en las convocatorias vigentes
          </Typography>
          <Button
            onClick={() => navigate('/club/mis-convocatorias')}
            startIcon={<CheckIcon />}
            variant="outlined"
            size="small"
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', textTransform: 'none', fontWeight: 700 }}
          >
            Ver inscripciones de mi club
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>

        {/* ── Stat-strip ── */}
        <Box sx={{ mt: -6, mb: 4, bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.14)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><ListAltIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{convocatorias.length}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Convocatorias</Typography>
          </Box>
          <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{totalAbiertas}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Abiertas</Typography>
          </Box>
          <Box sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><GroupsIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{inscripcionesClub.length}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Inscripciones de tu club</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* ── Filtros ── */}
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
              fullWidth size="small" type="number" label="Edad dirigida" placeholder="Ej. 15"
              value={filtroEdad} onChange={(e) => setFiltroEdad(e.target.value)} inputProps={{ min: 0, max: 100 }}
            />
            <Button onClick={limpiarFiltros} disabled={!hayFiltrosActivos} startIcon={<ClearIcon fontSize="small" />}
              sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700, height: 40 }}>
              Limpiar
            </Button>
          </Box>
        </Box>

        {/* ── Tabla ── */}
        {convocatoriasFiltradas.length === 0 ? (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}><EventIcon sx={{ fontSize: 32, color: COLORS.purple }} /></Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
              {hayFiltrosActivos ? 'Ninguna convocatoria coincide con el filtro' : 'No hay convocatorias abiertas'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                  {['Evento', 'Disciplina', 'Categoría', 'Género', 'Fecha', 'De tu club', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={tableHeadSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {convocatoriasPaginadas.map((conv) => {
                  const elegibles = atletasElegibles(conv);
                  return (
                    <TableRow key={conv.convocatoria_id} hover>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{conv.titulo}</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: .4 }}>
                          <LocationIcon sx={{ fontSize: 12 }} /> {conv.lugar}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{conv.disciplina}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Chip label={conv.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, bgcolor: 'transparent', color: COLORS.purple }} />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Chip label={textoGenero(conv.genero)} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{fmtCorta(conv.fecha)}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        {inscritosEnConv(conv) > 0 ? (
                          <Chip label={inscritosEnConv(conv)} size="small" sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }} />
                        ) : (
                          <Typography variant="caption" sx={{ color: COLORS.purple }}>Ninguno aún</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Button
                          size="small" variant="contained" startIcon={<PersonAddIcon />}
                          onClick={() => handleAbrirModal(conv)}
                          disabled={!inscripcionAbierta(conv)}
                          sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                        >
                          Inscribir atleta
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {convocatoriasFiltradas.length > porPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination count={Math.ceil(convocatoriasFiltradas.length / porPagina)} page={page} onChange={(e, v) => setPage(v)} />
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* ── Modal: elegir atleta a inscribir ── */}
      <Dialog open={modalOpen} onClose={handleCerrarModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Inscribir atleta</Typography>
            <IconButton onClick={handleCerrarModal} size="small" sx={{ color: '#fff' }}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: COLORS.ink }}>
            Convocatoria: <strong style={{ color: COLORS.burgundy }}>{convocatoriaSeleccionada?.titulo}</strong>
            {' — '}{convocatoriaSeleccionada?.disciplina} ({convocatoriaSeleccionada?.categoria}, {textoGenero(convocatoriaSeleccionada?.genero)})
          </Typography>

          {convocatoriaSeleccionada && atletasElegibles(convocatoriaSeleccionada).length === 0 ? (
            <Alert severity="info">
              Ninguno de tus atletas cumple la edad o el género requeridos para esta convocatoria, o ya están inscritos.
            </Alert>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Atleta</InputLabel>
              <Select label="Atleta" value={atletaElegido} onChange={(e) => setAtletaElegido(e.target.value)}>
                {convocatoriaSeleccionada && atletasElegibles(convocatoriaSeleccionada).map((a) => (
                  <MenuItem key={a.id} value={a.id}>{nombreAtleta(a)} — {a.edad} años, {textoGenero(a.genero)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCerrarModal} sx={{ color: COLORS.purple, fontWeight: 600 }}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!atletaElegido || inscribiendo}
            onClick={handleConfirmarInscripcion}
            startIcon={<RegisterIcon />}
            sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
          >
            {inscribiendo ? 'Inscribiendo...' : 'Confirmar inscripción'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Convocatoria;