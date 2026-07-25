import React, { useState, useEffect } from 'react';
import { eventosAPI } from '../api/index.js';
import {
  Box, Typography, Container, Button, CircularProgress, Avatar, Pagination, Chip, Divider,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon, LocationOn as LocationIcon,
  AccessTime as TimeIcon, Event as EventIcon, Info as InfoIcon,
  LockOpen as LockOpenIcon, ArrowBack as ArrowBackIcon,
  Clear as ClearIcon, Warning as WarningIcon, Download as DownloadIcon,
  Login as LoginIcon,
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
  line: 'rgba(128,0,32,0.18)',
  lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

// Componente auxiliar para mostrar estado de inscripción
const EstadoChip = ({ label, positivo = true }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      fontWeight: 700, fontSize: '.72rem',
      bgcolor: 'transparent',
      border: `1px solid ${positivo ? COLORS.purple : COLORS.line}`,
      color: positivo ? COLORS.purple : COLORS.ink,
    }}
  />
);

// Abre un documento en nueva ventana, usando visor de Google para no-PDF
const abrirDocumentoEnVentana = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

// Devuelve el texto legible para el género
const obtenerTextoGenero = (genero) => {
  const valor = (genero || '').toLowerCase();
  if (valor === 'masculino') return 'Masculino';
  if (valor === 'femenino') return 'Femenino';
  if (valor === 'mixto') return 'Mixto';
  return genero || 'N/A';
};

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

// Extrae la hora (HH:MM) de una cadena de hora
const formatearHora = (hora) => hora ? String(hora).slice(0, 5) : '';

// Indica si la inscripción al evento está abierta (fecha de cierre futura)
const estaInscripcionAbierta = (evento) => {
  if (!evento.fecha_cierre) return true;
  return new Date(evento.fecha_cierre) > new Date();
};

// Vista pública de eventos
const EventosPublico = () => {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Control de vista: 'lista' o 'detalle'
  const [vistaActual, setVistaActual] = useState('lista');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [convocatoriasDelEvento, setConvocatoriasDelEvento] = useState([]);

  // Filtros de convocatorias
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(false);

  // Paginación de la lista
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 6;

  // Modal de detalle de convocatoria
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [convocatoriaEnDetalle, setConvocatoriaEnDetalle] = useState(null);

  useEffect(() => {
    cargarEventos();
  }, []);

  // Obtiene todos los eventos y filtra los próximos
  const cargarEventos = async () => {
    try {
      setCargando(true);
      const respuesta = await eventosAPI.getAll();
      const todos = respuesta.data.eventos || respuesta.data || [];
      const proximos = todos
        .filter((e) => !e.finalizado && new Date(e.fecha) > new Date())
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setEventos(proximos);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEventos([]);
    } finally {
      setCargando(false);
    }
  };

  // Navega al detalle de un evento y carga sus convocatorias
  const manejarVerDetalleEvento = async (evento) => {
    setEventoSeleccionado(evento);
    setVistaActual('detalle');
    setConvocatoriasDelEvento([]);
    setFiltroDisciplina('');
    setFiltroCategoria('');

    setCargandoConvocatorias(true);
    try {
      const respuesta = await eventosAPI.getConvocatoriasByEvento(evento.id);
      setConvocatoriasDelEvento(respuesta.data.convocatorias || []);
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

  // Abre el modal con el detalle de una convocatoria
  const manejarVerDetalleConvocatoria = (convocatoria) => {
    setConvocatoriaEnDetalle(convocatoria);
    setModalDetalleAbierto(true);
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
    const inscripcionAbierta = estaInscripcionAbierta(eventoSeleccionado);

    // Opciones únicas para filtros
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
              sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Volver a Eventos
            </Button>
            <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              IVD · Consulta Pública
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
              {eventoSeleccionado.titulo}
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
          <Box sx={{ mt: { xs: -4, md: -5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '400px 1fr' }, gap: 3, alignItems: 'flex-start' }}>

            {/* Columna izquierda: imagen y datos del evento */}
            <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3 }, position: { md: 'sticky' }, top: { md: 24 } }}>
              {eventoSeleccionado.imagen_url && (
                <Box component="img" src={eventoSeleccionado.imagen_url} alt={eventoSeleccionado.titulo}
                  sx={{ width: '100%', height: { xs: 380, md: 460 }, objectFit: 'cover', borderRadius: '8px', mb: 2.5 }} />
              )}

              <EstadoChip label={inscripcionAbierta ? 'Inscripción abierta' : 'Inscripción cerrada'} positivo={inscripcionAbierta} />

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
                    <TimeIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Hora</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearHora(eventoSeleccionado.hora) || '—'}</Typography>
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
                {(eventoSeleccionado.documentoConvocatoria || eventoSeleccionado.documentoDeslinde) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
                    {eventoSeleccionado.documentoConvocatoria && (
                      <Button
                        fullWidth variant="outlined" size="small" startIcon={<DownloadIcon />}
                        onClick={() => abrirDocumentoEnVentana(eventoSeleccionado.documentoConvocatoria)}
                        sx={{ borderColor: COLORS.burgundy, color: COLORS.burgundy, fontWeight: 700, textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Ver documento de convocatoria
                      </Button>
                    )}
                    {eventoSeleccionado.documentoDeslinde && (
                      <Button
                        fullWidth variant="outlined" size="small" startIcon={<WarningIcon />}
                        onClick={() => abrirDocumentoEnVentana(eventoSeleccionado.documentoDeslinde)}
                        sx={{ borderColor: COLORS.purple, color: COLORS.purple, fontWeight: 700, textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Ver deslinde de responsabilidad
                      </Button>
                    )}
                  </Box>
                )}

                {/* Mensaje de invitación a iniciar sesión (sin botón de inscripción) */}
                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: COLORS.lineSoft, textAlign: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: COLORS.burgundy, fontWeight: 600 }}>
                    Para inscribirte, inicia sesión con tu cuenta de atleta, entrenador o club.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Columna derecha: lista de convocatorias */}
            <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
              <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: 2 }}>
                Convocatorias de este Evento
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
                              {(conv.edad_min ?? conv.edadMin) != null && (
                                <Chip label={`${conv.edad_min ?? conv.edadMin}-${conv.edad_max ?? conv.edadMax} años`} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                              )}
                            </Box>
                          </Box>

                          <Button
                            size="small" variant="outlined" startIcon={<InfoIcon />}
                            onClick={() => manejarVerDetalleConvocatoria(conv)}
                            sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
                          >
                            Ver detalles
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Container>

        {/* Modal de detalle de convocatoria (solo lectura) */}
        <Dialog open={modalDetalleAbierto} onClose={() => setModalDetalleAbierto(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
            Detalle de la Convocatoria
          </DialogTitle>
          <DialogContent dividers>
            {convocatoriaEnDetalle && (
              <Box>
                <Typography variant="h5" sx={{ color: COLORS.burgundy, fontWeight: 800, mb: .5 }}>
                  {convocatoriaEnDetalle.disciplina}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: COLORS.purple, mb: 3 }}>
                  Información Oficial de la Convocatoria
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Disciplina</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{convocatoriaEnDetalle.disciplina}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría y Género</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>
                      {convocatoriaEnDetalle.categoria} ({obtenerTextoGenero(convocatoriaEnDetalle.genero)})
                      {(convocatoriaEnDetalle.edad_min ?? convocatoriaEnDetalle.edadMin) != null && ` · ${convocatoriaEnDetalle.edad_min ?? convocatoriaEnDetalle.edadMin}-${convocatoriaEnDetalle.edad_max ?? convocatoriaEnDetalle.edadMax} años`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar y Fecha del Evento</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{eventoSeleccionado.lugar} - {formatearFechaLarga(eventoSeleccionado.fecha)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Cierre de Inscripciones</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.ink }}>{formatearFechaLarga(eventoSeleccionado.fecha_cierre)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: COLORS.line, mb: 2.5 }} />

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                  {eventoSeleccionado.documentoConvocatoria && (
                    <Button
                      variant="outlined" startIcon={<DownloadIcon />}
                      onClick={() => abrirDocumentoEnVentana(eventoSeleccionado.documentoConvocatoria)}
                      sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700 }}
                    >
                      Descargar Documento Oficial
                    </Button>
                  )}
                  <Chip
                    icon={<LoginIcon sx={{ fontSize: 16 }} />}
                    label="Inicia sesión para inscribirte"
                    sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalDetalleAbierto(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // VISTA DE LISTA DE EVENTOS
  const eventosPaginados = eventos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const totalAbiertos = eventos.filter(estaInscripcionAbierta).length;

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      {/* Cabecera de lista */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Consulta Pública
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Próximos Eventos
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Consulta los eventos y convocatorias vigentes del Instituto Veracruzano del Deporte
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
        {/* Resumen de conteo */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 4,
            bgcolor: COLORS.paper, borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center', borderRight: `1px solid ${COLORS.line}` }}>
            <Box sx={{ color: COLORS.burgundy, mb: 0.5, display: 'flex', justifyContent: 'center' }}><EventIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>{eventos.length}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>Eventos Próximos</Typography>
          </Box>
          <Box sx={{ p: { xs: 2, md: 2.75 }, textAlign: 'center' }}>
            <Box sx={{ color: COLORS.purple, mb: 0.5, display: 'flex', justifyContent: 'center' }}><LockOpenIcon sx={{ fontSize: 24 }} /></Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.1, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>{totalAbiertos}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700, mt: 0.2 }}>Con Inscripción Abierta</Typography>
          </Box>
        </Box>

        {eventos.length === 0 ? (
          <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <EventIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>No hay eventos próximos</Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5 }}>
              Los nuevos eventos aparecerán aquí cuando sean publicados.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {eventosPaginados.map((evento) => {
                const inscripcionAbierta = estaInscripcionAbierta(evento);
                return (
                  <Box
                    key={evento.id}
                    sx={{
                      ...cardSx, overflow: 'hidden', cursor: 'pointer',
                      transition: 'transform .15s, box-shadow .15s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)' },
                    }}
                    onClick={() => manejarVerDetalleEvento(evento)}
                  >
                    {evento.imagen_url ? (
                      <Box component="img" src={evento.imagen_url} alt={evento.titulo}
                        sx={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <Box sx={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: COLORS.lineSoft }}>
                        <EventIcon sx={{ fontSize: 40, color: COLORS.purple }} />
                      </Box>
                    )}
                    <Box sx={{ p: 2.25 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <Typography sx={{ fontWeight: 800, color: COLORS.ink, lineHeight: 1.25 }}>{evento.titulo}</Typography>
                        <EstadoChip label={inscripcionAbierta ? 'Abierto' : 'Cerrado'} positivo={inscripcionAbierta} />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .5 }}>
                        <CalendarIcon sx={{ fontSize: 14, color: COLORS.burgundy }} />
                        <Typography variant="body2" sx={{ color: COLORS.ink, fontWeight: 600 }}>
                          {formatearFechaCorta(evento.fecha)}{evento.hora && ` · ${formatearHora(evento.hora)} hrs`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: 1.75 }}>
                        <LocationIcon sx={{ fontSize: 14, color: COLORS.burgundy }} />
                        <Typography variant="body2" sx={{ color: COLORS.ink }}>{evento.lugar}</Typography>
                      </Box>
                      <Button
                        fullWidth variant="outlined" size="small" startIcon={<InfoIcon />}
                        onClick={(e) => { e.stopPropagation(); manejarVerDetalleEvento(evento); }}
                        sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
                      >
                        Ver detalles
                      </Button>
                    </Box>
                  </Box>
                );
              })}
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

export default EventosPublico;