import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Button,
  Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem,
  TextField, Chip, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Avatar
} from '@mui/material';
import {
  Download as DownloadIcon, FilterList as FilterIcon,
  Visibility as VisibilityIcon, TrendingUp as TrendingUpIcon, People as PeopleIcon,
  EmojiEvents as TrophyIcon, Group as GroupIcon
} from '@mui/icons-material';
import { resultadosAPI, eventosAPI, atletasAPI, clubesAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import * as XLSX from 'xlsx';

// --- Paleta institucional IVD (misma que las páginas principales) ---
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)',
  lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = {
  bgcolor: COLORS.paper,
  borderRadius: '10px',
  boxShadow: '0 2px 12px rgba(128,0,32,0.07)',
};

const tableHeadSx = {
  fontWeight: 700,
  color: '#fff',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  py: 2,
};

const nombreCompleto = (obj, prefijo = '') => {
  if (!obj) return 'N/A';
  const n = obj[`${prefijo}nombre`];
  const ap = obj[`${prefijo}apellido_paterno`] || obj[`${prefijo}apellido`];
  const am = obj[`${prefijo}apellido_materno`];
  return [n, ap, am].filter(Boolean).join(' ') || 'N/A';
};

const Reportes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resultados, setResultados] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [filtros, setFiltros] = useState({
    evento_id: '',
    categoria: '',
    club: '',
    ano_competitivo: '',
    genero: ''
  });
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);
  const [error, setError] = useState('');

  const categorias = [
    'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18',
    'Sub-20', 'Sub-23', 'Mayor', 'Máster'
  ];

  useEffect(() => {
    if (user) cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [resultadosRes, eventosRes, clubesRes] = await Promise.all([
        resultadosAPI.getAll({ limit: 1000 }),
        eventosAPI.getAll(),
        clubesAPI.getAll(),
      ]);

      setResultados(resultadosRes.data.resultados || resultadosRes.data || []);
      setEventos(eventosRes.data.eventos || eventosRes.data || []);
      setClubes(clubesRes.data.clubes || clubesRes.data || []);

      try {
        const estadisticasRes = await resultadosAPI.getEstadisticasGenerales();
        setEstadisticas(estadisticasRes.data || {});
      } catch (statsError) {
        console.error('Error al cargar estadísticas:', statsError);
        setEstadisticas({});
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos para los reportes');
      setResultados([]); setEventos([]); setClubes([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultadosFiltrados = [...resultados];

    if (filtros.evento_id) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.evento_id === filtros.evento_id);
    }
    if (filtros.categoria) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.categoria === filtros.categoria);
    }
    if (filtros.club) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.club_nombre === filtros.club);
    }
    if (filtros.ano_competitivo) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.ano_competitivo === parseInt(filtros.ano_competitivo));
    }
    if (filtros.genero) {
      resultadosFiltrados = resultadosFiltrados.filter(r => r.genero === filtros.genero);
    }

    return resultadosFiltrados;
  };

  const exportarExcel = () => {
    const resultadosFiltrados = aplicarFiltros();

    if (resultadosFiltrados.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const datosExcel = resultadosFiltrados.map(resultado => ({
      'CURP': resultado.curp || 'N/A',
      'NOMBRE ATLETA': nombreCompleto(resultado),
      'GÉNERO': resultado.genero || 'N/A',
      'CATEGORIA': resultado.categoria || 'N/A',
      'MUNICIPIO': resultado.municipio || 'N/A',
      'CLUB': resultado.club_nombre || 'Independiente',
      'AÑO COMPETITIVO': resultado.ano_competitivo || 'N/A',
      'PRUEBA 1': resultado.pruebas?.[0]?.nombre || 'N/A',
      'MARCA 1': resultado.pruebas?.[0]?.marca ? `${resultado.pruebas[0].marca} ${resultado.pruebas[0].unidad}` : 'N/A',
      'PRUEBA 2': resultado.pruebas?.[1]?.nombre || 'N/A',
      'MARCA 2': resultado.pruebas?.[1]?.marca ? `${resultado.pruebas[1].marca} ${resultado.pruebas[1].unidad}` : 'N/A',
      'PRUEBA 3': resultado.pruebas?.[2]?.nombre || 'N/A',
      'MARCA 3': resultado.pruebas?.[2]?.marca ? `${resultado.pruebas[2].marca} ${resultado.pruebas[2].unidad}` : 'N/A',
      'PRUEBA 4': resultado.pruebas?.[3]?.nombre || 'N/A',
      'MARCA 4': resultado.pruebas?.[3]?.marca ? `${resultado.pruebas[3].marca} ${resultado.pruebas[3].unidad}` : 'N/A',
      'NOMBRE ENTRENADOR': resultado.entrenador_nombre ? `${resultado.entrenador_nombre} ${resultado.entrenador_apellido || ''}`.trim() : 'Independiente',
      'LUGAR DE ENTRENAMIENTO': resultado.lugar_entrenamiento || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

    const nombreArchivo = `Reporte_Resultados_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  const handleVerDetalles = (resultado) => {
    setResultadoSeleccionado(resultado);
    setModalDetallesOpen(true);
  };

  const limpiarFiltros = () => {
    setFiltros({ evento_id: '', categoria: '', club: '', ano_competitivo: '', genero: '' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  const resultadosFiltrados = aplicarFiltros();

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>

      {/* ── Franja de bienvenida ── */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="xl" sx={{ textAlign: 'center', px: { xs: 2, md: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel Administrativo
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Reportes y Análisis de Resultados
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 }, pb: { xs: 5, md: 7 } }}>

        {/* ── Stat-strip flotante ── */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 4,
            bgcolor: '#fff', borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: estadisticas.total_resultados || 0, label: 'Total de Resultados', accent: COLORS.burgundy },
            { icon: <PeopleIcon sx={{ fontSize: 24 }} />, value: estadisticas.total_atletas || 0, label: 'Atletas Participantes', accent: COLORS.purple },
            { icon: <GroupIcon sx={{ fontSize: 24 }} />, value: estadisticas.total_clubes || 0, label: 'Clubes Representados', accent: COLORS.burgundy },
            { icon: <TrendingUpIcon sx={{ fontSize: 24 }} />, value: estadisticas.total_eventos || 0, label: 'Eventos Registrados', accent: COLORS.purple },
          ].map((s, i) => (
            <Box key={i} sx={{
              p: { xs: 2, md: 2.75 }, textAlign: 'center',
              borderRight: { sm: i < 3 ? `1px solid ${COLORS.line}` : 'none' },
              borderBottom: { xs: i < 2 ? `1px solid ${COLORS.line}` : 'none', sm: 'none' },
            }}>
              <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.68rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError('')}>{error}</Alert>
        )}

        {/* ── Filtros ── */}
        <Box sx={{ ...cardSx, p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon /> Filtros de Búsqueda
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, alignItems: 'end' }}>
            <FormControl fullWidth size="small">
              <InputLabel>Evento</InputLabel>
              <Select
                value={filtros.evento_id}
                onChange={(e) => setFiltros(prev => ({ ...prev, evento_id: e.target.value }))}
                label="Evento"
              >
                <MenuItem value="">Todos los eventos</MenuItem>
                {eventos.map((evento) => (
                  <MenuItem key={evento.id} value={evento.id}>{evento.titulo}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filtros.categoria}
                onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                label="Categoría"
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Club</InputLabel>
              <Select
                value={filtros.club}
                onChange={(e) => setFiltros(prev => ({ ...prev, club: e.target.value }))}
                label="Club"
              >
                <MenuItem value="">Todos los clubes</MenuItem>
                {clubes.map((club) => (
                  <MenuItem key={club.id} value={club.nombre}>{club.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Año Competitivo"
              type="number"
              value={filtros.ano_competitivo}
              onChange={(e) => setFiltros(prev => ({ ...prev, ano_competitivo: e.target.value }))}
              inputProps={{ min: 2020, max: 2030 }}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Género</InputLabel>
              <Select
                value={filtros.genero}
                onChange={(e) => setFiltros(prev => ({ ...prev, genero: e.target.value }))}
                label="Género"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="masculino">Masculino</MenuItem>
                <MenuItem value="femenino">Femenino</MenuItem>
                <MenuItem value="mixto">Mixto</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={limpiarFiltros} size="small" sx={{ color: COLORS.purple, borderColor: COLORS.purple }}>
              Limpiar filtros
            </Button>
          </Box>
        </Box>

        {/* ── Encabezado de resultados + exportar ── */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800 }}>
            Resultados Filtrados ({resultadosFiltrados.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportarExcel}
            disabled={resultadosFiltrados.length === 0}
            sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, fontWeight: 700, textTransform: 'none' }}
          >
            Exportar a Excel
          </Button>
        </Box>

        {/* ── Tabla de resultados ── */}
        {resultadosFiltrados.length === 0 ? (
          <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
              No hay resultados que coincidan con los filtros aplicados
            </Typography>
          </Box>
        ) : (
          <Box sx={{ ...cardSx, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                    <TableCell sx={tableHeadSx}>Evento</TableCell>
                    <TableCell sx={tableHeadSx}>Atleta</TableCell>
                    <TableCell sx={tableHeadSx}>Categoría</TableCell>
                    <TableCell sx={tableHeadSx}>Club</TableCell>
                    <TableCell sx={tableHeadSx}>Año</TableCell>
                    <TableCell sx={tableHeadSx}>Pruebas</TableCell>
                    <TableCell sx={tableHeadSx} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultadosFiltrados.map((resultado) => (
                    <TableRow key={resultado.id} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>
                          {resultado.evento_titulo || 'Evento no encontrado'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{nombreCompleto(resultado)}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Chip
                          label={resultado.categoria || 'N/A'}
                          size="small"
                          sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{resultado.club_nombre || 'Independiente'}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{resultado.ano_competitivo}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {resultado.pruebas?.map((prueba, index) => (
                            <Chip
                              key={index}
                              label={`${prueba.nombre}: ${prueba.marca} ${prueba.unidad}`}
                              size="small"
                              sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }} align="center">
                        <IconButton size="small" onClick={() => handleVerDetalles(resultado)} title="Ver detalles" sx={{ color: COLORS.burgundy }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Container>

      {/* ── Modal de detalles ── */}
      <Dialog open={modalDetallesOpen} onClose={() => setModalDetallesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Detalles del Resultado</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {resultadoSeleccionado && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Evento</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.evento_titulo}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Atleta</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{nombreCompleto(resultadoSeleccionado)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.categoria || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Club</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.club_nombre || 'Independiente'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Entrenador</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>
                  {resultadoSeleccionado.entrenador_nombre
                    ? `${resultadoSeleccionado.entrenador_nombre} ${resultadoSeleccionado.entrenador_apellido || ''}`.trim()
                    : 'Independiente'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar de Entrenamiento</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.lugar_entrenamiento || 'No especificado'}</Typography>
              </Box>

              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5 }}>
                  Pruebas y Marcas
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {resultadoSeleccionado.pruebas?.map((prueba, index) => (
                    <Box key={index} sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.purple }}>
                        Prueba {index + 1}: {prueba.nombre}
                      </Typography>
                      <Typography variant="body1" sx={{ color: COLORS.ink }}>Marca: {prueba.marca} {prueba.unidad}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalDetallesOpen(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reportes;