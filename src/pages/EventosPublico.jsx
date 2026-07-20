import React, { useState, useEffect } from 'react';
import { eventosAPI } from '../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Container, Button, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Pagination, IconButton, Chip, Divider,
} from '@mui/material';
import {
  People as PeopleIcon, Visibility as ViewIcon, Close as CloseIcon,
  CalendarToday as CalendarIcon, LocationOn as LocationIcon,
  AccessTime as TimeIcon, SportsScore as SportsIcon,
  Event as EventIcon, Info as InfoIcon, LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import EncabezadoPublico from '../components/layout/EncabezadoPublico.jsx';

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

const tableHeadSx = {
  fontWeight: 700,
  color: '#fff',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  py: 2,
};

/** Chip de estado sin colores semánticos default de MUI. */
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

/**
 * Versión PÚBLICA de "Próximos Eventos" — solo consulta.
 * No requiere sesión, no permite inscribirse ni editar nada.
 * A diferencia de EventosAtleta.jsx, aquí no hay guard de useAuth/navigate
 * y las convocatorias solo se muestran como información, sin botón de inscripción.
 */
const EventosPublico = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConvocatoriasOpen, setModalConvocatoriasOpen] = useState(false);
  const [modalEventoOpen, setModalEventoOpen] = useState(false);
  const [eventoConvocatorias, setEventoConvocatorias] = useState(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  const [page, setPage] = useState(1);
  const eventosPorPagina = 6;

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const response = await eventosAPI.getAll();
      setEventos((response.data.eventos || response.data || []).filter(e => new Date(e.fecha) > new Date()));
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerConvocatorias = (evento) => {
    setEventoConvocatorias(evento);
    setModalConvocatoriasOpen(true);
  };

  const handleVerDetalle = (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalEventoOpen(true);
  };

  const fmt = (fecha) => {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
  };

  const fmtCorta = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtHora = (hora) => hora ? String(hora).slice(0, 5) : '';

  const inscripcionAbierta = (evento) => {
    if (!evento.fecha_cierre) return true;
    return new Date(evento.fecha_cierre) > new Date();
  };

  const eventosPaginados = eventos.slice((page - 1) * eventosPorPagina, page * eventosPorPagina);
  const totalAbiertos = eventos.filter(inscripcionAbierta).length;

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>

      {/* ── Franja de bienvenida ── */}
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

        {/* ── Stat-strip flotante ── */}
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

        {/* ── Tabla ── */}
        {eventos.length === 0 ? (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)', textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: COLORS.lineSoft, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <EventIcon sx={{ fontSize: 32, color: COLORS.purple }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>No hay eventos próximos</Typography>
            <Typography variant="body2" sx={{ color: COLORS.purple, opacity: .8, mt: .5 }}>
              Los nuevos eventos aparecerán aquí cuando sean publicados.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ bgcolor: COLORS.paper, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: COLORS.burgundy }}>
                  {['Imagen', 'Fecha', 'Título', 'Lugar', 'Estado', 'Convocatorias'].map((h) => (
                    <TableCell key={h} sx={tableHeadSx}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {eventosPaginados.map((evento) => {
                  const abierta = inscripcionAbierta(evento);
                  return (
                    <TableRow key={evento.id} hover sx={{ '&:hover': { bgcolor: COLORS.lineSoft } }}>
                      <TableCell sx={{ py: 1.5, borderColor: COLORS.line }}>
                        <Avatar
                          src={evento.imagen_url}
                          variant="rounded"
                          sx={{ width: 64, height: 64, bgcolor: COLORS.lineSoft, border: `1px solid ${COLORS.line}` }}
                        >
                          <EventIcon sx={{ color: COLORS.purple }} />
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{fmtCorta(evento.fecha)}</Typography>
                        {evento.hora && <Typography variant="caption" sx={{ color: COLORS.purple }}>{fmtHora(evento.hora)} hrs</Typography>}
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{evento.titulo}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Typography variant="body2" sx={{ color: COLORS.ink, display: 'flex', alignItems: 'center', gap: .5 }}>
                          <LocationIcon sx={{ fontSize: 14, color: COLORS.burgundy }} />
                          {evento.lugar}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <EstadoChip label={abierta ? 'Abierto' : 'Cerrado'} positivo={abierta} />
                      </TableCell>
                      <TableCell sx={{ borderColor: COLORS.line }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PeopleIcon />}
                          onClick={() => handleVerConvocatorias(evento)}
                          sx={{
                            color: COLORS.burgundy, borderColor: COLORS.burgundy,
                            textTransform: 'none', fontWeight: 700,
                            '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft },
                          }}
                        >
                          Ver ({evento.convocatorias?.length || 0})
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {eventos.length > eventosPorPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${COLORS.line}` }}>
                <Pagination
                  count={Math.ceil(eventos.length / eventosPorPagina)}
                  page={page}
                  onChange={(e, v) => setPage(v)}
                  sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: COLORS.burgundy, color: '#fff' } }}
                />
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* ── Convocatorias (solo informativo, sin botón de inscripción) ── */}
      <Dialog open={modalConvocatoriasOpen} onClose={() => setModalConvocatoriasOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon sx={{ fontSize: 20 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Convocatorias</Typography>
                <Typography variant="caption" sx={{ opacity: .85 }}>{eventoConvocatorias?.titulo}</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setModalConvocatoriasOpen(false)} size="small" sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {eventoConvocatorias?.convocatorias?.length > 0 ? (
            eventoConvocatorias.convocatorias.map((conv, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2, mb: 1.5, borderRadius: '8px', border: `1px solid ${COLORS.line}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  '&:hover': { borderColor: COLORS.burgundy, bgcolor: COLORS.lineSoft },
                  transition: 'all .15s',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.ink }}>{conv.disciplina}</Typography>
                  <Typography variant="caption" sx={{ color: COLORS.purple }}>{conv.categoria} · {conv.genero}</Typography>
                </Box>
                <IconButton onClick={() => handleVerDetalle(eventoConvocatorias, conv, idx)} sx={{ color: COLORS.burgundy }}>
                  <ViewIcon />
                </IconButton>
              </Box>
            ))
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: COLORS.purple }}>
              No hay convocatorias para este evento.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalConvocatoriasOpen(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal Detalle ── */}
      <Dialog open={modalEventoOpen} onClose={() => setModalEventoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Detalles del Evento</Typography>
            </Box>
            <IconButton onClick={() => setModalEventoOpen(false)} size="small" sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {eventoSeleccionado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {eventoSeleccionado.imagen_url && (
                <Box component="img" src={eventoSeleccionado.imagen_url} alt={eventoSeleccionado.titulo}
                  sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '8px' }} />
              )}

              <Typography variant="h6" sx={{ color: COLORS.burgundy, fontWeight: 700 }}>
                {eventoSeleccionado.titulo}
              </Typography>

              <Divider sx={{ borderColor: COLORS.line }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Fecha</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{fmt(eventoSeleccionado.fecha)}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <TimeIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Hora</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{fmtHora(eventoSeleccionado.hora) || '—'}</Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <LocationIcon sx={{ fontSize: 16, color: COLORS.burgundy }} />
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Lugar</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{eventoSeleccionado.lugar}</Typography>
                </Box>
              </Box>

              {eventoSeleccionado.convocatoriaSeleccionada && (
                <>
                  <Divider sx={{ borderColor: COLORS.line }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                        <SportsIcon sx={{ fontSize: 16, color: COLORS.purple }} />
                        <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Disciplina</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                        {eventoSeleccionado.convocatoriaSeleccionada.disciplina}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Categoría</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                        {eventoSeleccionado.convocatoriaSeleccionada.categoria}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Género</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>
                        {eventoSeleccionado.convocatoriaSeleccionada.genero}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Cierre inscripción</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.ink }}>{fmt(eventoSeleccionado.fecha_cierre)}</Typography>
                    </Box>
                  </Box>
                </>
              )}

              {eventoSeleccionado.descripcion && (
                <>
                  <Divider sx={{ borderColor: COLORS.line }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: COLORS.purple, fontWeight: 700, textTransform: 'uppercase' }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ mt: .5, lineHeight: 1.6, color: COLORS.ink }}>
                      {eventoSeleccionado.descripcion}
                    </Typography>
                  </Box>
                </>
              )}

              <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: COLORS.lineSoft, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: COLORS.burgundy, fontWeight: 600 }}>
                  Para inscribirte a esta convocatoria, inicia sesión con tu cuenta de atleta o entrenador.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEventoOpen(false)} sx={{ color: COLORS.purple, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventosPublico;