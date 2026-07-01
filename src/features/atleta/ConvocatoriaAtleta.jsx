import React, { useState, useEffect } from 'react';
import { eventosAPI, perfilEmpresaAPI } from '../../api/index.js';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Paper, Container, Button, IconButton, Alert, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider, Pagination,
} from '@mui/material';
import {
  Download as DownloadIcon, Close as CloseIcon, Event as EventIcon,
  CalendarToday as CalendarIcon, LocationOn as LocationIcon,
  SportsScore as SportsIcon, Person as PersonIcon,
  CheckCircle as CheckIcon, HowToReg as RegisterIcon,
} from '@mui/icons-material';
import { useAuth } from '../../components/common/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

const BURGUNDY = '#800020';
const PURPLE = '#7A4069';
const CREAM = '#e3e4e5';
const GREEN = '#2E7D32';

const ConvocatoriasAtleta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convocatorias, setConvocatorias] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [inscribiendo, setInscribiendo] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState(null);
  const [yaInscritos, setYaInscritos] = useState([]);
  const [page, setPage] = useState(1);
  const porPagina = 8;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const edad = calcularEdad(user.fecha_nacimiento);
      const genero = (user.genero || '').toLowerCase();

      if (!edad || !genero) {
        setErrorMessage('Verifica que tu fecha de nacimiento y género estén registrados en tu perfil.');
        setConvocatorias([]);
        return;
      }

      const [convRes, logoRes, inscRes] = await Promise.allSettled([
        eventosAPI.getMisConvocatorias(),
        perfilEmpresaAPI.get(),
        eventosAPI.getMisInscripciones(),
      ]);

      if (convRes.status === 'fulfilled') {
        const data = convRes.value.data.convocatorias || [];
        setConvocatorias(data);
        if (data.length === 0) {
          setErrorMessage(`No hay convocatorias disponibles para tu edad (${edad} años) y género (${genero}).`);
        }
      } else {
        setErrorMessage('Error al cargar las convocatorias.');
        setConvocatorias([]);
      }

      if (logoRes.status === 'fulfilled') {
        setLogoUrl(logoRes.value.data.perfil?.logo || '');
      }

      if (inscRes.status === 'fulfilled') {
        const inscripciones = inscRes.value.data.inscripciones || inscRes.value.data || [];
        setYaInscritos(inscripciones.map(i => i.convocatoria_id || i.eventoId));
      }
    } catch {
      setErrorMessage('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    try {
      const hoy = new Date();
      const nac = new Date(fechaNacimiento);
      if (isNaN(nac.getTime()) || nac > hoy) return null;
      let edad = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
      return edad >= 0 && edad <= 100 ? edad : null;
    } catch { return null; }
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

  const inscripcionAbierta = (conv) => {
    if (!conv.fecha_cierre && !conv.fechaCierre) return true;
    return new Date(conv.fecha_cierre || conv.fechaCierre) > new Date();
  };

  const estaInscrito = (conv) => {
    return yaInscritos.includes(conv.convocatoria_id || conv._id || conv.id);
  };

  const handleInscribirse = (conv) => {
    if (!user.nombre || !user.curp || !user.fecha_nacimiento || !user.genero) {
      Swal.fire({ icon: 'warning', title: 'Perfil incompleto', text: 'Completa tu perfil antes de inscribirte.', confirmButtonColor: BURGUNDY });
      return;
    }
    if (!inscripcionAbierta(conv)) {
      Swal.fire({ icon: 'error', title: 'Inscripción cerrada', text: 'Esta convocatoria ya cerró inscripciones.', confirmButtonColor: BURGUNDY });
      return;
    }
    setConvocatoriaSeleccionada(conv);
    setModalOpen(true);
  };

  const handleConfirmarInscripcion = async () => {
    if (!convocatoriaSeleccionada) return;
    setInscribiendo(true);
    try {
      await eventosAPI.inscribir({
        convocatoria_id: convocatoriaSeleccionada.convocatoria_id || convocatoriaSeleccionada.id,
      });
      setModalOpen(false);
      Swal.fire({ icon: 'success', title: 'Inscripción exitosa', confirmButtonColor: BURGUNDY, timer: 2000, showConfirmButton: false });
      await cargarDatos();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error || 'Error al inscribirse.', confirmButtonColor: BURGUNDY });
    } finally { setInscribiendo(false); }
  };

  /* ── Generar PDF ── */
  const handleDescargarPDF = (conv) => {
    try {
      const doc = new jsPDF();
      let y = 15;
      const margin = 20;
      const pw = doc.internal.pageSize.width;
      const cw = pw - 2 * margin;

      const wrap = (text, x, yy, mw) => {
        const lines = doc.splitTextToSize(text, mw);
        doc.text(lines, x, yy);
        return yy + lines.length * 5;
      };
      const center = (text, yy, fs = 16) => {
        doc.setFontSize(fs); doc.setFont('helvetica', 'bold');
        doc.text(text, pw / 2, yy, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        return yy + 8;
      };
      const sub = (text, yy) => {
        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(128, 0, 32);
        doc.text(text, margin, yy);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
        return yy + 6;
      };

      if (logoUrl) { try { doc.addImage(logoUrl, 'JPEG', margin, y, 20, 20); y += 25; } catch { /* sin logo */ } }

      y = center('INSTITUTO VERACRUZANO DEL DEPORTE', y, 16);
      y = center('Gobierno del Estado de Veracruz', y, 10);
      y = center('CONVOCATORIA OFICIAL', y, 14);
      y += 10;
      doc.setDrawColor(128, 0, 32); doc.line(margin, y, pw - margin, y); y += 12;

      const fechaHoy = fmt(new Date());
      doc.setFontSize(9); doc.text(`Veracruz, Ver. a ${fechaHoy}`, pw - margin, y, { align: 'right' }); doc.setFontSize(10); y += 10;

      y = wrap('El Instituto Veracruzano del Deporte invita a todos los atletas interesados a participar en el siguiente evento deportivo:', margin, y, cw);
      y += 8;

      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(128, 0, 32);
      doc.text(conv.titulo || 'Evento Deportivo', pw / 2, y, { align: 'center' });
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0); y += 10;

      y = sub('INFORMACIÓN DEL EVENTO:', y);
      const detalles = [
        ['Disciplina:', conv.disciplina || '—'], ['Categoría:', conv.categoria || '—'],
        ['Género:', conv.genero === 'masculino' ? 'Masculino' : conv.genero === 'femenino' ? 'Femenino' : 'Mixto'],
        ['Lugar:', conv.lugar || '—'], ['Fecha:', fmt(conv.fecha)],
        ['Hora:', conv.hora || '—'], ['Cierre inscripción:', fmt(conv.fecha_cierre || conv.fechaCierre)],
      ];
      detalles.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        const lbl = `• ${label}`; doc.text(lbl, margin, y); doc.setFont('helvetica', 'normal');
        y = wrap(value, margin + doc.getTextWidth(lbl) + 3, y, cw - doc.getTextWidth(lbl) - 3); y += 3;
      });

      if (conv.descripcion) { y += 3; y = sub('INFORMACIÓN ADICIONAL:', y); y = wrap(conv.descripcion, margin, y, cw); }
      y += 6; y = sub('INSTRUCCIONES:', y);
      ['Registrarse a través de la plataforma oficial del IVD.', 'Presentar la convocatoria oficial el día del evento.',
        'Llegar con 30 minutos de anticipación.'].forEach(t => { y = wrap(`• ${t}`, margin, y, cw); y += 2; });

      y += 8; doc.setDrawColor(200, 200, 200); doc.line(margin, y, pw - margin, y); y += 6;
      doc.setFontSize(8); doc.setTextColor(100, 100, 100);
      doc.text('Convocatoria oficial emitida por el Instituto Veracruzano del Deporte.', pw / 2, y, { align: 'center' });
      doc.save(`Convocatoria_${conv.titulo || 'evento'}.pdf`);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Error al generar PDF: ${error.message}`, confirmButtonColor: BURGUNDY });
    }
  };

  const convocatoriasPaginadas = convocatorias.slice((page - 1) * porPagina, page * porPagina);

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
          Convocatorias Disponibles
        </Typography>
        <Typography variant="body1" sx={{ color: PURPLE, textAlign: 'center', mb: 4, opacity: .8 }}>
          Convocatorias disponibles para tu categoría y género
        </Typography>

        {errorMessage && (
          <Alert severity={errorMessage.includes('exitosa') ? 'success' : 'error'}
            onClose={() => setErrorMessage('')} sx={{ mb: 3, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {/* ── Tabla ── */}
        {convocatorias.length === 0 && !errorMessage ? (
          <Paper sx={{ borderRadius: 3, textAlign: 'center', py: 6, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <Avatar sx={{ bgcolor: `${PURPLE}14`, width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <EventIcon sx={{ fontSize: 32, color: PURPLE }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: PURPLE }}>Sin convocatorias disponibles</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: .5 }}>
              Las convocatorias aparecerán aquí cuando haya eventos para tu categoría
            </Typography>
          </Paper>
        ) : convocatorias.length > 0 && (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: `${BURGUNDY}08` }}>
                  {['Evento', 'Disciplina', 'Categoría', 'Fecha', 'Estado', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: BURGUNDY, py: 2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {convocatoriasPaginadas.map((conv, i) => {
                  const abierta = inscripcionAbierta(conv);
                  const inscrito = estaInscrito(conv);

                  return (
                    <TableRow key={conv.convocatoria_id || conv.id || i} hover sx={{ '&:hover': { bgcolor: `${CREAM}66` } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: BURGUNDY, width: 36, height: 36 }}>
                            <EventIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                              {conv.titulo}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center', gap: .5 }}>
                              <LocationIcon sx={{ fontSize: 12 }} /> {conv.lugar}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                          <SportsIcon sx={{ fontSize: 14, color: BURGUNDY }} />
                          {conv.disciplina}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={conv.categoria} size="small"
                          sx={{ bgcolor: `${PURPLE}14`, color: PURPLE, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtCorta(conv.fecha)}</Typography>
                        {conv.hora && (
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {String(conv.hora).slice(0, 5)} hrs
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {inscrito ? (
                          <Chip icon={<CheckIcon />} label="Inscrito" color="success" size="small" sx={{ fontWeight: 600 }} />
                        ) : abierta ? (
                          <Chip label="Abierta" color="primary" size="small" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip label="Cerrada" color="error" size="small" sx={{ fontWeight: 600 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: .5, alignItems: 'center' }}>
                          <IconButton size="small" onClick={() => handleDescargarPDF(conv)}
                            sx={{ color: BURGUNDY, '&:hover': { bgcolor: `${BURGUNDY}08` } }}
                            title="Descargar PDF">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          {!inscrito && abierta && (
                            <Button size="small" variant="contained" onClick={() => handleInscribirse(conv)}
                              disabled={inscribiendo} startIcon={<RegisterIcon />}
                              sx={{
                                bgcolor: GREEN, textTransform: 'none', fontWeight: 600, fontSize: '.75rem',
                                '&:hover': { bgcolor: '#1B5E20' },
                              }}>
                              Inscribirme
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {convocatorias.length > porPagina && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #eee' }}>
                <Pagination count={Math.ceil(convocatorias.length / porPagina)}
                  page={page} onChange={(e, v) => setPage(v)}
                  sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: BURGUNDY, color: '#fff' } }} />
              </Box>
            )}
          </Paper>
        )}
      </Container>

      {/* ── Confirmar Inscripción ── */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: GREEN, width: 36, height: 36 }}>
                <RegisterIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: BURGUNDY, fontWeight: 700 }}>
                Confirmar Inscripción
              </Typography>
            </Box>
            <IconButton onClick={() => setModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {convocatoriaSeleccionada && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="body1" sx={{ color: '#555' }}>
                ¿Deseas inscribirte a esta convocatoria?
              </Typography>

              {/* Datos del atleta */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${BURGUNDY}14`, width: 32, height: 32 }}>
                    <PersonIcon sx={{ fontSize: 18, color: BURGUNDY }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: BURGUNDY, fontWeight: 700 }}>
                    Tus Datos
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, pl: 5.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Nombre</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user?.nombre} {user?.apellido_paterno} {user?.apellido_materno}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>CURP</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.curp}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Género</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.genero}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Edad</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {calcularEdad(user?.fecha_nacimiento)} años
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Datos de la convocatoria */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${GREEN}14`, width: 32, height: 32 }}>
                    <SportsIcon sx={{ fontSize: 18, color: GREEN }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ color: GREEN, fontWeight: 700 }}>
                    Convocatoria
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, pl: 5.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Evento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{convocatoriaSeleccionada.titulo}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Disciplina</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{convocatoriaSeleccionada.disciplina}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Categoría</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{convocatoriaSeleccionada.categoria}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>Fecha</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(convocatoriaSeleccionada.fecha)}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" sx={{ color: '#888' }}>Lugar</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{convocatoriaSeleccionada.lugar}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined"
            sx={{ color: PURPLE, borderColor: PURPLE, textTransform: 'none', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmarInscripcion} variant="contained" disabled={inscribiendo}
            sx={{ bgcolor: GREEN, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#1B5E20' } }}>
            {inscribiendo ? 'Procesando...' : 'Confirmar Inscripción'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConvocatoriasAtleta;