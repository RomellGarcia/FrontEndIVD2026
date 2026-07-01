import React, { useState, useEffect } from 'react';
import { eventosAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Paper, Container, Button, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Pagination, IconButton, Chip, Divider,
} from '@mui/material';
import {
  People as PeopleIcon, Visibility as ViewIcon, Close as CloseIcon,
  CalendarToday as CalendarIcon, LocationOn as LocationIcon,
  AccessTime as TimeIcon, SportsScore as SportsIcon,
  Event as EventIcon, Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e3e4e5';

const EventosAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalConvocatoriasOpen, setModalConvocatoriasOpen] = useState(false);
  const [modalEventoOpen, setModalEventoOpen] = useState(false);
  const [eventoConvocatorias, setEventoConvocatorias] = useState(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  const [page, setPage] = useState(1);
  const eventosPorPagina = 6;

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchEventos();
  }, [user, navigate]);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const response = await eventosAPI.getAll();
      setEventos((response.data.eventos || []).filter(e => new Date(e.fecha) > new Date()));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: CREAM }}>
        <CircularProgress size={60} sx={{ color: BURGUNDY }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: CREAM, minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 } }}>

        {/* ── Header ── */}
        <Typography variant="h4" sx={{ color: BURGUNDY, fontWeight: 800, textAlign: 'center', mb: .5 }}>
          Próximos Eventos
        </Typography>
        <Typography variant="body1" sx={{ color: PURPLE, textAlign: 'center', mb: 4, opacity: .8 }}>
          Consulta los eventos disponibles e inscríbete a las convocatorias
        </Typography>

        {/* ── Tabla ── */}
        {eventos.length === 0 ? (
          <Paper sx={{ borderRadius: 3, textAlign: 'center', py: 6 }}>
            <Avatar sx={{ bgcolor: `${PURPLE}14`, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <EventIcon sx={{ fontSize: 32, color: PURPLE }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: PURPLE }}>No hay eventos próximos</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: .5 }}>
              Los nuevos eventos aparecerán aquí cuando sean publicados
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: `${BURGUNDY}08` }}>
                  {['Imagen', 'Fecha', 'Título', 'Lugar', 'Estado', 'Convocatorias'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: BURGUNDY, py: 2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {eventosPaginados.map((evento) => {
                  const abierta = inscripcionAbierta(evento);
                  return (
                    <TableRow key={evento.id} hover sx={{ '&:hover': { bgcolor: `${CREAM}66` } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Avatar
                          src={evento.imagen_url}
                          variant="rounded"
                          sx={{
                            width: 72, height: 72,
                            bgcolor: `${PURPLE}14`,
                            border: `1px solid ${BURGUNDY}22`,
                          }}
                        >
                          <EventIcon sx={{ color: PURPLE }} />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {fmtCorta(evento.fecha)}
                        </Typography>
                        {evento.hora && (
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {fmtHora(evento.hora)} hrs
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                          {evento.titulo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#555', display: 'flex', alignItems: 'center', gap: .5 }}>
                          <LocationIcon sx={{ fontSize: 14, color: BURGUNDY }} />
                          {evento.lugar}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={abierta ? 'Abierto' : 'Cerrado'}
                          color={abierta ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '.72rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PeopleIcon />}
                          onClick={() => handleVerConvocatorias(evento)}
                          sx={{
                            color: BURGUNDY, borderColor: BURGUNDY,
                            textTransform: 'none', fontWeight: 600,
                            '&:hover': { borderColor: '#600018', bgcolor: `${BURGUNDY}08` },
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

            {/* Paginación */}
            {eventos.length > eventosPorPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #eee' }}>
                <Pagination
                  count={Math.ceil(eventos.length / eventosPorPagina)}
                  page={page}
                  onChange={(e, v) => setPage(v)}
                  sx={{
                    '& .MuiPaginationItem-root.Mui-selected': { bgcolor: BURGUNDY, color: '#fff' },
                  }}
                />
              </Box>
            )}
          </Paper>
        )}
      </Container>

      {/* ── Convocatorias ── */}
      <Dialog open={modalConvocatoriasOpen} onClose={() => setModalConvocatoriasOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: BURGUNDY, width: 36, height: 36 }}>
                <PeopleIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 700, lineHeight: 1.2 }}>
                  Convocatorias
                </Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>
                  {eventoConvocatorias?.titulo}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setModalConvocatoriasOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {eventoConvocatorias?.convocatorias?.length > 0 ? (
            eventoConvocatorias.convocatorias.map((conv, idx) => (
              <Paper key={idx} variant="outlined" sx={{
                p: 2, mb: 1.5, borderRadius: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                '&:hover': { borderColor: BURGUNDY, bgcolor: `${CREAM}66` },
                transition: 'all .2s',
              }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {conv.disciplina}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    {conv.categoria} · {conv.genero}
                  </Typography>
                </Box>
                <IconButton onClick={() => handleVerDetalle(eventoConvocatorias, conv, idx)} sx={{ color: BURGUNDY }}>
                  <ViewIcon />
                </IconButton>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: '#999' }}>
              No hay convocatorias para este evento
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalConvocatoriasOpen(false)} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal Detalle ── */}
      <Dialog open={modalEventoOpen} onClose={() => setModalEventoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: PURPLE, width: 36, height: 36 }}>
                <InfoIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 700 }}>
                Detalles del Evento
              </Typography>
            </Box>
            <IconButton onClick={() => setModalEventoOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {eventoSeleccionado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Imagen */}
              {eventoSeleccionado.imagen_url && (
                <Box component="img" src={eventoSeleccionado.imagen_url} alt={eventoSeleccionado.titulo}
                  sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2 }} />
              )}

              <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 700 }}>
                {eventoSeleccionado.titulo}
              </Typography>

              <Divider />

              {/* Info general */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: BURGUNDY }} />
                    <Typography variant="caption" sx={{ color: '#888' }}>Fecha</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(eventoSeleccionado.fecha)}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <TimeIcon sx={{ fontSize: 16, color: BURGUNDY }} />
                    <Typography variant="caption" sx={{ color: '#888' }}>Hora</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtHora(eventoSeleccionado.hora) || '—'}</Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <LocationIcon sx={{ fontSize: 16, color: BURGUNDY }} />
                    <Typography variant="caption" sx={{ color: '#888' }}>Lugar</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{eventoSeleccionado.lugar}</Typography>
                </Box>
              </Box>

              {/* Info deportiva */}
              {eventoSeleccionado.convocatoriaSeleccionada && (
                <>
                  <Divider />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                        <SportsIcon sx={{ fontSize: 16, color: PURPLE }} />
                        <Typography variant="caption" sx={{ color: '#888' }}>Disciplina</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {eventoSeleccionado.convocatoriaSeleccionada.disciplina}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#888' }}>Categoría</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {eventoSeleccionado.convocatoriaSeleccionada.categoria}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#888' }}>Género</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {eventoSeleccionado.convocatoriaSeleccionada.genero}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#888' }}>Cierre inscripción</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(eventoSeleccionado.fecha_cierre)}</Typography>
                    </Box>
                  </Box>
                </>
              )}

              {/* Descripción */}
              {eventoSeleccionado.descripcion && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ mt: .5, lineHeight: 1.6, color: '#333' }}>
                      {eventoSeleccionado.descripcion}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEventoOpen(false)} sx={{ color: PURPLE, fontWeight: 600 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventosAtleta;