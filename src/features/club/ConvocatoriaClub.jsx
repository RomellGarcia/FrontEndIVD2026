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

// Formatea fecha en formato largo
const formatearFechaLarga = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

// Formatea fecha en formato corto
const formatearFechaCorta = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Obtiene el nombre completo de un atleta
const nombreCompletoAtleta = (atleta) =>
  [atleta.nombre, atleta.apellido_paterno, atleta.apellido_materno].filter(Boolean).join(' ');

const ConvocatoriaClub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [idClub, setIdClub] = useState(null);
  const [convocatoriasDisponibles, setConvocatoriasDisponibles] = useState([]);
  const [atletasDelClub, setAtletasDelClub] = useState([]);
  const [inscripcionesDelClub, setInscripcionesDelClub] = useState([]);

  const [filtroEvento, setFiltroEvento] = useState(searchParams.get('eventoId') || '');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroEdad, setFiltroEdad] = useState('');
  const [pagina, setPagina] = useState(1);
  const registrosPorPagina = 8;

  const [modalInscripcionAbierto, setModalInscripcionAbierto] = useState(false);
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState(null);
  const [atletaSeleccionadoId, setAtletaSeleccionadoId] = useState('');
  const [inscribiendo, setInscribiendo] = useState(false);

  const [modalInscritosAbierto, setModalInscritosAbierto] = useState(false);
  const [convocatoriaParaInscritos, setConvocatoriaParaInscritos] = useState(null);

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    cargarDatos();
  }, [user, navigate]);

  // Carga los datos necesarios: club, convocatorias, atletas e inscripciones
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      const clubRes = await clubesAPI.getAll();
      let clubes = clubRes.data.clubes || clubRes.data || [];
      if (!Array.isArray(clubes)) clubes = [clubes];
      const club = clubes.find((c) => c.email === user.email);
      if (!club) {
        setError('No se encontró un club asociado a este usuario.');
        setCargando(false);
        return;
      }
      const idClubObtenido = club.id || club._id;
      setIdClub(idClubObtenido);

      const [convRes, atletasRes, inscRes] = await Promise.all([
        eventosAPI.getConvocatoriasAbiertas(),
        atletasAPI.getAll({ club_id: idClubObtenido }),
        eventosAPI.getMisInscripcionesClub(),
      ]);

      setConvocatoriasDisponibles(convRes.data.convocatorias || convRes.data || []);

      let atletas = atletasRes.data.atletas || atletasRes.data || [];
      if (!Array.isArray(atletas)) atletas = [];
      setAtletasDelClub(atletas);

      setInscripcionesDelClub(inscRes.data.inscripciones || inscRes.data || []);
    } catch (err) {
      console.error('Error al cargar convocatorias:', err);
      setError('Error al cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  // Verifica si la convocatoria aún acepta inscripciones
  const inscripcionAbierta = (convocatoria) => {
    if (!convocatoria.fecha_cierre) return true;
    return new Date(convocatoria.fecha_cierre) > new Date();
  };

  // Filtra los atletas del club que pueden inscribirse a una convocatoria
  const atletasElegibles = (convocatoria) => {
    if (!convocatoria) return [];
    const yaInscritosEnEsta = inscripcionesDelClub
      .filter((i) => String(i.convocatoria_id) === String(convocatoria.convocatoria_id))
      .map((i) => String(i.atleta_id));

    return atletasDelClub.filter((atleta) => {
      if (yaInscritosEnEsta.includes(String(atleta.id))) return false;
      const edadOk = atleta.edad != null && convocatoria.edad_min != null && convocatoria.edad_max != null
        ? atleta.edad >= convocatoria.edad_min && atleta.edad <= convocatoria.edad_max
        : true;
      const generoConv = (convocatoria.genero || '').toLowerCase();
      const generoAtleta = (atleta.genero || '').toLowerCase();
      const generoOk = !generoConv || generoConv === 'mixto' || generoConv === generoAtleta;
      return edadOk && generoOk;
    });
  };

  // Cantidad de atletas del club inscritos en una convocatoria
  const inscritosEnConvocatoria = (convocatoria) =>
    inscripcionesDelClub.filter((i) => String(i.convocatoria_id) === String(convocatoria.convocatoria_id)).length;

  // Lista de inscripciones de una convocatoria
  const listaInscritosEnConvocatoria = (convocatoria) =>
    inscripcionesDelClub.filter((i) => String(i.convocatoria_id) === String(convocatoria?.convocatoria_id));

  // Abre el modal para ver los atletas ya inscritos
  const abrirModalInscritos = (convocatoria) => {
    setConvocatoriaParaInscritos(convocatoria);
    setModalInscritosAbierto(true);
  };

  const cerrarModalInscritos = () => {
    setModalInscritosAbierto(false);
    setConvocatoriaParaInscritos(null);
  };

  // Opciones de filtro
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

  // Abre el modal para inscribir un atleta
  const abrirModalInscripcion = (convocatoria) => {
    setConvocatoriaSeleccionada(convocatoria);
    setAtletaSeleccionadoId('');
    setModalInscripcionAbierto(true);
  };

  const cerrarModalInscripcion = () => {
    setModalInscripcionAbierto(false);
    setConvocatoriaSeleccionada(null);
    setAtletaSeleccionadoId('');
  };

  // Confirma la inscripción de un atleta
  const confirmarInscripcion = async () => {
    if (!atletaSeleccionadoId || !convocatoriaSeleccionada) return;
    setInscribiendo(true);
    try {
      await eventosAPI.inscribirClub({
        atleta_id: Number(atletaSeleccionadoId),
        convocatoria_id: Number(convocatoriaSeleccionada.convocatoria_id),
      });
      cerrarModalInscripcion();
      Swal.fire({
        icon: 'success',
        title: 'Atleta inscrito',
        confirmButtonColor: COLORS.burgundy,
        timer: 2000,
        showConfirmButton: false,
      });
      await cargarDatos();
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al inscribir al atleta.';
      Swal.fire({ icon: 'error', title: 'Error', text: mensaje, confirmButtonColor: COLORS.burgundy });
    } finally {
      setInscribiendo(false);
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
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel de Club
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Convocatorias Disponibles
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5, mb: 2 }}>
            Inscribe a los atletas de tu club en las convocatorias vigentes
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {/* Tarjeta de estadísticas (flotante) */}
        <Box
          sx={{
            mt: -6,
            mb: 4,
            bgcolor: COLORS.paper,
            borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
              <ListAltIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>
              {convocatoriasDisponibles.length}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Convocatorias</Typography>
          </Box>
          <Box sx={{ p: 2.5, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
              <EventIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>{totalAbiertas}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Abiertas</Typography>
          </Box>
          <Box sx={{ p: 2.5, textAlign: 'center' }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
              <GroupsIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.6rem' }}>
              {inscripcionesDelClub.length}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>Inscripciones de tu club</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Filtros */}
        <Box
          sx={{
            bgcolor: COLORS.paper,
            borderRadius: '10px',
            boxShadow: '0 2px 12px rgba(128,0,32,0.07)',
            p: 2.5,
            mb: 3,
          }}
        >
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              color: COLORS.burgundy,
              fontWeight: 800,
              mb: 1.5,
            }}
          >
            <FilterIcon fontSize="small" /> Filtrar convocatorias
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr auto' },
              gap: 1.5,
              alignItems: 'end',
            }}
          >
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
                  <MenuItem key={id} value={id}>
                    {titulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Disciplina</InputLabel>
              <Select
                label="Disciplina"
                value={filtroDisciplina}
                onChange={(e) => setFiltroDisciplina(e.target.value)}
              >
                <MenuItem value="">Todas las disciplinas</MenuItem>
                {disciplinasUnicas.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Género</InputLabel>
              <Select
                label="Género"
                value={filtroGenero}
                onChange={(e) => setFiltroGenero(e.target.value)}
              >
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
              placeholder="15"
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

        {/* Tabla de convocatorias */}
        {convocatoriasFiltradas.length === 0 ? (
          <Box
            sx={{
              bgcolor: COLORS.paper,
              borderRadius: '10px',
              textAlign: 'center',
              py: 6,
            }}
          >
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <EventIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
              {hayFiltrosActivos
                ? 'Ninguna convocatoria coincide con el filtro'
                : 'No hay convocatorias abiertas'}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: COLORS.paper,
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(128,0,32,0.07)',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                  {['Evento', 'Disciplina', 'Categoría', 'Género', 'Fecha', 'De tu club', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={estilosCabeceraTabla}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {convocatoriasPaginadas.map((convocatoria) => {
                  const elegibles = atletasElegibles(convocatoria);
                  return (
                    <TableRow key={convocatoria.convocatoria_id} hover>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                          {convocatoria.titulo}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: 0.4 }}
                        >
                          <LocationIcon sx={{ fontSize: 12 }} /> {convocatoria.lugar}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>
                        {convocatoria.disciplina}
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Chip
                          label={convocatoria.categoria}
                          size="small"
                          sx={{
                            border: `1px solid ${COLORS.purple}`,
                            bgcolor: 'transparent',
                            color: COLORS.purple,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Chip
                          label={textoGenero(convocatoria.genero)}
                          size="small"
                          sx={{
                            border: `1px solid ${COLORS.line}`,
                            bgcolor: 'transparent',
                            color: COLORS.ink,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>
                        {formatearFechaCorta(convocatoria.fecha)}
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        {inscritosEnConvocatoria(convocatoria) > 0 ? (
                          <IconButton
                            size="small"
                            onClick={() => abrirModalInscritos(convocatoria)}
                            sx={{ color: COLORS.burgundy }}
                            title="Ver quiénes están inscritos"
                          >
                            <GroupsIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <Typography variant="caption" sx={{ color: COLORS.purple }}>
                            Ninguno aún
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PersonAddIcon />}
                          onClick={() => abrirModalInscripcion(convocatoria)}
                          disabled={!inscripcionAbierta(convocatoria)}
                          sx={{
                            bgcolor: COLORS.burgundy,
                            '&:hover': { bgcolor: COLORS.burgundyDark },
                            textTransform: 'none',
                            fontWeight: 700,
                          }}
                        >
                          Inscribir atleta
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {convocatoriasFiltradas.length > registrosPorPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination
                  count={Math.ceil(convocatoriasFiltradas.length / registrosPorPagina)}
                  page={pagina}
                  onChange={(e, v) => setPagina(v)}
                />
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Modal para inscribir atleta */}
      <Dialog open={modalInscripcionAbierto} onClose={cerrarModalInscripcion} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Inscribir atleta</Typography>
            <IconButton onClick={cerrarModalInscripcion} size="small" sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: COLORS.ink }}>
            Convocatoria: <strong style={{ color: COLORS.burgundy }}>{convocatoriaSeleccionada?.titulo}</strong>
            {' — '}
            {convocatoriaSeleccionada?.disciplina} ({convocatoriaSeleccionada?.categoria},{' '}
            {textoGenero(convocatoriaSeleccionada?.genero)})
          </Typography>

          {convocatoriaSeleccionada && atletasElegibles(convocatoriaSeleccionada).length === 0 ? (
            <Alert severity="info">
              Ninguno de tus atletas cumple la edad o el género requeridos para esta convocatoria, o ya están inscritos.
            </Alert>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Atleta</InputLabel>
              <Select
                label="Atleta"
                value={atletaSeleccionadoId}
                onChange={(e) => setAtletaSeleccionadoId(e.target.value)}
              >
                {convocatoriaSeleccionada &&
                  atletasElegibles(convocatoriaSeleccionada).map((atleta) => (
                    <MenuItem key={atleta.id} value={atleta.id}>
                      {nombreCompletoAtleta(atleta)} — {atleta.edad} años, {textoGenero(atleta.genero)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarModalInscripcion} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!atletaSeleccionadoId || inscribiendo}
            onClick={confirmarInscripcion}
            startIcon={<RegisterIcon />}
            sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark } }}
          >
            {inscribiendo ? 'Inscribiendo...' : 'Confirmar inscripción'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver inscritos del club en una convocatoria */}
      <Dialog open={modalInscritosAbierto} onClose={cerrarModalInscritos} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Atletas de tu club inscritos</Typography>
              {convocatoriaParaInscritos && (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {convocatoriaParaInscritos.disciplina} — {convocatoriaParaInscritos.categoria},{' '}
                  {textoGenero(convocatoriaParaInscritos.genero)}
                </Typography>
              )}
            </Box>
            <IconButton onClick={cerrarModalInscritos} size="small" sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {listaInscritosEnConvocatoria(convocatoriaParaInscritos).length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: COLORS.purple }}>
              Ninguno de tus atletas está inscrito todavía.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.lineSoft }}>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>Atleta</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>Fecha de inscripción</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listaInscritosEnConvocatoria(convocatoriaParaInscritos).map((inscripcion) => (
                  <TableRow key={inscripcion.id}>
                    <TableCell>
                      {[inscripcion.nombre, inscripcion.apellido_paterno, inscripcion.apellido_materno]
                        .filter(Boolean)
                        .join(' ')}
                    </TableCell>
                    <TableCell>{formatearFechaCorta(inscripcion.fecha_inscripcion)}</TableCell>
                    <TableCell>
                      <Chip
                        label={inscripcion.validado ? 'Validado' : 'Pendiente'}
                        size="small"
                        sx={{
                          bgcolor: 'transparent',
                          border: `1px solid ${
                            inscripcion.validado ? COLORS.purple : COLORS.line
                          }`,
                          color: inscripcion.validado ? COLORS.purple : COLORS.ink,
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarModalInscritos} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConvocatoriaClub;