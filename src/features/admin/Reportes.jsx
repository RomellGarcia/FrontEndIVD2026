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
  EmojiEvents as TrophyIcon, Group as GroupIcon, MilitaryTech as MedalIcon,
} from '@mui/icons-material';
import { resultadosAPI, atletasAPI, clubesAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import * as XLSX from 'xlsx';

// Paleta de colores institucional
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

const estilosCabeceraTabla = {
  fontWeight: 700,
  color: '#fff',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  py: 2,
};

// Obtiene el nombre completo de una persona a partir de un objeto
const obtenerNombreCompleto = (obj, prefijo = '') => {
  if (!obj) return 'N/A';
  const n = obj[`${prefijo}nombre`];
  const ap = obj[`${prefijo}apellido_paterno`] || obj[`${prefijo}apellido`];
  const am = obj[`${prefijo}apellido_materno`];
  return [n, ap, am].filter(Boolean).join(' ') || 'N/A';
};

// Chip que muestra la posición con colores según medalla
const ChipPosicion = ({ posicion }) => {
  if (!posicion) return <Typography variant="body2" sx={{ color: COLORS.purple }}>—</Typography>;
  const estilos = {
    1: { bgcolor: '#B8860B', color: '#fff' },
    2: { bgcolor: '#8a8a8a', color: '#fff' },
    3: { bgcolor: '#A15C2E', color: '#fff' },
  };
  const sx = estilos[posicion] || { bgcolor: COLORS.lineSoft, color: COLORS.ink };
  return <Chip label={`${posicion}°`} size="small" sx={{ ...sx, fontWeight: 800, minWidth: 42 }} />;
};

// Disciplinas de campo (salto/lanzamiento): gana la marca MÁS ALTA.
// El resto (carreras, vallas, marcha, relevos) es por tiempo: gana la MÁS BAJA.
const DISCIPLINAS_DISTANCIA = new Set([
  'Salto de longitud', 'Salto de altura',
  'Lanzamiento de bala', 'Lanzamiento de disco', 'Lanzamiento de jabalina',
]);
const esDisciplinaDeDistancia = (disciplina) => DISCIPLINAS_DISTANCIA.has((disciplina || '').trim());

// Convierte un tiempo en formato "01:02:17,45" o "62:17,45" a centésimas
const tiempoACentesimas = (str) => {
  if (!str) return null;
  const limpio = String(str).trim().replace(',', '.');
  const partes = limpio.split(':').map((p) => parseFloat(p));
  if (partes.some((p) => Number.isNaN(p))) return null;
  let segundos = 0;
  if (partes.length === 3) segundos = partes[0] * 3600 + partes[1] * 60 + partes[2];
  else if (partes.length === 2) segundos = partes[0] * 60 + partes[1];
  else if (partes.length === 1) segundos = partes[0];
  else return null;
  return Math.round(segundos * 100);
};

// Convierte una marca de distancia (ej. "6,45 m") a número
const marcaANumero = (str) => {
  if (!str) return null;
  const num = parseFloat(String(str).trim().replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isNaN(num) ? null : num;
};

// Extrae de un resultado el valor comparable (según disciplina de distancia o tiempo)
const obtenerValorComparable = (resultado) => {
  const esDistancia = esDisciplinaDeDistancia(resultado.disciplina);
  const prueba = esDistancia
    ? resultado.pruebas?.find((p) => p.nombre === 'Marca')
    : resultado.pruebas?.find((p) => p.nombre === 'ChipTime') || resultado.pruebas?.find((p) => p.nombre === 'GunTime');
  const valor = prueba ? (esDistancia ? marcaANumero(prueba.marca) : tiempoACentesimas(prueba.marca)) : null;
  const texto = prueba ? `${prueba.marca}${prueba.unidad ? ' ' + prueba.unidad : ''}`.trim() : null;
  return { valor, esDistancia, texto };
};

const Reportes = () => {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [resultados, setResultados] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [filtros, setFiltros] = useState({
    categoria: '',
    club: '',
    ano_competitivo: '',
    genero: ''
  });
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);
  const [comboSeleccionado, setComboSeleccionado] = useState(null);
  const [error, setError] = useState('');

  const categorias = [
    'Sub-8', 'Sub-10', 'Sub-12', 'Sub-14', 'Sub-16', 'Sub-18',
    'Sub-20', 'Sub-23', 'Mayor', 'Máster'
  ];

  useEffect(() => {
    if (user) cargarDatos();
  }, [user]);

  // Carga todos los datos necesarios: resultados, clubes y estadísticas
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resultadosRes, clubesRes] = await Promise.all([
        resultadosAPI.getAll({ limit: 1000 }),
        clubesAPI.getAll(),
      ]);

      setResultados(resultadosRes.data.resultados || resultadosRes.data || []);
      setClubes(clubesRes.data.clubes || clubesRes.data || []);

      try {
        const estadisticasRes = await resultadosAPI.getEstadisticasGenerales();
        setEstadisticas(estadisticasRes.data?.estadisticas || estadisticasRes.data || {});
      } catch (statsError) {
        console.error('Error al cargar estadísticas:', statsError);
        setEstadisticas({});
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos para los reportes');
      setResultados([]);
      setClubes([]);
    } finally {
      setCargando(false);
    }
  };

  // Aplica los filtros seleccionados a la lista de resultados
  const aplicarFiltros = () => {
    let resultadosFiltrados = [...resultados];

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

  // Exporta los resultados filtrados a un archivo Excel
  const exportarExcel = () => {
    const resultadosFiltrados = aplicarFiltros();

    if (resultadosFiltrados.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const datosExcel = resultadosFiltrados.map(resultado => ({
      'CURP': resultado.curp || 'N/A',
      'NOMBRE ATLETA': obtenerNombreCompleto(resultado),
      'GÉNERO': resultado.genero || 'N/A',
      'CATEGORIA': resultado.categoria || 'N/A',
      'LUGAR': resultado.posicion ? `${resultado.posicion}°` : 'N/A',
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

  // Abre el modal con los detalles de un resultado
  const manejarVerDetalles = (resultado) => {
    setResultadoSeleccionado(resultado);
    setModalDetallesAbierto(true);
  };

  // Limpia todos los filtros
  const limpiarFiltros = () => {
    setFiltros({ categoria: '', club: '', ano_competitivo: '', genero: '' });
  };

  const resultadosFiltrados = aplicarFiltros();

  // Mejor marca por disciplina+categoría+género (sobre resultados filtrados)
  const mejoresMarcasPorDisciplina = React.useMemo(() => {
    const porCombo = new Map();
    for (const r of resultadosFiltrados) {
      if (!r.disciplina) continue;
      const { valor, esDistancia, texto } = obtenerValorComparable(r);
      if (valor === null) continue;

      const clave = `${r.disciplina}|${r.categoria || '—'}|${r.genero || '—'}`;
      if (!porCombo.has(clave)) {
        porCombo.set(clave, {
          clave, disciplina: r.disciplina, categoria: r.categoria || '—', genero: r.genero || '—',
          esDistancia, atletas: [],
        });
      }
      porCombo.get(clave).atletas.push({
        atleta_id: r.atleta_id, nombre: obtenerNombreCompleto(r), club_nombre: r.club_nombre || 'Independiente',
        evento_titulo: r.evento_titulo, valor, texto,
      });
    }

    return [...porCombo.values()]
      .map((combo) => ({
        ...combo,
        atletas: combo.atletas.sort((a, b) => combo.esDistancia ? b.valor - a.valor : a.valor - b.valor),
      }))
      .sort((a, b) => a.disciplina.localeCompare(b.disciplina) || a.categoria.localeCompare(b.categoria));
  }, [resultadosFiltrados]);

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
        {/* Tarjeta de estadísticas (flotante) */}
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

        {/* Filtros */}
        <Box sx={{ ...cardSx, p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon /> Filtros de Búsqueda
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, alignItems: 'end' }}>
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

        {/* Mejor marca por disciplina */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MedalIcon /> Mejor Marca por Disciplina
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.purple, mb: 2 }}>
            El atleta con la mejor marca en cada disciplina/categoría/género, dentro de los filtros de arriba — para saber a quién convocar.
          </Typography>

          {mejoresMarcasPorDisciplina.length === 0 ? (
            <Box sx={{ ...cardSx, textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ color: COLORS.purple, fontWeight: 700 }}>
                No hay marcas registradas con los filtros actuales.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ ...cardSx, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                      <TableCell sx={estilosCabeceraTabla}>Disciplina</TableCell>
                      <TableCell sx={estilosCabeceraTabla}>Categoría</TableCell>
                      <TableCell sx={estilosCabeceraTabla}>Género</TableCell>
                      <TableCell sx={estilosCabeceraTabla}>Mejor marca</TableCell>
                      <TableCell sx={estilosCabeceraTabla}>Atleta</TableCell>
                      <TableCell sx={estilosCabeceraTabla}>Club</TableCell>
                      <TableCell sx={estilosCabeceraTabla} align="center">Candidatos</TableCell>
                      <TableCell sx={estilosCabeceraTabla} align="center">Ver más</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mejoresMarcasPorDisciplina.map((combo) => {
                      const mejor = combo.atletas[0];
                      return (
                        <TableRow key={combo.clave} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                          <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink, fontWeight: 700 }}>{combo.disciplina}</TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }}>
                            <Chip label={combo.categoria} size="small" sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }} />
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{combo.genero}</TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }}>
                            <Chip label={mejor.texto || '—'} size="small" sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink, fontWeight: 700 }}>{mejor.nombre}</TableCell>
                          <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{mejor.club_nombre}</TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }} align="center">{combo.atletas.length}</TableCell>
                          <TableCell sx={{ borderColor: COLORS.line }} align="center">
                            {combo.atletas.length > 1 && (
                              <Button size="small" onClick={() => setComboSeleccionado(combo)} sx={{ color: COLORS.burgundy, fontWeight: 700, textTransform: 'none' }}>
                                Ver top {Math.min(5, combo.atletas.length)}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>

        {/* Encabezado de resultados + exportar */}
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

        {/* Tabla de resultados */}
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
                    <TableCell sx={estilosCabeceraTabla}>Evento</TableCell>
                    <TableCell sx={estilosCabeceraTabla}>Atleta</TableCell>
                    <TableCell sx={estilosCabeceraTabla}>Categoría</TableCell>
                    <TableCell sx={estilosCabeceraTabla}>Lugar</TableCell>
                    <TableCell sx={estilosCabeceraTabla}>Club</TableCell>
                    <TableCell sx={estilosCabeceraTabla}>Año</TableCell>
                    <TableCell sx={estilosCabeceraTabla}>Pruebas</TableCell>
                    <TableCell sx={estilosCabeceraTabla} align="center">Acciones</TableCell>
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
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{obtenerNombreCompleto(resultado)}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Chip
                          label={resultado.categoria || 'N/A'}
                          size="small"
                          sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <ChipPosicion posicion={resultado.posicion} />
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
                        <IconButton size="small" onClick={() => manejarVerDetalles(resultado)} title="Ver detalles" sx={{ color: COLORS.burgundy }}>
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

      {/* Modal de detalles del resultado */}
      <Dialog open={modalDetallesAbierto} onClose={() => setModalDetallesAbierto(false)} maxWidth="md" fullWidth>
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
                <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{obtenerNombreCompleto(resultadoSeleccionado)}</Typography>
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
          <Button onClick={() => setModalDetallesAbierto(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: top candidatos de una disciplina/categoría/género */}
      <Dialog open={!!comboSeleccionado} onClose={() => setComboSeleccionado(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {comboSeleccionado?.disciplina}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {comboSeleccionado?.categoria} · {comboSeleccionado?.genero}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: COLORS.lineSoft }}>
                <TableCell sx={{ fontWeight: 700, color: COLORS.ink, width: 50 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>Atleta</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>Club</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>Marca</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comboSeleccionado?.atletas.slice(0, 5).map((a, i) => (
                <TableRow key={`${a.atleta_id}-${i}`}>
                  <TableCell sx={{ fontWeight: 700, color: i === 0 ? COLORS.burgundy : COLORS.ink }}>{i + 1}°</TableCell>
                  <TableCell sx={{ color: COLORS.ink, fontWeight: i === 0 ? 700 : 400 }}>{a.nombre}</TableCell>
                  <TableCell sx={{ color: COLORS.ink }}>{a.club_nombre}</TableCell>
                  <TableCell>
                    <Chip label={a.texto || '—'} size="small" sx={i === 0
                      ? { bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }
                      : { bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setComboSeleccionado(null)} sx={{ color: COLORS.purple, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reportes;