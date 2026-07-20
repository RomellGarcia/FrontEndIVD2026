import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Button,
  CircularProgress, Chip,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  IconButton, Avatar,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  EmojiEvents as TrophyIcon, Person as PersonIcon, SportsScore as SportsIcon,
  BarChart as BarChartIcon, Close as CloseIcon, FilterList as FilterIcon
} from '@mui/icons-material';
import { resultadosAPI } from "../api/index.js";
import EncabezadoPublico from "../components/layout/EncabezadoPublico.jsx";

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

const obtenerNombre = (item) => {
  if (!item) return 'N/A';
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item.nombre) return item.nombre;
  return 'N/A';
};

const nombreCompleto = (obj, prefijo = '') => {
  if (!obj) return 'N/A';
  const n = obj[`${prefijo}nombre`];
  const ap = obj[`${prefijo}apellido_paterno`] || obj[`${prefijo}apellido`];
  const am = obj[`${prefijo}apellido_materno`];
  return [n, ap, am].filter(Boolean).join(' ') || 'N/A';
};

const getDisciplinaPrincipal = (pruebas) => pruebas?.[0]?.nombre || 'Sin disciplina';

/**
 * Versión PÚBLICA de "Resultados" — solo consulta.
 * No requiere sesión y no incluye crear/editar/eliminar.
 * Integra un panel de filtros similar al de Reportes, extrayendo
 * dinámicamente las opciones de la data cargada.
 */
const ResultadosPublico = () => {
  const [loading, setLoading] = useState(true);
  const [resultados, setResultados] = useState([]);
  const [modalVerResultadoOpen, setModalVerResultadoOpen] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);

  // --- NUEVOS ESTADOS DE FILTROS ---
  const [filtros, setFiltros] = useState({
    evento: '',
    categoria: '',
    club: '',
    ano_competitivo: '',
    genero: ''
  });

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      setLoading(true);
      const response = await resultadosAPI.getAll();
      setResultados(response.data.resultados || response.data || []);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerResultado = (resultado) => {
    setResultadoSeleccionado(resultado);
    setModalVerResultadoOpen(true);
  };

  // --- EXTRACCIÓN DINÁMICA DE OPCIONES ---
  const opcionesFiltro = useMemo(() => {
    return {
      eventos: Array.from(new Set(resultados.map(r => r.evento_titulo))).filter(Boolean).sort(),
      categorias: Array.from(new Set(resultados.map(r => obtenerNombre(r.categoria)))).filter(Boolean).sort(),
      clubes: Array.from(new Set(resultados.map(r => r.club_nombre))).filter(Boolean).sort(),
      anos: Array.from(new Set(resultados.map(r => r.ano_competitivo))).filter(Boolean).sort((a, b) => b - a),
      generos: Array.from(new Set(resultados.map(r => obtenerNombre(r.genero)))).filter(Boolean).sort()
    };
  }, [resultados]);

  // --- LÓGICA DE FILTRADO ---
  const resultadosFiltrados = useMemo(() => {
    return resultados.filter((r) => {
      const matchEvento = !filtros.evento || r.evento_titulo === filtros.evento;
      const matchCategoria = !filtros.categoria || obtenerNombre(r.categoria) === filtros.categoria;
      const matchClub = !filtros.club || r.club_nombre === filtros.club;
      const matchAno = !filtros.ano_competitivo || String(r.ano_competitivo) === String(filtros.ano_competitivo);
      const matchGenero = !filtros.genero || obtenerNombre(r.genero) === filtros.genero;

      return matchEvento && matchCategoria && matchClub && matchAno && matchGenero;
    });
  }, [resultados, filtros]);

  const limpiarFiltros = () => {
    setFiltros({ evento: '', categoria: '', club: '', ano_competitivo: '', genero: '' });
  };

  const disciplinasDistintas = new Set(resultados.map(r => r.disciplina || getDisciplinaPrincipal(r.pruebas))).size;
  const atletasDistintos = new Set(resultados.map(r => r.atleta_id)).size;

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>

      {/* ── Franja de bienvenida ── */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="xl" sx={{ textAlign: 'center', px: { xs: 2, md: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Consulta Pública
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Resultados
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Marcas y resultados registrados en eventos del Instituto Veracruzano del Deporte
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
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            overflow: 'hidden',
          }}
        >
          {[
            { icon: <TrophyIcon sx={{ fontSize: 24 }} />, value: resultados.length, label: 'Resultados', accent: COLORS.burgundy },
            { icon: <PersonIcon sx={{ fontSize: 24 }} />, value: atletasDistintos, label: 'Atletas', accent: COLORS.purple },
            { icon: <SportsIcon sx={{ fontSize: 24 }} />, value: disciplinasDistintas, label: 'Disciplinas', accent: COLORS.burgundy },
          ].map((s, i) => (
            <Box key={i} sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.line}` : 'none' }}>
              <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.4rem', md: '1.7rem' } }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* ── Filtros (Estilo Reportes) ── */}
        <Box sx={{ ...cardSx, p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon /> Filtros de Búsqueda
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, alignItems: 'end' }}>
            
            <FormControl fullWidth size="small">
              <InputLabel>Evento</InputLabel>
              <Select
                value={filtros.evento}
                onChange={(e) => setFiltros(prev => ({ ...prev, evento: e.target.value }))}
                label="Evento"
              >
                <MenuItem value="">Todos los eventos</MenuItem>
                {opcionesFiltro.eventos.map((evt, idx) => (
                  <MenuItem key={idx} value={evt}>{evt}</MenuItem>
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
                <MenuItem value="">Todas</MenuItem>
                {opcionesFiltro.categorias.map((cat, idx) => (
                  <MenuItem key={idx} value={cat}>{cat}</MenuItem>
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
                {opcionesFiltro.clubes.map((club, idx) => (
                  <MenuItem key={idx} value={club}>{club}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select
                value={filtros.ano_competitivo}
                onChange={(e) => setFiltros(prev => ({ ...prev, ano_competitivo: e.target.value }))}
                label="Año"
              >
                <MenuItem value="">Todos</MenuItem>
                {opcionesFiltro.anos.map((ano, idx) => (
                  <MenuItem key={idx} value={ano}>{ano}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Género</InputLabel>
              <Select
                value={filtros.genero}
                onChange={(e) => setFiltros(prev => ({ ...prev, genero: e.target.value }))}
                label="Género"
              >
                <MenuItem value="">Todos</MenuItem>
                {opcionesFiltro.generos.map((gen, idx) => (
                  <MenuItem key={idx} value={gen}>{gen}</MenuItem>
                ))}
              </Select>
            </FormControl>

          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={limpiarFiltros} size="small" sx={{ color: COLORS.purple, borderColor: COLORS.purple }}>
              Limpiar filtros
            </Button>
          </Box>
        </Box>

        {/* ── Tabla de resultados ── */}
        {resultadosFiltrados.length === 0 ? (
          <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
              {resultados.length === 0 ? 'Aún no hay resultados registrados' : 'No se encontraron resultados'}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8 }}>
              {resultados.length === 0 ? 'Los resultados aparecerán aquí conforme se registren.' : 'Intenta con otros filtros.'}
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
                    <TableCell sx={tableHeadSx} align="center">Detalle</TableCell>
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
                          label={obtenerNombre(resultado.categoria)}
                          size="small"
                          sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.purple}`, color: COLORS.purple, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{resultado.club_nombre || 'Independiente'}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line, color: COLORS.ink }}>{resultado.ano_competitivo}</TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }} align="center">
                        <IconButton size="small" onClick={() => handleVerResultado(resultado)} title="Ver detalles" sx={{ color: COLORS.burgundy }}>
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

      {/* ── Modal ver resultado (solo lectura) ── */}
      <Dialog open={modalVerResultadoOpen} onClose={() => setModalVerResultadoOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon sx={{ color: '#fff' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Detalles del Resultado</Typography>
            </Box>
            <IconButton onClick={() => setModalVerResultadoOpen(false)} size="small" sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {resultadoSeleccionado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" /> Información del Atleta
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Nombre</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{nombreCompleto(resultadoSeleccionado)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{obtenerNombre(resultadoSeleccionado.categoria)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Género</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{obtenerNombre(resultadoSeleccionado.genero)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Municipio</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.municipio || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Club</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.club_nombre || 'Independiente'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Entrenador</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {resultadoSeleccionado.entrenador_nombre
                        ? `${resultadoSeleccionado.entrenador_nombre} ${resultadoSeleccionado.entrenador_apellido || ''}`.trim()
                        : 'Independiente'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrophyIcon fontSize="small" /> Información del Evento
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Evento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.evento_titulo}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Año Competitivo</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.ano_competitivo || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar de Entrenamiento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{resultadoSeleccionado.lugar_entrenamiento || 'No especificado'}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}` }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.burgundy, fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon fontSize="small" /> Pruebas y Marcas
                </Typography>
                {resultadoSeleccionado.pruebas?.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                    {resultadoSeleccionado.pruebas.map((prueba, index) => (
                      <Box key={index} sx={{ p: 1.5, borderRadius: '8px', border: `1px solid ${COLORS.line}`, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Prueba {index + 1}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{prueba.nombre}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.burgundy }}>{prueba.marca} {prueba.unidad}</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: COLORS.purple }}>No hay pruebas registradas</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalVerResultadoOpen(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultadosPublico;