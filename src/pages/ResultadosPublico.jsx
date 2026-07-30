import React, { useState, useEffect } from 'react';
import { eventosAPI, resultadosAPI } from '../api/index.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Box, Typography,
  Container, Button, CircularProgress, Avatar, Pagination, Chip,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon, LocationOn as LocationIcon,
  Event as EventIcon, DoneAll as DoneAllIcon,
  ArrowBack as ArrowBackIcon, EmojiEvents as TrophyIcon,
  HourglassEmpty as PendingIcon, Clear as ClearIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import EncabezadoPublico from '../components/layout/EncabezadoPublico.jsx';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020',
  burgundyDark: '#5C0017',
  purple: '#7A4069',
  cream: '#e4e4e5',
  paper: '#FFFFFF',
  ink: '#2B1E1E',
  line: '#8000202E',
  lineSoft: '#80002014',
};

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px #80002012' };

// Devuelve el texto legible para el género
const obtenerTextoGenero = (genero) => {
  const valor = (genero || '').toLowerCase();
  if (valor === 'masculino') return 'Masculino';
  if (valor === 'femenino') return 'Femenino';
  if (valor === 'mixto') return 'Mixto';
  return genero || 'N/A';
};

// Disciplinas que se miden por distancia (marca) vs tiempo
const DISCIPLINAS_DISTANCIA = new Set([
  'Salto de longitud', 'Salto de altura',
  'Lanzamiento de bala', 'Lanzamiento de disco', 'Lanzamiento de jabalina',
]);

const esDisciplinaDeDistancia = (disciplina) => DISCIPLINAS_DISTANCIA.has((disciplina || '').trim());

// Obtiene el nombre completo de un participante
const obtenerNombreCompleto = (registro) => 
  [registro?.nombre, registro?.apellido_paterno, registro?.apellido_materno].filter(Boolean).join(' ');

// Formatea fecha en formato largo
const formatearFechaLarga = (fecha) => {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
};

// Formatea fecha en formato corto
const formatearFechaCorta = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Vista pública de resultados
const ResultadosPublico = () => {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Control de vista
  const [vistaActual, setVistaActual] = useState('lista');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [convocatoriasDelEvento, setConvocatoriasDelEvento] = useState([]);
  const [resultadosPorConvocatoria, setResultadosPorConvocatoria] = useState({});

  // Filtros de convocatorias
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(false);

  // Paginación de la lista
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 6;

  useEffect(() => {
    cargarEventosFinalizados();
  }, []);

  // Obtiene eventos finalizados
  const cargarEventosFinalizados = async () => {
    try {
      setCargando(true);
      const respuesta = await eventosAPI.getAll();
      const todos = respuesta.data.eventos || respuesta.data || [];
      const finalizados = todos
        .filter((e) => !!e.finalizado || new Date(e.fecha) < new Date())
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setEventos(finalizados);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEventos([]);
    } finally {
      setCargando(false);
    }
  };

  // Navega al detalle de un evento y carga sus convocatorias con resultados
  const manejarVerDetalle = async (evento) => {
    setEventoSeleccionado(evento);
    setVistaActual('detalle');
    setConvocatoriasDelEvento([]);
    setResultadosPorConvocatoria({});
    setFiltroDisciplina('');
    setFiltroCategoria('');

    setCargandoConvocatorias(true);
    try {
      const respuesta = await eventosAPI.getConvocatoriasByEvento(evento.id);
      const lista = respuesta.data.convocatorias || [];
      setConvocatoriasDelEvento(lista);

      // Carga resultados para cada convocatoria
      if (lista.length > 0) {
        const entradas = await Promise.all(
          lista.map(async (conv) => {
            try {
              const res = await resultadosAPI.getByConvocatoria(conv.id);
              return [conv.id, res.data.resultados || []];
            } catch {
              return [conv.id, []];
            }
          })
        );
        setResultadosPorConvocatoria(Object.fromEntries(entradas));
      }
    } catch (error) {
      console.error('Error al cargar convocatorias del evento:', error);
    } finally {
      setCargandoConvocatorias(false);
    }
  };

  // Vuelve a la lista de eventos
  const manejarVolverALista = () => {
    setVistaActual('lista');
    setEventoSeleccionado(null);
    setConvocatoriasDelEvento([]);
    setFiltroDisciplina('');
    setFiltroCategoria('');
  };

  // Genera un PDF con los resultados de una convocatoria
  const verPdfResultados = (convocatoria) => {
    const resultadosCategoria = resultadosPorConvocatoria[convocatoria.id] || [];
    if (resultadosCategoria.length === 0) return;

    const esDistancia = esDisciplinaDeDistancia(convocatoria.disciplina);
    const ordenados = [...resultadosCategoria].sort((a, b) => {
      if (a.posicion === null) return 1;
      if (b.posicion === null) return -1;
      return (a.posicion ?? 999) - (b.posicion ?? 999);
    });

    const filas = ordenados.map((registro) => {
      const marca = registro.pruebas?.find((p) => p.nombre === 'Marca')?.marca;
      const chip = registro.pruebas?.find((p) => p.nombre === 'ChipTime')?.marca;
      const gun = registro.pruebas?.find((p) => p.nombre === 'GunTime')?.marca;
      const base = [
        registro.posicion ? `${registro.posicion}°` : '—',
        registro.bib ? String(registro.bib).padStart(3, '0') : '—',
        obtenerNombreCompleto(registro),
        registro.club_nombre || 'Libre',
      ];
      return esDistancia ? [...base, marca || '—'] : [...base, chip || '—', gun || '—'];
    });

    const headers = esDistancia
      ? ['Pl.', 'Bib', 'Nombre', 'Club', 'Marca']
      : ['Pl.', 'Bib', 'Nombre', 'Club', 'ChipTime', 'GunTime'];

    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.setTextColor(COLORS.burgundy);
    doc.text(`${convocatoria.disciplina || ''} — ${convocatoria.categoria || ''}`, 14, 16);

    doc.setFontSize(10);
    doc.setTextColor('#666666');
    doc.text(eventoSeleccionado?.titulo || '', 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: filas,
      headStyles: { fillColor: [128, 0, 32] },
      styles: { fontSize: 10 },
    });
    // Abre el PDF directo en una pestaña nueva del navegador
    window.open(doc.output('bloburl'), '_blank');
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  // VISTA DE DETALLE DEL EVENTO
  if (vistaActual === 'detalle' && eventoSeleccionado) {
    const disciplinasUnicas = [...new Set(convocatoriasDelEvento.map((c) => c.disciplina).filter(Boolean))].sort();
    const categoriasUnicas = [...new Set(convocatoriasDelEvento.map((c) => c.categoria).filter(Boolean))].sort();
    const convocatoriasFiltradas = convocatoriasDelEvento.filter((c) =>
      (!filtroDisciplina || c.disciplina === filtroDisciplina) &&
      (!filtroCategoria || c.categoria === filtroCategoria)
    );
    const hayFiltrosActivos = !!(filtroDisciplina || filtroCategoria);

    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
        {/* Cabecera del detalle */}
        <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={manejarVolverALista}
              sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: '#FFFFFF1A' } }}
            >
              Volver a Resultados
            </Button>
            <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              IVD · Consulta Pública
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.4rem', md: '2.125rem' } }}>
              {eventoSeleccionado.titulo}
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
          <Box sx={{ mt: { xs: -4, md: -5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '400px 1fr' }, gap: { xs: 2, md: 3 }, alignItems: 'flex-start' }}>

            {/* Columna izquierda: imagen y datos del evento */}
            <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3 }, position: { md: 'sticky' }, top: { md: 24 } }}>
              {eventoSeleccionado.imagen_url && (
                <Box component="img" src={eventoSeleccionado.imagen_url} alt={eventoSeleccionado.titulo}
                  sx={{ width: '100%', height: { xs: 380, md: 460 }, objectFit: 'cover', borderRadius: '8px', mb: 2.5, filter: 'grayscale(35%)' }} />
              )}

              <Chip
                icon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                label="Finalizado"
                size="small"
                sx={{ fontWeight: 700, fontSize: '.72rem', bgcolor: COLORS.lineSoft, color: COLORS.burgundy }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaLarga(eventoSeleccionado.fecha)}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <LocationIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{eventoSeleccionado.lugar}</Typography>
                </Box>
                {eventoSeleccionado.descripcion && (
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ mt: .3, lineHeight: 1.6, color: COLORS.ink, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {eventoSeleccionado.descripcion}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Columna derecha: lista de convocatorias con resultados */}
            <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
              <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
                Convocatorias y Resultados
              </Typography>

              {cargandoConvocatorias ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: COLORS.burgundy }} />
                </Box>
              ) : convocatoriasDelEvento.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 3 }}>
                  Este evento no tiene convocatorias registradas.
                </Typography>
              ) : (
                <>
                  {/* Filtros si hay más de una opción */}
                  {(disciplinasUnicas.length > 1 || categoriasUnicas.length > 1) && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' }, gap: 1.5, mb: 2.5, alignItems: 'end' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Disciplina</InputLabel>
                        <Select label="Disciplina" value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)}>
                          <MenuItem value="">Todas</MenuItem>
                          {disciplinasUnicas.map((d) => (
                            <MenuItem key={d} value={d}>{d}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel>Categoría</InputLabel>
                        <Select label="Categoría" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                          <MenuItem value="">Todas</MenuItem>
                          {categoriasUnicas.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        onClick={() => { setFiltroDisciplina(''); setFiltroCategoria(''); }}
                        disabled={!hayFiltrosActivos}
                        startIcon={<ClearIcon fontSize="small" />}
                        sx={{ color: COLORS.purple, textTransform: 'none', fontWeight: 700, height: 40 }}
                      >
                        Limpiar
                      </Button>
                    </Box>
                  )}

                  {convocatoriasFiltradas.length === 0 ? (
                    <Typography variant="body2" sx={{ color: COLORS.purple, textAlign: 'center', py: 3 }}>
                      Ninguna convocatoria coincide con el filtro.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {convocatoriasFiltradas.map((conv) => (
                        <Box
                          key={conv.id}
                          sx={{
                            p: 2, borderRadius: '8px', border: `1px solid ${COLORS.line}`,
                            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{conv.disciplina}</Typography>
                            <Box sx={{ display: 'flex', gap: .75, mt: .5, flexWrap: 'wrap' }}>
                              <Chip label={conv.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, bgcolor: 'transparent', color: COLORS.purple }} />
                              <Chip label={obtenerTextoGenero(conv.genero)} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                            </Box>
                          </Box>

                          {(resultadosPorConvocatoria[conv.id] || []).length > 0 ? (
                            <Button
                              size="small" variant="contained" startIcon={<PdfIcon />}
                              onClick={() => verPdfResultados(conv)}
                              sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                            >
                              Ver PDF
                            </Button>
                          ) : (
                            <Chip icon={<PendingIcon sx={{ fontSize: 16 }} />} label="Resultados pendientes" size="small" sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  // VISTA DE LISTA DE EVENTOS
  const eventosPaginados = eventos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      {/* Cabecera de lista */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Consulta Pública
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Resultados
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Eventos finalizados y sus resultados oficiales por convocatoria
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {/* Resumen de conteo */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: { xs: 3, md: 4 },
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px #00000024',
            display: 'grid', gridTemplateColumns: '1fr',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center' }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><TrophyIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>{eventos.length}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>Eventos Finalizados</Typography>
          </Box>
        </Box>

        {eventos.length === 0 ? (
          <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <TrophyIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>Aún no hay eventos finalizados</Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5 }}>
              Los resultados aparecerán aquí en cuanto un evento concluya.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {eventosPaginados.map((evento) => (
                <Box
                  key={evento.id}
                  sx={{
                    ...cardSx, overflow: 'hidden', cursor: 'pointer',
                    transition: 'transform .15s, box-shadow .15s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px #0000001F' },
                  }}
                  onClick={() => manejarVerDetalle(evento)}
                >
                  {evento.imagen_url ? (
                    <Box component="img" src={evento.imagen_url} alt={evento.titulo}
                      sx={{ width: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(55%)', opacity: 0.9 }} />
                  ) : (
                    <Box sx={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: COLORS.lineSoft }}>
                      <EventIcon sx={{ fontSize: 40, color: COLORS.purple }} />
                    </Box>
                  )}
                  <Box sx={{ p: 2.25 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: '#6a6a6a', lineHeight: 1.25 }}>{evento.titulo}</Typography>
                      <Chip icon={<DoneAllIcon sx={{ fontSize: 14 }} />} label="Finalizado" size="small" sx={{ fontWeight: 700, fontSize: '.68rem', bgcolor: COLORS.lineSoft, color: COLORS.burgundy, flexShrink: 0 }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .5 }}>
                      <CalendarIcon sx={{ fontSize: 14, color: '#8a8a8a' }} />
                      <Typography variant="body2" sx={{ color: '#8a8a8a', fontWeight: 600 }}>{formatearFechaCorta(evento.fecha)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: 1.75 }}>
                      <LocationIcon sx={{ fontSize: 14, color: '#8a8a8a' }} />
                      <Typography variant="body2" sx={{ color: '#8a8a8a' }}>{evento.lugar}</Typography>
                    </Box>
                    <Button
                      fullWidth variant="outlined" size="small" startIcon={<TrophyIcon />}
                      onClick={(e) => { e.stopPropagation(); manejarVerDetalle(evento); }}
                      sx={{ color: COLORS.purple, borderColor: COLORS.purple, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }}
                    >
                      Ver resultados
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>

            {eventos.length > POR_PAGINA && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <Pagination
                  count={Math.ceil(eventos.length / POR_PAGINA)}
                  page={pagina}
                  onChange={(e, valor) => setPagina(valor)}
                  sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: COLORS.burgundy, color: '#fff' } }}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default ResultadosPublico;