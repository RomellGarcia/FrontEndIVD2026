import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, Button, Alert, CircularProgress, Chip,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
  FormControlLabel, Switch, IconButton,
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Autorenew as ReplaceIcon,
  EmojiEvents as TrophyIcon,
  Event as EventIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { eventosAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import Swal from 'sweetalert2';

const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
};

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

// Los PDF los abre el navegador solo; Word/Excel pasan por el visor
// público de Google Docs, que los muestra sin necesidad de descargarlos.
const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

const GestionResultados = () => {
  const { user } = useAuth();
  const [tabActivo, setTabActivo] = useState('subir');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState('');
  const [convocatorias, setConvocatorias] = useState([]);
  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(false);
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [subiendoId, setSubiendoId] = useState(null);

  const fileInputRef = useRef(null);
  const convocatoriaObjetivoRef = useRef(null);

  useEffect(() => {
    cargarEventos();
  }, [user]);

  useEffect(() => {
    setSoloPendientes(tabActivo === 'subir');
  }, [tabActivo]);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      const response = await eventosAPI.getAll({ todos: true });
      const data = response.data.eventos || response.data || [];
      setEventos(data);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      setError('Error al cargar los eventos.');
    } finally {
      setLoading(false);
    }
  };

  const cargarConvocatorias = async (eventoId) => {
    if (!eventoId) { setConvocatorias([]); return; }
    try {
      setCargandoConvocatorias(true);
      const response = await eventosAPI.getConvocatoriasByEvento(eventoId);
      setConvocatorias(response.data.convocatorias || []);
    } catch (err) {
      console.error('Error al cargar convocatorias:', err);
      setError('Error al cargar las convocatorias de este evento.');
    } finally {
      setCargandoConvocatorias(false);
    }
  };

  const handleSeleccionarEvento = (id) => {
    setEventoSeleccionadoId(id);
    cargarConvocatorias(id);
  };

  const handleAbrirSelectorArchivo = (convocatoriaId) => {
    convocatoriaObjetivoRef.current = convocatoriaId;
    fileInputRef.current?.click();
  };

  const handleArchivoSeleccionado = async (e) => {
    const file = e.target.files?.[0];
    const convocatoriaId = convocatoriaObjetivoRef.current;
    if (!file || !convocatoriaId) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['doc', 'docx', 'xls', 'xlsx', 'pdf'].includes(extension)) {
      Swal.fire({ icon: 'error', title: 'Formato no soportado', text: 'Solo se aceptan archivos Word, Excel o PDF.', confirmButtonColor: COLORS.burgundy });
      e.target.value = '';
      return;
    }

    setSubiendoId(convocatoriaId);
    try {
      const formData = new FormData();
      formData.append('documentoResultado', file);
      await eventosAPI.subirResultadoConvocatoria(convocatoriaId, formData);
      await cargarConvocatorias(eventoSeleccionadoId);
      Swal.fire({ icon: 'success', title: 'Resultado subido', confirmButtonColor: COLORS.burgundy, timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('Error al subir resultado:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'No se pudo subir el archivo.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setSubiendoId(null);
      e.target.value = '';
      convocatoriaObjetivoRef.current = null;
    }
  };

  const handleEliminarResultado = async (convocatoria) => {
    const confirm = await Swal.fire({
      title: '¿Quitar este documento de resultados?',
      text: `${convocatoria.disciplina} - ${convocatoria.categoria}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: COLORS.burgundy,
      cancelButtonColor: COLORS.purple,
      confirmButtonText: 'Sí, quitarlo',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    try {
      await eventosAPI.eliminarResultadoConvocatoria(convocatoria.id);
      await cargarConvocatorias(eventoSeleccionadoId);
      Swal.fire({ icon: 'success', title: 'Documento eliminado', confirmButtonColor: COLORS.burgundy, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el documento.', confirmButtonColor: COLORS.burgundy });
    }
  };

  const textoGenero = (g) => {
    const v = (g || '').toLowerCase();
    if (v === 'masculino') return 'Masculino';
    if (v === 'femenino') return 'Femenino';
    if (v === 'mixto') return 'Mixto';
    return g || 'N/A';
  };

  const convocatoriasFiltradas = soloPendientes
    ? convocatorias.filter((c) => !c.documentoResultado)
    : convocatorias;

  const totalConEventoSeleccionado = convocatorias.length;
  const totalConResultado = convocatorias.filter((c) => c.documentoResultado).length;
  const totalPendientes = totalConEventoSeleccionado - totalConResultado;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: COLORS.cream }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      <input ref={fileInputRef} type="file" accept=".doc,.docx,.xls,.xlsx,.pdf" hidden onChange={handleArchivoSeleccionado} />

      {/* ── Franja de bienvenida ── */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center', px: { xs: 2, md: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel Administrativo
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Gestión de Resultados
          </Typography>
          <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
            Sube el documento de resultados de cada convocatoria
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 }, pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 7 } }}>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError('')}>{error}</Alert>}

        {/* ── Pestañas ── */}
        <Box sx={{ mb: 3, borderBottom: `1px solid ${COLORS.line}` }}>
          <Tabs
            value={tabActivo}
            onChange={(e, v) => setTabActivo(v)}
            sx={{ '& .MuiTabs-indicator': { backgroundColor: COLORS.burgundy, height: 3 } }}
          >
            <Tab icon={<UploadFileIcon />} iconPosition="start" label="Subir Resultados" value="subir"
              sx={{ fontWeight: 700, color: COLORS.purple, '&.Mui-selected': { color: COLORS.burgundy } }} />
            <Tab icon={<ListAltIcon />} iconPosition="start" label="Ver Eventos y Resultados" value="ver"
              sx={{ fontWeight: 700, color: COLORS.purple, '&.Mui-selected': { color: COLORS.burgundy } }} />
          </Tabs>
        </Box>

        {/* ── Selector de evento ── */}
        <Box sx={{ ...cardSx, p: 3, mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Evento</InputLabel>
            <Select
              label="Evento"
              value={eventoSeleccionadoId}
              onChange={(e) => handleSeleccionarEvento(e.target.value)}
            >
              <MenuItem value="">Selecciona un evento</MenuItem>
              {eventos.map((ev) => (
                <MenuItem key={ev.id} value={ev.id}>
                  {ev.titulo} {!ev.estado && '(cerrado)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {!eventoSeleccionadoId ? (
          <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
            <EventIcon sx={{ fontSize: 40, color: COLORS.purple, mb: 1 }} />
            <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
              Selecciona un evento para ver sus convocatorias
            </Typography>
          </Box>
        ) : cargandoConvocatorias ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: COLORS.burgundy }} />
          </Box>
        ) : (
          <>
            {/* ── Stat-strip del evento seleccionado ── */}
            <Box sx={{ ...cardSx, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden', mb: 3 }}>
              {[
                { icon: <ListAltIcon sx={{ fontSize: 22 }} />, value: totalConEventoSeleccionado, label: 'Convocatorias', accent: COLORS.burgundy },
                { icon: <CheckIcon sx={{ fontSize: 22 }} />, value: totalConResultado, label: 'Con resultado', accent: COLORS.purple },
                { icon: <PendingIcon sx={{ fontSize: 22 }} />, value: totalPendientes, label: 'Pendientes', accent: COLORS.burgundy },
              ].map((s, i) => (
                <Box key={i} sx={{ p: 2.5, textAlign: 'center', borderRight: i < 2 ? `1px solid ${COLORS.line}` : 'none' }}>
                  <Box sx={{ color: s.accent, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{s.icon}</Box>
                  <Typography sx={{ fontWeight: 800, color: COLORS.ink, fontSize: '1.5rem' }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: COLORS.ink, fontWeight: 700 }}>{s.label}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <FormControlLabel
                control={<Switch checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.burgundy }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.burgundy } }} />}
                label={<Typography variant="body2" sx={{ color: COLORS.ink }}>Mostrar solo pendientes</Typography>}
              />
            </Box>

            {/* ── Lista de convocatorias ── */}
            {convocatoriasFiltradas.length === 0 ? (
              <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
                <TrophyIcon sx={{ fontSize: 40, color: COLORS.purple, mb: 1 }} />
                <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
                  {soloPendientes ? '¡Todas las convocatorias ya tienen resultado!' : 'Este evento no tiene convocatorias'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {convocatoriasFiltradas.map((conv) => (
                  <Box
                    key={conv.id}
                    sx={{
                      ...cardSx, p: 2.5,
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 220 }}>
                      <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{conv.disciplina}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={conv.categoria} size="small" sx={{ border: `1px solid ${COLORS.purple}`, bgcolor: 'transparent', color: COLORS.purple }} />
                        <Chip label={textoGenero(conv.genero)} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                        {conv.edadMin != null && conv.edadMax != null && (
                          <Chip label={`${conv.edadMin}-${conv.edadMax} años`} size="small" sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.ink }} />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      {conv.documentoResultado ? (
                        <>
                          <Chip icon={<CheckIcon sx={{ fontSize: 16 }} />} label="Resultado subido" size="small" sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }} />
                          <IconButton size="small" onClick={() => abrirDocumentoParaVer(conv.documentoResultado)} sx={{ color: COLORS.burgundy }} title="Ver documento">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleAbrirSelectorArchivo(conv.id)} sx={{ color: COLORS.purple }} title="Reemplazar documento" disabled={subiendoId === conv.id}>
                            {subiendoId === conv.id ? <CircularProgress size={18} /> : <ReplaceIcon fontSize="small" />}
                          </IconButton>
                          <IconButton size="small" onClick={() => handleEliminarResultado(conv)} sx={{ color: '#A13A3A' }} title="Eliminar documento">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <Chip icon={<PendingIcon sx={{ fontSize: 16 }} />} label="Sin resultado" size="small" sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={subiendoId === conv.id ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <UploadFileIcon />}
                            onClick={() => handleAbrirSelectorArchivo(conv.id)}
                            disabled={subiendoId === conv.id}
                            sx={{ bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                          >
                            {subiendoId === conv.id ? 'Subiendo...' : 'Subir resultado'}
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default GestionResultados;