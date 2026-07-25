import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, Button, Alert, CircularProgress, Chip, Avatar,
  FormControlLabel, Switch, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Event as EventIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Download as DownloadIcon,
  TableChart as TableChartIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { eventosAPI, resultadosAPI } from '../../api/index.js';
import { useAuth } from '../../components/common/AuthContext.jsx';
import Swal from 'sweetalert2';

// Paleta de colores institucional
const COLORS = {
  burgundy: '#800020', burgundyDark: '#5C0017', purple: '#7A4069',
  cream: '#e4e4e5', paper: '#FFFFFF', ink: '#2B1E1E',
  line: 'rgba(128,0,32,0.18)', lineSoft: 'rgba(128,0,32,0.08)',
  gold: '#B8860B', silver: '#8a8a8a', bronze: '#A15C2E',
};

const cardSx = { bgcolor: COLORS.paper, borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)' };

// Disciplinas que se miden por distancia (marca) vs tiempo
const DISCIPLINAS_DISTANCIA = new Set([
  'Salto de longitud',
  'Salto de altura',
  'Lanzamiento de bala',
  'Lanzamiento de disco',
  'Lanzamiento de jabalina',
]);

const esDisciplinaDeDistancia = (disciplina) => DISCIPLINAS_DISTANCIA.has((disciplina || '').trim());

// Devuelve el texto legible para el género
const textoGenero = (genero) => {
  const v = (genero || '').toLowerCase().trim();
  if (v === 'masculino') return 'Masculino';
  if (v === 'femenino') return 'Femenino';
  if (v === 'mixto') return 'Mixto';
  return genero || 'N/A';
};

// Obtiene el nombre completo de un participante
const nombreCompleto = (persona) => [persona.nombre, persona.apellido_paterno, persona.apellido_materno].filter(Boolean).join(' ');

// Formatea fecha en formato corto
const formatearFechaCorta = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Genera un slug a partir de un texto
const generarSlug = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');

// Chip que muestra la posición con color según medalla
const ChipPosicion = ({ posicion }) => {
  if (!posicion) return <Typography variant="body2" sx={{ color: COLORS.purple }}>—</Typography>;
  const estilos = {
    1: { bgcolor: COLORS.gold, color: '#fff' },
    2: { bgcolor: COLORS.silver, color: '#fff' },
    3: { bgcolor: COLORS.bronze, color: '#fff' },
  };
  const sx = estilos[posicion] || { bgcolor: COLORS.lineSoft, color: COLORS.ink };
  return (
    <Chip
      icon={posicion <= 3 ? <TrophyIcon sx={{ fontSize: 15, color: 'inherit !important' }} /> : undefined}
      label={`${posicion}°`}
      size="small"
      sx={{ ...sx, fontWeight: 800, minWidth: 46 }}
    />
  );
};

const GestionResultados = () => {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [convocatorias, setConvocatorias] = useState([]);
  const [resultadosPorConvocatoria, setResultadosPorConvocatoria] = useState({});
  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(false);
  const [mostrarSoloPendientes, setMostrarSoloPendientes] = useState(false);

  const [generandoPlantillaId, setGenerandoPlantillaId] = useState(null);
  const [subiendoExcelId, setSubiendoExcelId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [finalizandoId, setFinalizandoId] = useState(null);

  const [modalResultadosAbierto, setModalResultadosAbierto] = useState(false);
  const [convocatoriaVista, setConvocatoriaVista] = useState(null);

  const inputExcelRef = useRef(null);
  const convocatoriaExcelRef = useRef(null);

  useEffect(() => {
    cargarEventos();
  }, [user]);

  // Carga la lista de eventos desde el backend
  const cargarEventos = async () => {
    try {
      setCargando(true);
      const response = await eventosAPI.getAll({ todos: true });
      const data = response.data.eventos || response.data || [];
      setEventos(data);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      setError('Error al cargar los eventos.');
    } finally {
      setCargando(false);
    }
  };

  // Carga las convocatorias de un evento y sus resultados
  const cargarConvocatorias = async (eventoId) => {
    setCargandoConvocatorias(true);
    setResultadosPorConvocatoria({});
    try {
      const response = await eventosAPI.getConvocatoriasByEvento(eventoId);
      const lista = response.data.convocatorias || [];
      setConvocatorias(lista);

      const entradas = await Promise.all(
        lista.map(async (c) => {
          try {
            const r = await resultadosAPI.getByConvocatoria(c.id);
            return [c.id, r.data.resultados || []];
          } catch {
            return [c.id, []];
          }
        })
      );
      setResultadosPorConvocatoria(Object.fromEntries(entradas));
    } catch (err) {
      console.error('Error al cargar convocatorias:', err);
      setError('Error al cargar las convocatorias de este evento.');
    } finally {
      setCargandoConvocatorias(false);
    }
  };

  // Selecciona un evento para gestionar sus resultados
  const manejarSeleccionarEvento = (evento) => {
    setEventoSeleccionado(evento);
    cargarConvocatorias(evento.id);
  };

  // Vuelve a la lista de eventos
  const manejarCambiarEvento = () => {
    setEventoSeleccionado(null);
    setConvocatorias([]);
    setResultadosPorConvocatoria({});
  };

  // Descarga la plantilla Excel para una convocatoria
  const manejarDescargarPlantilla = async (convocatoria) => {
    setGenerandoPlantillaId(convocatoria.id);
    try {
      const response = await eventosAPI.getParticipantesPorConvocatoria(convocatoria.id);
      const participantes = (response.data.participantes || []).filter((p) => p.validado);

      if (participantes.length === 0) {
        Swal.fire({ icon: 'info', title: 'Sin atletas validados', text: 'Esta convocatoria todavía no tiene inscripciones validadas.', confirmButtonColor: COLORS.burgundy });
        return;
      }

      const sinBib = participantes.filter((p) => !p.bib);
      if (sinBib.length > 0) {
        Swal.fire({
          icon: 'warning', title: 'Hay atletas sin Bib asignado',
          text: `${sinBib.length} atleta(s) validado(s) todavía no tienen número de corredor. Se incluyen en la plantilla, pero revísalo antes de la carrera.`,
          confirmButtonColor: COLORS.burgundy,
        });
      }

      const esDistancia = esDisciplinaDeDistancia(convocatoria.disciplina);

      const filas = participantes
        .slice()
        .sort((a, b) => (a.bib ?? 9999) - (b.bib ?? 9999))
        .map((p) => (
          esDistancia
            ? { 'Pl.': '', Bib: p.bib ? String(p.bib).padStart(3, '0') : '', Nombre: nombreCompleto(p), Club: p.club_nombre || 'Libre', Marca: '' }
            : { 'Pl.': '', Bib: p.bib ? String(p.bib).padStart(3, '0') : '', Nombre: nombreCompleto(p), Club: p.club_nombre || 'Libre', ChipTime: '', GunTime: '' }
        ));

      const headers = esDistancia
        ? ['Pl.', 'Bib', 'Nombre', 'Club', 'Marca']
        : ['Pl.', 'Bib', 'Nombre', 'Club', 'ChipTime', 'GunTime'];

      const ws = XLSX.utils.json_to_sheet(filas, { header: headers });
      const colsAncho = esDistancia
        ? [{ wch: 6 }, { wch: 8 }, { wch: 30 }, { wch: 22 }, { wch: 14 }]
        : [{ wch: 6 }, { wch: 8 }, { wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 12 }];
      ws['!cols'] = colsAncho;

      const wb = XLSX.utils.book_new();
      const nombreHoja = `${convocatoria.disciplina} ${convocatoria.categoria}`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, nombreHoja || 'Resultados');
      XLSX.writeFile(wb, `plantilla_${generarSlug(convocatoria.disciplina)}_${generarSlug(convocatoria.categoria)}.xlsx`);
    } catch (err) {
      console.error('Error al generar la plantilla:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar la plantilla.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setGenerandoPlantillaId(null);
    }
  };

  // Abre el selector de archivo Excel para subir resultados
  const manejarAbrirSelectorExcel = (convocatoriaId) => {
    convocatoriaExcelRef.current = convocatoriaId;
    inputExcelRef.current?.click();
  };

  // Procesa el archivo Excel seleccionado y guarda los resultados
  const manejarExcelSeleccionado = async (e) => {
    const file = e.target.files?.[0];
    const convocatoriaId = convocatoriaExcelRef.current;
    if (!file || !convocatoriaId) return;

    const conv = convocatorias.find((c) => c.id === convocatoriaId);
    const esDistancia = esDisciplinaDeDistancia(conv?.disciplina);

    setSubiendoExcelId(convocatoriaId);
    try {
      const participantesResp = await eventosAPI.getParticipantesPorConvocatoria(convocatoriaId);
      const participantes = participantesResp.data.participantes || [];
      const bibAAtletaId = new Map(
        participantes.filter((p) => p.bib != null).map((p) => [String(p.bib).replace(/^0+/, '') || '0', p.atleta_id])
      );

      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const hoja = wb.Sheets[wb.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });

      const bibsSinCoincidencia = [];
      const atletas = [];
      for (const fila of filas) {
        const bibTexto = String(fila.Bib ?? '').trim().replace(/^0+/, '') || '0';
        if (bibTexto === '0' && !String(fila.Bib ?? '').trim()) continue;
        const atletaId = bibAAtletaId.get(bibTexto);
        if (!atletaId) { bibsSinCoincidencia.push(fila.Bib); continue; }

        const pruebas = [];
        if (esDistancia) {
          const marca = String(fila.Marca ?? '').trim();
          if (!marca) continue;
          pruebas.push({ nombre: 'Marca', marca });
        } else {
          const chipTime = String(fila.ChipTime ?? '').trim();
          const gunTime = String(fila.GunTime ?? '').trim();
          if (!chipTime && !gunTime) continue;
          if (chipTime) pruebas.push({ nombre: 'ChipTime', marca: chipTime });
          if (gunTime) pruebas.push({ nombre: 'GunTime', marca: gunTime });
        }
        atletas.push({ atleta_id: atletaId, pruebas });
      }

      if (bibsSinCoincidencia.length > 0) {
        console.warn('Bibs en el archivo que no coinciden con ningún atleta de esta convocatoria:', bibsSinCoincidencia);
      }

      if (atletas.length === 0) {
        Swal.fire({
          icon: 'warning', title: 'Nada que guardar',
          text: esDistancia
            ? 'No se encontró ninguna Marca llenada en el archivo, o los Bib no coinciden con los de esta convocatoria.'
            : 'No se encontró ningún ChipTime o GunTime llenado en el archivo, o los Bib no coinciden con los de esta convocatoria.',
          confirmButtonColor: COLORS.burgundy,
        });
        return;
      }

      const response = await resultadosAPI.crearMasivo({ convocatoria_id: convocatoriaId, atletas });
      const nuevos = await resultadosAPI.getByConvocatoria(convocatoriaId);
      setResultadosPorConvocatoria((prev) => ({ ...prev, [convocatoriaId]: nuevos.data.resultados || [] }));

      const advertencia = bibsSinCoincidencia.length > 0 ? ` (${bibsSinCoincidencia.length} fila(s) con Bib no reconocido se ignoraron)` : '';
      Swal.fire({ icon: 'success', title: `${response.data.ids?.length || atletas.length} resultados guardados${advertencia}`, confirmButtonColor: COLORS.burgundy });
    } catch (err) {
      console.error('Error al leer/guardar el Excel de resultados:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'No se pudo leer o guardar el archivo. Verifica que sea la plantilla descargada desde aquí.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setSubiendoExcelId(null);
      e.target.value = '';
      convocatoriaExcelRef.current = null;
    }
  };

  // Abre el modal con los resultados detallados de una convocatoria
  const manejarVerResultados = (convocatoria) => {
    setConvocatoriaVista(convocatoria);
    setModalResultadosAbierto(true);
  };

  // Cierra el modal de resultados
  const manejarCerrarModalResultados = () => {
    setModalResultadosAbierto(false);
    setConvocatoriaVista(null);
  };

  // Elimina todos los resultados de una convocatoria
  const manejarEliminarResultados = async (convocatoria) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar los resultados de esta convocatoria?',
      text: `${convocatoria.disciplina} - ${convocatoria.categoria} — se borran las marcas de todos los atletas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: COLORS.burgundy,
      cancelButtonColor: COLORS.purple,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    setEliminandoId(convocatoria.id);
    try {
      await resultadosAPI.removeByConvocatoria(convocatoria.id);
      setResultadosPorConvocatoria((prev) => ({ ...prev, [convocatoria.id]: [] }));
      Swal.fire({ icon: 'success', title: 'Resultados eliminados', confirmButtonColor: COLORS.burgundy, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron eliminar los resultados.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setEliminandoId(null);
    }
  };

  // Finaliza o reabre una convocatoria (cierra/abre inscripciones)
  const manejarFinalizarConvocatoria = async (convocatoria, finalizar) => {
    const confirm = await Swal.fire({
      title: finalizar ? '¿Finalizar esta convocatoria?' : '¿Reabrir esta convocatoria?',
      text: finalizar
        ? `${convocatoria.disciplina} - ${convocatoria.categoria} dejará de aparecer como disponible para los atletas. No se borra ningún dato.`
        : `${convocatoria.disciplina} - ${convocatoria.categoria} volverá a aparecer como disponible para los atletas.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: COLORS.burgundy,
      cancelButtonColor: COLORS.purple,
      confirmButtonText: finalizar ? 'Sí, finalizar' : 'Sí, reabrir',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    setFinalizandoId(convocatoria.id);
    try {
      await eventosAPI.finalizarConvocatoria(convocatoria.id, finalizar);
      setConvocatorias((prev) => prev.map((c) => (c.id === convocatoria.id ? { ...c, estado: !finalizar } : c)));
      Swal.fire({ icon: 'success', title: finalizar ? 'Convocatoria finalizada' : 'Convocatoria reabierta', confirmButtonColor: COLORS.burgundy, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el estado de la convocatoria.', confirmButtonColor: COLORS.burgundy });
    } finally {
      setFinalizandoId(null);
    }
  };

  const convocatoriasFiltradas = mostrarSoloPendientes
    ? convocatorias.filter((c) => (resultadosPorConvocatoria[c.id] || []).length === 0)
    : convocatorias;

  const totalConvocatorias = convocatorias.length;
  const totalConResultados = convocatorias.filter((c) => (resultadosPorConvocatoria[c.id] || []).length > 0).length;
  const totalPendientes = totalConvocatorias - totalConResultados;

  if (cargando) {
    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} sx={{ color: COLORS.burgundy }} />
      </Box>
    );
  }

  const resultadosOrdenados = convocatoriaVista
    ? [...(resultadosPorConvocatoria[convocatoriaVista.id] || [])].sort((a, b) => {
        if (a.posicion === null) return 1;
        if (b.posicion === null) return -1;
        return (a.posicion ?? 999) - (b.posicion ?? 999);
      })
    : [];
  const esDistanciaVista = convocatoriaVista ? esDisciplinaDeDistancia(convocatoriaVista.disciplina) : false;

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh' }}>
      <input ref={inputExcelRef} type="file" accept=".xlsx,.xls" hidden onChange={manejarExcelSeleccionado} />

      {/* Cabecera superior */}
      <Box sx={{ bgcolor: COLORS.burgundy, color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
          {eventoSeleccionado && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={manejarCambiarEvento}
              sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Cambiar evento
            </Button>
          )}
          <Box sx={{ textAlign: eventoSeleccionado ? 'left' : 'center' }}>
            <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              IVD · Panel Administrativo
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
              {eventoSeleccionado ? eventoSeleccionado.titulo : 'Gestión de Resultados'}
            </Typography>
            <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
              {eventoSeleccionado
                ? 'Descarga la plantilla, llénala y súbela para registrar los resultados'
                : 'Selecciona un evento para gestionar sus resultados'}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 }, pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 7 } }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError('')}>{error}</Alert>}

        {!eventoSeleccionado ? (
          eventos.length === 0 ? (
            <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
              <EventIcon sx={{ fontSize: 40, color: COLORS.purple, mb: 1 }} />
              <Typography sx={{ color: COLORS.purple, fontWeight: 700 }}>No hay eventos creados todavía</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
              {eventos.map((ev) => (
                <Box
                  key={ev.id}
                  onClick={() => manejarSeleccionarEvento(ev)}
                  sx={{
                    ...cardSx, cursor: 'pointer', overflow: 'hidden',
                    transition: 'transform .15s, box-shadow .15s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)' },
                  }}
                >
                  {ev.imagen_url ? (
                    <Box component="img" src={ev.imagen_url} alt={ev.titulo} sx={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: COLORS.lineSoft }}>
                      <EventIcon sx={{ fontSize: 42, color: COLORS.purple }} />
                    </Box>
                  )}
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: COLORS.ink, mb: 0.5 }}>{ev.titulo}</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {formatearFechaCorta(ev.fecha)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.purple, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 13 }} /> {ev.lugar}
                    </Typography>
                    {!ev.estado && (
                      <Chip label="Cerrado" size="small" sx={{ mt: 1, bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )
        ) : cargandoConvocatorias ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: COLORS.burgundy }} />
          </Box>
        ) : (
          <>
            <Box sx={{ ...cardSx, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden', mb: 3 }}>
              {[
                { icon: <TrophyIcon sx={{ fontSize: 22 }} />, value: totalConvocatorias, label: 'Convocatorias', accent: COLORS.burgundy },
                { icon: <CheckIcon sx={{ fontSize: 22 }} />, value: totalConResultados, label: 'Con resultados', accent: COLORS.purple },
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
                control={<Switch checked={mostrarSoloPendientes} onChange={(e) => setMostrarSoloPendientes(e.target.checked)}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.burgundy }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.burgundy } }} />}
                label={<Typography variant="body2" sx={{ color: COLORS.ink }}>Mostrar solo pendientes</Typography>}
              />
            </Box>

            {convocatoriasFiltradas.length === 0 ? (
              <Box sx={{ ...cardSx, textAlign: 'center', py: 6 }}>
                <TrophyIcon sx={{ fontSize: 40, color: COLORS.purple, mb: 1 }} />
                <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 700 }}>
                  {mostrarSoloPendientes ? '¡Todas las convocatorias ya tienen resultados!' : 'Este evento no tiene convocatorias'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {convocatoriasFiltradas.map((conv) => {
                  const resultados = resultadosPorConvocatoria[conv.id] || [];
                  const yaTiene = resultados.length > 0;
                  const esDistancia = esDisciplinaDeDistancia(conv.disciplina);
                  const finalizada = conv.estado === false;
                  return (
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
                          <Chip
                            label={esDistancia ? 'Por distancia' : 'Por tiempo'}
                            size="small"
                            sx={{ border: `1px solid ${COLORS.line}`, bgcolor: 'transparent', color: COLORS.purple, fontStyle: 'italic' }}
                          />
                          {finalizada && (
                            <Chip icon={<LockIcon sx={{ fontSize: 14 }} />} label="Finalizada" size="small" sx={{ bgcolor: COLORS.burgundy, color: '#fff', fontWeight: 700 }} />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={generandoPlantillaId === conv.id ? <CircularProgress size={16} sx={{ color: COLORS.burgundy }} /> : <DownloadIcon />}
                          onClick={() => manejarDescargarPlantilla(conv)}
                          disabled={generandoPlantillaId === conv.id}
                          sx={{ color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: COLORS.burgundyDark, bgcolor: COLORS.lineSoft } }}
                        >
                          Descargar plantilla
                        </Button>

                        <Button
                          variant={yaTiene ? 'outlined' : 'contained'}
                          size="small"
                          startIcon={subiendoExcelId === conv.id ? <CircularProgress size={16} sx={{ color: yaTiene ? COLORS.purple : '#fff' }} /> : <TableChartIcon />}
                          onClick={() => manejarAbrirSelectorExcel(conv.id)}
                          disabled={subiendoExcelId === conv.id || finalizada}
                          sx={yaTiene
                            ? { color: COLORS.purple, borderColor: COLORS.purple, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }
                            : { bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                        >
                          {subiendoExcelId === conv.id ? 'Guardando...' : (yaTiene ? 'Reemplazar resultados' : 'Subir Excel de resultados')}
                        </Button>

                        {yaTiene ? (
                          <>
                            <Chip icon={<CheckIcon sx={{ fontSize: 16 }} />} label={`${resultados.length} resultados`} size="small" sx={{ bgcolor: COLORS.lineSoft, color: COLORS.burgundy, fontWeight: 700 }} />
                            <IconButton size="small" onClick={() => manejarVerResultados(conv)} sx={{ color: COLORS.burgundy }} title="Ver resultados">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => manejarEliminarResultados(conv)} sx={{ color: '#A13A3A' }} title="Eliminar resultados" disabled={eliminandoId === conv.id || finalizada}>
                              {eliminandoId === conv.id ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                            </IconButton>
                            <Button
                              size="small"
                              variant={finalizada ? 'outlined' : 'contained'}
                              startIcon={finalizandoId === conv.id ? <CircularProgress size={16} sx={{ color: finalizada ? COLORS.burgundy : '#fff' }} /> : (finalizada ? <LockOpenIcon /> : <LockIcon />)}
                              onClick={() => manejarFinalizarConvocatoria(conv, !finalizada)}
                              disabled={finalizandoId === conv.id}
                              sx={finalizada
                                ? { color: COLORS.burgundy, borderColor: COLORS.burgundy, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: COLORS.lineSoft } }
                                : { bgcolor: COLORS.burgundy, '&:hover': { bgcolor: COLORS.burgundyDark }, textTransform: 'none', fontWeight: 700 }}
                            >
                              {finalizada ? 'Reabrir' : 'Finalizar convocatoria'}
                            </Button>
                          </>
                        ) : (
                          <Chip icon={<PendingIcon sx={{ fontSize: 16 }} />} label="Sin resultados" size="small" sx={{ bgcolor: 'transparent', border: `1px solid ${COLORS.line}`, color: COLORS.ink }} />
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Modal para ver resultados detallados */}
      <Dialog open={modalResultadosAbierto} onClose={manejarCerrarModalResultados} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.burgundy, color: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Resultados</Typography>
              {convocatoriaVista && (
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{convocatoriaVista.disciplina} - {convocatoriaVista.categoria}</Typography>
              )}
            </Box>
            <IconButton onClick={manejarCerrarModalResultados} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: COLORS.lineSoft }}>
                <TableCell sx={{ fontWeight: 700, color: COLORS.ink, width: 60 }}>Lugar</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.ink, width: 60 }}>Bib</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>Atleta</TableCell>
                {esDistanciaVista ? (
                  <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>Marca</TableCell>
                ) : (
                  <>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>ChipTime</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.ink }}>GunTime</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {resultadosOrdenados.map((r) => {
                const marca = r.pruebas?.find((p) => p.nombre === 'Marca')?.marca;
                const chip = r.pruebas?.find((p) => p.nombre === 'ChipTime')?.marca;
                const gun = r.pruebas?.find((p) => p.nombre === 'GunTime')?.marca;
                return (
                  <TableRow key={r.id}>
                    <TableCell><ChipPosicion posicion={r.posicion} /></TableCell>
                    <TableCell>{r.bib ? String(r.bib).padStart(3, '0') : '—'}</TableCell>
                    <TableCell>{nombreCompleto(r)}</TableCell>
                    {esDistanciaVista ? (
                      <TableCell>{marca || '—'}</TableCell>
                    ) : (
                      <>
                        <TableCell>{chip || '—'}</TableCell>
                        <TableCell>{gun || '—'}</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={manejarCerrarModalResultados} sx={{ color: COLORS.purple, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionResultados;