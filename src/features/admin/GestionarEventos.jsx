import { perfilEmpresaAPI, eventosAPI, catalogosAPI, STATIC_BASE_URL } from '../../api/index.js';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import GestureIcon from '@mui/icons-material/Gesture';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import ShieldIcon from '@mui/icons-material/Shield';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CampaignIcon from '@mui/icons-material/Campaign';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import { 
  CircularProgress, 
  Typography, 
  Button, 
  Box, 
  Card, 
  CardContent, 
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  IconButton as MuiIconButton,
  Tooltip,
  Alert,
  Checkbox,
  FormControlLabel,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DoneAllIcon from '@mui/icons-material/DoneAll';

const MySwal = withReactContent(Swal);

// Convierte una ruta relativa en URL absoluta para mostrar imágenes/documentos
const resolverUrlArchivo = (ruta) => {
  if (!ruta) return '';
  if (/^(https?:|blob:|data:)/i.test(ruta)) return ruta;
  return `${STATIC_BASE_URL}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
};

// Abre un documento en nueva ventana: los PDF se abren directamente, otros formatos usan visor de Google
const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

// Obtiene la URL de la imagen del evento de varios campos posibles
const obtenerImagenEvento = (evento) => {
  if (!evento) return '';
  const posiblesCampos = ['imagen', 'imagenUrl', 'imagen_url', 'foto', 'flyer', 'banner', 'bannerUrl', 'imagePath'];
  for (const campo of posiblesCampos) {
    if (evento[campo]) return evento[campo];
  }
  return '';
};

// Normaliza el texto del género para mostrarlo de forma consistente
const textoGenero = (genero) => {
  const v = (genero || '').toLowerCase().trim();
  if (v === 'masculino') return 'Masculino';
  if (v === 'femenino') return 'Femenino';
  if (v === 'mixto') return 'Mixto';
  return genero || 'N/A';
};

// Determina el color del chip según el género
const colorGenero = (genero) => {
  const v = (genero || '').toLowerCase().trim();
  if (v === 'masculino') return 'primary';
  if (v === 'femenino') return 'secondary';
  return 'default';
};

// Formatea fecha a formato largo en español
const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  try {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

// Obtiene el color y texto para el estado de un evento o convocatoria
const obtenerEstado = (estado) => ({
  color: estado ? 'success' : 'error',
  texto: estado ? 'Activo' : 'Cancelado',
});

const GestionarEventos = () => {
  // Estado del evento principal
  const [evento, setEvento] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    lugar: '',
    descripcion: '',
  });

  // Archivos adjuntos al evento
  const [imagenEvento, setImagenEvento] = useState(null);
  const [imagenPreview, setImagenPreview] = useState('');
  const [documentoConvocatoria, setDocumentoConvocatoria] = useState(null);
  const [documentoDeslinde, setDocumentoDeslinde] = useState(null);
  const [aceptaDeslinde, setAceptaDeslinde] = useState(false);

  // Lista de convocatorias del formulario de creación
  const [convocatorias, setConvocatorias] = useState([
    {
      disciplina_id: '',
      disciplina: '',
      categoria_id: '',
      categoria: '',
      edadMin: '',
      edadMax: '',
      genero_id: '',
      genero: '',
      hora: '',
    }
  ]);
  const [mostrarFormularioConvocatorias, setMostrarFormularioConvocatorias] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Estado de modales
  const [modalParticipantesAbierto, setModalParticipantesAbierto] = useState(false);
  const [vistaActual, setVistaActual] = useState('lista');
  const [modalDetalleConvocatoriaAbierto, setModalDetalleConvocatoriaAbierto] = useState(false);
  const [convocatoriaDetalle, setConvocatoriaDetalle] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [cargandoParticipantes, setCargandoParticipantes] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [cargandoEventos, setCargandoEventos] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [modalConvocatoriasAbierto, setModalConvocatoriasAbierto] = useState(false);
  const [eventoConvocatorias, setEventoConvocatorias] = useState(null);

  // Catálogos
  const [disciplinas, setDisciplinas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [catalogosCargando, setCatalogosCargando] = useState(true);

  // Pestañas
  const [tabActivo, setTabActivo] = useState('crear');

  // Estado para editar evento
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [eventoEnEdicion, setEventoEnEdicion] = useState(null);
  const [formEditar, setFormEditar] = useState({ titulo: '', fecha: '', hora: '', lugar: '', descripcion: '' });
  const [imagenEditar, setImagenEditar] = useState(null);
  const [documentoConvocatoriaEditar, setDocumentoConvocatoriaEditar] = useState(null);
  const [documentoDeslindeEditar, setDocumentoDeslindeEditar] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Estado para editar convocatoria
  const [modalEditarConvocatoriaAbierto, setModalEditarConvocatoriaAbierto] = useState(false);
  const [convocatoriaEnEdicion, setConvocatoriaEnEdicion] = useState(null);
  const [formEditarConvocatoria, setFormEditarConvocatoria] = useState({
    disciplina_id: '', disciplina: '', categoria_id: '', categoria: '',
    edadMin: '', edadMax: '', genero_id: '', genero: '', hora: '',
  });
  const [guardandoEdicionConvocatoria, setGuardandoEdicionConvocatoria] = useState(false);

  // Estado para agregar convocatoria
  const [modalAgregarConvocatoriaAbierto, setModalAgregarConvocatoriaAbierto] = useState(false);
  const [formNuevaConvocatoria, setFormNuevaConvocatoria] = useState({
    disciplina_id: '', disciplina: '', categoria_id: '', categoria: '',
    edadMin: '', edadMax: '', genero_id: '', genero: '', hora: '',
  });
  const [guardandoNuevaConvocatoria, setGuardandoNuevaConvocatoria] = useState(false);

  // Carga inicial
  useEffect(() => {
    cargarEventos();
    cargarLogo();
    cargarCatalogos();
  }, []);

  // Carga los catálogos de disciplinas, categorías y géneros
  const cargarCatalogos = async () => {
    try {
      setCatalogosCargando(true);
      const [discRes, catRes, genRes] = await Promise.all([
        catalogosAPI.getDisciplinas(),
        catalogosAPI.getCategorias(),
        catalogosAPI.getGeneros(),
      ]);
      setDisciplinas(discRes.data.disciplinas || []);
      setCategorias(catRes.data.categorias || []);
      setGeneros(genRes.data.generos || []);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      MySwal.fire({
        title: 'Error!',
        text: 'No se pudieron cargar las disciplinas/categorías/géneros. No podrás crear convocatorias hasta recargar la página.',
        icon: 'error',
      });
    } finally {
      setCatalogosCargando(false);
    }
  };

  // Obtiene todos los eventos desde el backend
  const cargarEventos = async () => {
    try {
      setCargandoEventos(true);
      const response = await eventosAPI.getAll({ todos: true });
      const data = response.data;
      const listaEventos = Array.isArray(data)
        ? data
        : Array.isArray(data?.eventos)
          ? data.eventos
          : [];
      // Ordenar: los activos primero, luego los cancelados
      listaEventos.sort((a, b) => Number(!!b.estado) - Number(!!a.estado));
      setEventos(listaEventos);
      if (listaEventos.length > 0) {
        console.log('Campos disponibles en un evento:', Object.keys(listaEventos[0]), listaEventos[0]);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEventos([]);
    } finally {
      setCargandoEventos(false);
    }
  };

  // Carga el logo de la empresa
  const cargarLogo = async () => {
    try {
      const response = await perfilEmpresaAPI.get();
      setLogoUrl(response.data.perfil.logo || '');
    } catch (error) {
      setLogoUrl('');
    }
  };

  // Manejadores para editar evento
  const manejarAbrirEditar = (evento) => {
    setEventoEnEdicion(evento);
    setFormEditar({
      titulo: evento.titulo || '',
      fecha: evento.fecha ? evento.fecha.slice(0, 10) : '',
      hora: evento.hora || '',
      lugar: evento.lugar || '',
      descripcion: evento.descripcion || '',
    });
    setImagenEditar(null);
    setDocumentoConvocatoriaEditar(null);
    setDocumentoDeslindeEditar(null);
    setModalEditarAbierto(true);
  };

  const manejarCerrarEditar = () => {
    setModalEditarAbierto(false);
    setEventoEnEdicion(null);
  };

  const manejarGuardarEdicion = async () => {
    if (!eventoEnEdicion) return;
    try {
      setGuardandoEdicion(true);
      const formData = new FormData();
      formData.append('titulo', formEditar.titulo);
      formData.append('fecha', formEditar.fecha);
      formData.append('hora', formEditar.hora);
      formData.append('lugar', formEditar.lugar);
      formData.append('descripcion', formEditar.descripcion);
      if (imagenEditar) formData.append('imagen', imagenEditar);
      if (documentoConvocatoriaEditar) formData.append('documentoConvocatoria', documentoConvocatoriaEditar);
      if (documentoDeslindeEditar) formData.append('documentoDeslinde', documentoDeslindeEditar);

      await eventosAPI.update(eventoEnEdicion.id, formData);
      manejarCerrarEditar();
      await cargarEventos();
      MySwal.fire({ title: 'Evento actualizado', icon: 'success', confirmButtonText: 'OK' });
    } catch (error) {
      console.error('Error al editar evento:', error);
      MySwal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo actualizar el evento.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Alterna el estado activo/cancelado de un evento
  const manejarAlternarEstado = async (evento) => {
    const nuevoEstado = !evento.estado;
    try {
      await eventosAPI.toggleEstado(evento.id, nuevoEstado);
      await cargarEventos();
    } catch (error) {
      console.error('Error al cambiar estado del evento:', error);
      MySwal.fire({ title: 'Error', text: 'No se pudo cambiar el estado del evento.', icon: 'error', confirmButtonText: 'OK' });
    }
  };

  // Finaliza o reabre un evento (marca como finalizado)
  const manejarFinalizarEvento = async (evento, finalizar) => {
    const confirm = await MySwal.fire({
      title: finalizar ? '¿Finalizar este evento?' : '¿Reabrir este evento?',
      html: finalizar
        ? `"<b>${evento.titulo}</b>" pasará a Eventos Finalizados y todas sus convocatorias dejarán de estar disponibles para inscribirse. No se borra ningún dato.`
        : `"<b>${evento.titulo}</b>" volverá a aparecer como evento activo. Sus convocatorias no se reabren automáticamente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#7A4069',
      confirmButtonText: finalizar ? 'Sí, finalizar' : 'Sí, reabrir',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    try {
      await eventosAPI.finalizarEvento(evento.id, finalizar);
      await cargarEventos();
      MySwal.fire({ title: finalizar ? 'Evento finalizado' : 'Evento reabierto', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Error al finalizar el evento:', error);
      MySwal.fire({ title: 'Error', text: 'No se pudo actualizar el evento.', icon: 'error', confirmButtonText: 'OK' });
    }
  };

  // Elimina un evento con todas sus convocatorias e inscripciones
  const manejarEliminarEvento = async (evento) => {
    const result = await MySwal.fire({
      title: '¿Eliminar este evento?',
      html: `Esto borra el evento <b>"${evento.titulo}"</b>, todas sus convocatorias y sus archivos. Si hay atletas inscritos, se les da de baja automáticamente y se les notifica. <br/><br/><b>Esta acción no se puede deshacer.</b>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#7A4069',
      confirmButtonText: 'Sí, eliminar definitivamente',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      const response = await eventosAPI.deleteEvento(evento.id);
      await cargarEventos();
      const atletasAfectados = response.data?.atletasAfectados || 0;
      MySwal.fire({
        title: 'Evento eliminado',
        text: atletasAfectados > 0 ? `Se notificó a ${atletasAfectados} atleta(s) que quedaron sin esta inscripción.` : undefined,
        icon: 'success',
        confirmButtonText: 'OK',
      });
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      MySwal.fire({ title: 'Error', text: error.response?.data?.error || 'No se pudo eliminar el evento.', icon: 'error', confirmButtonText: 'OK' });
    }
  };

  // Elimina una convocatoria específica
  const manejarEliminarConvocatoria = async (convocatoria, eventoPadre) => {
    const result = await MySwal.fire({
      title: '¿Eliminar esta convocatoria?',
      html: `Se eliminará <b>"${convocatoria.disciplina} - ${convocatoria.categoria}"</b>. Si hay atletas inscritos, se les da de baja y se les notifica.<br/><br/><b>Esta acción no se puede deshacer.</b>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#7A4069',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      const response = await eventosAPI.deleteConvocatoria(convocatoria.id);
      await cargarEventos();
      // Refrescar la convocatoria abierta en el modal, si sigue abierto
      if (eventoConvocatorias?.id === eventoPadre?.id) {
        const actualizado = (await eventosAPI.getAll({ todos: true })).data.eventos?.find((e) => e.id === eventoPadre.id);
        setEventoConvocatorias(actualizado || null);
      }
      const atletasAfectados = response.data?.atletasAfectados || 0;
      MySwal.fire({
        title: 'Convocatoria eliminada',
        text: atletasAfectados > 0 ? `Se notificó a ${atletasAfectados} atleta(s).` : undefined,
        icon: 'success',
        confirmButtonText: 'OK',
      });
    } catch (error) {
      console.error('Error al eliminar convocatoria:', error);
      MySwal.fire({ title: 'Error', text: error.response?.data?.error || 'No se pudo eliminar la convocatoria.', icon: 'error', confirmButtonText: 'OK' });
    }
  };

  // Manejadores para editar convocatoria
  const manejarAbrirEditarConvocatoria = (convocatoria, eventoPadre) => {
    const disc = disciplinas.find((d) => d.id === convocatoria.disciplina_id) || 
                 disciplinas.find((d) => (d.nombre || '').toLowerCase() === (convocatoria.disciplina || '').toLowerCase());
    const cat = categorias.find((c) => c.id === convocatoria.categoria_id) || 
                categorias.find((c) => (c.nombre || '').toLowerCase() === (convocatoria.categoria || '').toLowerCase());
    const gen = generos.find((g) => g.id === convocatoria.genero_id) || 
                generos.find((g) => (g.nombre || '').toLowerCase() === (convocatoria.genero || '').toLowerCase());

    setConvocatoriaEnEdicion({ ...convocatoria, eventoPadreId: eventoPadre?.id });
    setFormEditarConvocatoria({
      disciplina_id: disc?.id ?? '',
      disciplina: disc?.nombre ?? convocatoria.disciplina ?? '',
      categoria_id: cat?.id ?? '',
      categoria: cat?.nombre ?? convocatoria.categoria ?? '',
      edadMin: cat?.edad_min ?? convocatoria.edadMin ?? '',
      edadMax: cat?.edad_max ?? convocatoria.edadMax ?? '',
      genero_id: gen?.id ?? '',
      genero: gen?.nombre ?? convocatoria.genero ?? '',
      hora: convocatoria.hora ?? '',
    });
    setModalEditarConvocatoriaAbierto(true);
  };

  const manejarCerrarEditarConvocatoria = () => {
    setModalEditarConvocatoriaAbierto(false);
    setConvocatoriaEnEdicion(null);
  };

  const manejarDisciplinaChangeEditar = (e) => {
    const id = Number(e.target.value);
    const disc = disciplinas.find((d) => d.id === id);
    setFormEditarConvocatoria((p) => ({ ...p, disciplina_id: id, disciplina: disc?.nombre || '' }));
  };

  const manejarCategoriaChangeEditar = (e) => {
    const id = Number(e.target.value);
    const cat = categorias.find((c) => c.id === id);
    setFormEditarConvocatoria((p) => ({
      ...p,
      categoria_id: id,
      categoria: cat?.nombre || '',
      edadMin: cat?.edad_min ?? '',
      edadMax: cat?.edad_max ?? '',
    }));
  };

  const manejarGeneroChangeEditar = (e) => {
    const id = Number(e.target.value);
    const gen = generos.find((g) => g.id === id);
    setFormEditarConvocatoria((p) => ({ ...p, genero_id: id, genero: gen?.nombre || '' }));
  };

  const manejarGuardarEdicionConvocatoria = async () => {
    if (!convocatoriaEnEdicion) return;
    if (!formEditarConvocatoria.disciplina_id || !formEditarConvocatoria.categoria_id || !formEditarConvocatoria.genero_id) {
      MySwal.fire({ title: 'Faltan datos', text: 'Selecciona disciplina, categoría y género.', icon: 'warning', confirmButtonText: 'OK' });
      return;
    }
    try {
      setGuardandoEdicionConvocatoria(true);
      await eventosAPI.updateConvocatoria(convocatoriaEnEdicion.id, {
        disciplina_id: formEditarConvocatoria.disciplina_id,
        categoria_id: formEditarConvocatoria.categoria_id,
        genero_id: formEditarConvocatoria.genero_id,
        hora: formEditarConvocatoria.hora || null,
      });
      manejarCerrarEditarConvocatoria();
      await cargarEventos();
      if (eventoConvocatorias?.id === convocatoriaEnEdicion.eventoPadreId) {
        const actualizado = (await eventosAPI.getAll({ todos: true })).data.eventos?.find((e) => e.id === convocatoriaEnEdicion.eventoPadreId);
        setEventoConvocatorias(actualizado || null);
      }
      MySwal.fire({ title: 'Convocatoria actualizada', icon: 'success', confirmButtonText: 'OK' });
    } catch (error) {
      console.error('Error al editar convocatoria:', error);
      MySwal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo actualizar la convocatoria.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setGuardandoEdicionConvocatoria(false);
    }
  };

  // Manejadores para agregar convocatoria
  const manejarAbrirAgregarConvocatoria = () => {
    setFormNuevaConvocatoria({
      disciplina_id: '', disciplina: '', categoria_id: '', categoria: '',
      edadMin: '', edadMax: '', genero_id: '', genero: '', hora: '',
    });
    setModalAgregarConvocatoriaAbierto(true);
  };

  const manejarCerrarAgregarConvocatoria = () => {
    setModalAgregarConvocatoriaAbierto(false);
  };

  const manejarDisciplinaChangeNueva = (e) => {
    const id = Number(e.target.value);
    const disc = disciplinas.find((d) => d.id === id);
    setFormNuevaConvocatoria((p) => ({ ...p, disciplina_id: id, disciplina: disc?.nombre || '' }));
  };

  const manejarCategoriaChangeNueva = (e) => {
    const id = Number(e.target.value);
    const cat = categorias.find((c) => c.id === id);
    setFormNuevaConvocatoria((p) => ({
      ...p,
      categoria_id: id,
      categoria: cat?.nombre || '',
      edadMin: cat?.edad_min ?? '',
      edadMax: cat?.edad_max ?? '',
    }));
  };

  const manejarGeneroChangeNueva = (e) => {
    const id = Number(e.target.value);
    const gen = generos.find((g) => g.id === id);
    setFormNuevaConvocatoria((p) => ({ ...p, genero_id: id, genero: gen?.nombre || '' }));
  };

  const manejarGuardarNuevaConvocatoria = async () => {
    if (!eventoConvocatorias?.id) return;
    if (!formNuevaConvocatoria.disciplina_id || !formNuevaConvocatoria.categoria_id || !formNuevaConvocatoria.genero_id) {
      MySwal.fire({ title: 'Faltan datos', text: 'Selecciona disciplina, categoría y género.', icon: 'warning', confirmButtonText: 'OK' });
      return;
    }
    try {
      setGuardandoNuevaConvocatoria(true);
      await eventosAPI.addConvocatoria(eventoConvocatorias.id, {
        disciplina_id: formNuevaConvocatoria.disciplina_id,
        categoria_id: formNuevaConvocatoria.categoria_id,
        genero_id: formNuevaConvocatoria.genero_id,
        hora: formNuevaConvocatoria.hora || null,
      });
      manejarCerrarAgregarConvocatoria();
      await cargarEventos();
      const actualizado = (await eventosAPI.getAll({ todos: true })).data.eventos?.find((e) => e.id === eventoConvocatorias.id);
      setEventoConvocatorias(actualizado || null);
      MySwal.fire({ title: 'Convocatoria agregada', icon: 'success', confirmButtonText: 'OK' });
    } catch (error) {
      console.error('Error al agregar convocatoria:', error);
      MySwal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo agregar la convocatoria.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setGuardandoNuevaConvocatoria(false);
    }
  };

  // Da de baja a un atleta de una convocatoria
  const manejarDarDeBajaAtleta = async (participante) => {
    const result = await MySwal.fire({
      title: '¿Dar de baja a este atleta?',
      text: `Se le quitará su inscripción y se le notificará.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#7A4069',
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await eventosAPI.removerAtletaDeConvocatoria(participante.id);
      setParticipantes((prev) => prev.filter((p) => p.id !== participante.id));
      MySwal.fire({ title: 'Atleta dado de baja', icon: 'success', confirmButtonText: 'OK' });
    } catch (error) {
      console.error('Error al dar de baja al atleta:', error);
      MySwal.fire({ title: 'Error', text: error.response?.data?.error || 'No se pudo dar de baja al atleta.', icon: 'error', confirmButtonText: 'OK' });
    }
  };

  // Manejadores del formulario de evento principal
  const manejarChangeEvento = (e) => {
    const { name, value } = e.target;
    setEvento({ ...evento, [name]: value });
  };

  const manejarImagenChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      MySwal.fire({ title: 'Error!', text: 'El archivo debe ser una imagen (jpg, png, webp).', icon: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      MySwal.fire({ title: 'Error!', text: 'La imagen no debe pesar más de 5MB.', icon: 'error' });
      return;
    }
    setImagenEvento(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const manejarQuitarImagen = () => {
    setImagenEvento(null);
    setImagenPreview('');
  };

  const manejarDocumentoConvocatoriaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const permitido = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!permitido.includes(file.type)) {
      MySwal.fire({ title: 'Error!', text: 'El documento de convocatoria debe ser PDF o Word.', icon: 'error' });
      return;
    }
    setDocumentoConvocatoria(file);
  };

  const manejarDocumentoDeslindeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const permitido = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (!permitido.includes(file.type)) {
      MySwal.fire({ title: 'Error!', text: 'El documento de deslinde debe ser PDF, Word o imagen.', icon: 'error' });
      return;
    }
    setDocumentoDeslinde(file);
  };

  // Manejadores de convocatorias en el formulario de creación
  const manejarDisciplinaChange = (index, e) => {
    const id = Number(e.target.value);
    const disc = disciplinas.find(d => d.id === id);
    const nuevasConvocatorias = [...convocatorias];
    nuevasConvocatorias[index] = {
      ...nuevasConvocatorias[index],
      disciplina_id: id,
      disciplina: disc?.nombre || '',
    };
    setConvocatorias(nuevasConvocatorias);
  };

  const manejarCategoriaChange = (index, e) => {
    const id = Number(e.target.value);
    const cat = categorias.find(c => c.id === id);
    const nuevasConvocatorias = [...convocatorias];
    nuevasConvocatorias[index] = {
      ...nuevasConvocatorias[index],
      categoria_id: id,
      categoria: cat?.nombre || '',
      edadMin: cat?.edad_min ?? '',
      edadMax: cat?.edad_max ?? '',
    };
    setConvocatorias(nuevasConvocatorias);
  };

  const manejarGeneroChange = (index, e) => {
    const id = Number(e.target.value);
    const gen = generos.find(g => g.id === id);
    const nuevasConvocatorias = [...convocatorias];
    nuevasConvocatorias[index] = {
      ...nuevasConvocatorias[index],
      genero_id: id,
      genero: gen?.nombre || '',
    };
    setConvocatorias(nuevasConvocatorias);
  };

  const manejarConvocatoriaChange = (index, e) => {
    const { name, value } = e.target;
    const nuevasConvocatorias = [...convocatorias];
    nuevasConvocatorias[index] = {
      ...nuevasConvocatorias[index],
      [name]: value,
    };
    setConvocatorias(nuevasConvocatorias);
  };

  const agregarConvocatoria = () => {
    setConvocatorias([
      ...convocatorias,
      {
        disciplina_id: '',
        disciplina: '',
        categoria_id: '',
        categoria: '',
        edadMin: '',
        edadMax: '',
        genero_id: '',
        genero: '',
        hora: '',
      }
    ]);
  };

  const quitarConvocatoria = (index) => {
    if (convocatorias.length > 1) {
      const nuevasConvocatorias = convocatorias.filter((_, i) => i !== index);
      setConvocatorias(nuevasConvocatorias);
    }
  };

  // Envío del formulario de creación
  const manejarSubmit = async (e) => {
    e.preventDefault();
    
    if (!evento.titulo || !evento.fecha || !evento.hora || !evento.lugar) {
      MySwal.fire({
        title: 'Error!',
        text: 'Todos los campos del evento son requeridos',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (new Date(`${evento.fecha}T00:00:00`) < hoy) {
      MySwal.fire({
        title: 'Fecha inválida',
        text: 'La fecha del evento no puede ser anterior al día de hoy.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    if (!aceptaDeslinde) {
      MySwal.fire({
        title: 'Falta el deslinde de responsabilidad',
        text: 'Debes aceptar el deslinde de responsabilidad (riesgo de lesión) para publicar el evento.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    if (!documentoConvocatoria) {
      MySwal.fire({
        title: 'Falta el documento de convocatoria',
        text: 'Debes subir el PDF o Word con las bases oficiales del evento antes de publicarlo.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    if (!documentoDeslinde) {
      MySwal.fire({
        title: 'Falta el deslinde de responsabilidad',
        text: 'Debes subir el documento de deslinde de responsabilidad antes de publicar el evento.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    // Validar convocatorias
    for (let i = 0; i < convocatorias.length; i++) {
      const conv = convocatorias[i];
      if (!conv.disciplina_id || !conv.categoria_id || !conv.genero_id || !conv.edadMin || !conv.edadMax) {
        MySwal.fire({
          title: 'Error!',
          text: `Convocatoria ${i + 1}: Todos los campos son requeridos`,
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }
    }

    // Evitar duplicados de disciplina+categoría+género
    const combosVistos = new Map();
    for (let i = 0; i < convocatorias.length; i++) {
      const conv = convocatorias[i];
      const clave = `${conv.disciplina_id}-${conv.categoria_id}-${conv.genero_id}`;
      if (combosVistos.has(clave)) {
        MySwal.fire({
          title: 'Convocatoria duplicada',
          text: `Convocatoria ${combosVistos.get(clave) + 1} y Convocatoria ${i + 1} tienen la misma disciplina, categoría y género. Cambia una de las dos o bórrala.`,
          icon: 'warning',
          confirmButtonText: 'Entendido',
        });
        return;
      }
      combosVistos.set(clave, i);
    }

    setCargando(true);
    try {
      const formData = new FormData();
      Object.entries(evento).forEach(([key, value]) => formData.append(key, value));
      const convocatoriasParaEnviar = convocatorias.map((c) => ({
        disciplina_id: c.disciplina_id,
        categoria_id: c.categoria_id,
        genero_id: c.genero_id,
        hora: c.hora || null,
      }));
      formData.append('convocatorias', JSON.stringify(convocatoriasParaEnviar));
      formData.append('aceptaDeslinde', 'true');
      if (imagenEvento) formData.append('imagen', imagenEvento);
      if (documentoConvocatoria) formData.append('documentoConvocatoria', documentoConvocatoria);
      if (documentoDeslinde) formData.append('documentoDeslinde', documentoDeslinde);

      const response = await eventosAPI.create(formData);
      if (response.status === 201) {
        MySwal.fire({
          title: 'Éxito!',
          text: 'El evento ha sido creado correctamente con todas sus convocatorias.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        
        // Resetear formulario
        setEvento({
          titulo: '',
          fecha: '',
          hora: '',
          lugar: '',
          descripcion: '',
        });
        setConvocatorias([
          {
            disciplina_id: '',
            disciplina: '',
            categoria_id: '',
            categoria: '',
            edadMin: '',
            edadMax: '',
            genero_id: '',
            genero: '',
            hora: '',
          }
        ]);
        setMostrarFormularioConvocatorias(false);
        manejarQuitarImagen();
        setDocumentoConvocatoria(null);
        setDocumentoDeslinde(null);
        setAceptaDeslinde(false);
        
        await cargarEventos();
      }
    } catch (error) {
      console.error('Error al crear evento:', error);
      MySwal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Error al crear el evento',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setCargando(false);
    }
  };

  // Manejadores para ver participantes y detalles
  const manejarVerParticipantes = async (evento) => {
    setEventoSeleccionado(evento);
    setModalParticipantesAbierto(true);
    setCargandoParticipantes(true);
    try {
      const response = await eventosAPI.getParticipantes(evento.id);
      setParticipantes(response.data.participantes || []);
    } catch (error) {
      setParticipantes([]);
    } finally {
      setCargandoParticipantes(false);
    }
  };

  const manejarVerEvento = (evento) => {
    setEventoSeleccionado(evento);
    setVistaActual('detalle');
  };

  const manejarCerrarParticipantes = () => {
    setModalParticipantesAbierto(false);
    setEventoSeleccionado(null);
  };

  const manejarCerrarEvento = () => {
    setVistaActual('lista');
    setEventoSeleccionado(null);
  };

  const manejarCerrarConvocatorias = () => {
    setModalConvocatoriasAbierto(false);
    setEventoConvocatorias(null);
  };

  const manejarVerConvocatorias = (evento) => {
    setEventoConvocatorias(evento);
    setModalConvocatoriasAbierto(true);
  };

  const manejarVerParticipantesConvocatoria = async (evento, convocatoria) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria });
    setModalParticipantesAbierto(true);
    setCargandoParticipantes(true);
    try {
      const response = await eventosAPI.getParticipantesPorConvocatoria(convocatoria.id);
      setParticipantes(response.data.participantes || []);
    } catch (error) {
      setParticipantes([]);
    } finally {
      setCargandoParticipantes(false);
    }
  };

  const manejarVerDetalleConvocatoria = (evento, convocatoria) => {
    setConvocatoriaDetalle({ ...convocatoria, eventoTitulo: evento?.titulo });
    setModalDetalleConvocatoriaAbierto(true);
  };

  const manejarCerrarDetalleConvocatoria = () => {
    setModalDetalleConvocatoriaAbierto(false);
    setConvocatoriaDetalle(null);
  };

  // ============ VISTA DE DETALLE DEL EVENTO ============
  if (vistaActual === 'detalle' && eventoSeleccionado) {
    const { estado } = eventoSeleccionado;
    const estadoInfo = obtenerEstado(estado);

    return (
      <Box sx={{ bgcolor: '#e4e4e5', minHeight: '100vh' }}>
        <style>{`.swal2-container { z-index: 2000 !important; }`}</style>

        <Box sx={{ bgcolor: '#800020', color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
          <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 } }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={manejarCerrarEvento}
              sx={{ color: '#fff', mb: 2, textTransform: 'none', fontWeight: 700, opacity: 0.9, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Volver a Eventos
            </Button>
            <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              IVD · Panel Administrativo
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
              {eventoSeleccionado.titulo}
            </Typography>
            {eventoSeleccionado.convocatoriaSeleccionada && (
              <Typography sx={{ opacity: 0.9, mt: 0.5 }}>
                Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, pb: { xs: 5, md: 7 } }}>
          <Box sx={{ mt: { xs: -4, md: -5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 3, alignItems: 'flex-start' }}>

            {/* Columna izquierda: imagen + info general */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)', p: { xs: 2.5, md: 3 }, position: { md: 'sticky' }, top: { md: 24 } }}>
              {obtenerImagenEvento(eventoSeleccionado) && (
                <Box
                  component="img"
                  src={resolverUrlArchivo(obtenerImagenEvento(eventoSeleccionado))}
                  alt={eventoSeleccionado.titulo}
                  sx={{ width: '100%', height: { xs: 260, md: 300 }, objectFit: 'cover', borderRadius: '8px', mb: 2.5 }}
                />
              )}

              <Chip
                label={estadoInfo.texto}
                color={estadoInfo.color}
                size="small"
                sx={{ fontWeight: 700 }}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: '#800020' }} />
                    <Typography sx={{ fontSize: '0.65rem', color: '#7A4069', fontWeight: 700, textTransform: 'uppercase' }}>Fecha y hora</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatearFecha(eventoSeleccionado.fecha)}{eventoSeleccionado.hora ? ` — ${eventoSeleccionado.hora}` : ''}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, mb: .3 }}>
                    <PlaceIcon sx={{ fontSize: 16, color: '#800020' }} />
                    <Typography sx={{ fontSize: '0.65rem', color: '#7A4069', fontWeight: 700, textTransform: 'uppercase' }}>Lugar</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{eventoSeleccionado.lugar}</Typography>
                </Box>
                {eventoSeleccionado.descripcion && (
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: '#7A4069', fontWeight: 700, textTransform: 'uppercase' }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ mt: .3, lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {eventoSeleccionado.descripcion}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.5 }} />
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: '#7A4069', fontWeight: 700, textTransform: 'uppercase' }}>Fecha de cierre de inscripción</Typography>
                  <Typography variant="body2" sx={{ mt: .3 }}>{formatearFecha(eventoSeleccionado.fecha_cierre)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: '#7A4069', fontWeight: 700, textTransform: 'uppercase' }}>ID / Creado</Typography>
                  <Typography variant="body2" sx={{ mt: .3 }}>#{eventoSeleccionado.id} — {formatearFecha(eventoSeleccionado.created_at)}</Typography>
                </Box>
              </Box>

              {(eventoSeleccionado.documentoConvocatoria || eventoSeleccionado.documentoDeslinde) && (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1, mt: 2.5 }}>
                  {eventoSeleccionado.documentoConvocatoria && (
                    <Chip
                      icon={<DownloadIcon />}
                      label="Convocatoria"
                      onClick={() => abrirDocumentoParaVer(resolverUrlArchivo(eventoSeleccionado.documentoConvocatoria))}
                      clickable
                      size="small"
                      sx={{ color: '#800020' }}
                    />
                  )}
                  {eventoSeleccionado.documentoDeslinde && (
                    <Chip
                      icon={<ShieldIcon />}
                      label="Deslinde"
                      onClick={() => abrirDocumentoParaVer(resolverUrlArchivo(eventoSeleccionado.documentoDeslinde))}
                      clickable
                      size="small"
                    />
                  )}
                </Stack>
              )}
            </Box>

            {/* Columna derecha: convocatorias */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '10px', boxShadow: '0 2px 12px rgba(128,0,32,0.07)', p: { xs: 2.5, md: 3.5 } }}>
              <Typography variant="h6" sx={{ color: '#800020', fontWeight: 800, mb: 2 }}>
                {eventoSeleccionado.convocatoriaSeleccionada ? 'Convocatoria seleccionada' : 'Convocatorias de este Evento'}
              </Typography>

              {eventoSeleccionado.convocatoriaSeleccionada ? (
                <Box sx={{ p: 2, borderRadius: '8px', border: '1px solid rgba(128,0,32,0.18)' }}>
                  <Typography sx={{ fontWeight: 700 }}>{eventoSeleccionado.convocatoriaSeleccionada.disciplina}</Typography>
                  <Box sx={{ display: 'flex', gap: .75, mt: 1, flexWrap: 'wrap' }}>
                    <Chip label={eventoSeleccionado.convocatoriaSeleccionada.categoria} size="small" sx={{ border: '1px solid #7A4069', bgcolor: 'transparent', color: '#7A4069' }} />
                    <Chip
                      label={textoGenero(eventoSeleccionado.convocatoriaSeleccionada.genero)}
                      size="small" sx={{ border: '1px solid rgba(128,0,32,0.18)', bgcolor: 'transparent' }}
                    />
                    <Chip
                      label={`${eventoSeleccionado.convocatoriaSeleccionada.edadMin}-${eventoSeleccionado.convocatoriaSeleccionada.edadMax} años`}
                      size="small" sx={{ border: '1px solid rgba(128,0,32,0.18)', bgcolor: 'transparent' }}
                    />
                  </Box>
                </Box>
              ) : eventoSeleccionado.convocatorias?.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {eventoSeleccionado.convocatorias.map((conv) => (
                    <Box
                      key={conv.id}
                      sx={{ p: 2, borderRadius: '8px', border: '1px solid rgba(128,0,32,0.18)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{conv.disciplina || 'Disciplina N/D'}</Typography>
                        <Box sx={{ display: 'flex', gap: .75, mt: .5, flexWrap: 'wrap' }}>
                          <Chip label={conv.categoria || 'Categoría N/D'} size="small" sx={{ border: '1px solid #7A4069', bgcolor: 'transparent', color: '#7A4069' }} />
                          {conv.genero && (
                            <Chip
                              label={textoGenero(conv.genero)}
                              size="small" sx={{ border: '1px solid rgba(128,0,32,0.18)', bgcolor: 'transparent' }}
                            />
                          )}
                          {conv.edadMin != null && conv.edadMax != null && (
                            <Chip label={`${conv.edadMin}-${conv.edadMax} años`} size="small" sx={{ border: '1px solid rgba(128,0,32,0.18)', bgcolor: 'transparent' }} />
                          )}
                          <Chip
                            label={obtenerEstado(conv.estado).texto}
                            color={obtenerEstado(conv.estado).color}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Este evento todavía no tiene convocatorias registradas.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // ============ VISTA DE LISTA / CREACIÓN ============
  return (
    <Box sx={{ bgcolor: '#e4e4e5', minHeight: '100vh', '& .MuiFormLabel-asterisk': { display: 'none' } }}>
      <style>{`.swal2-container { z-index: 2000 !important; }`}</style>

      {/* Cabecera */}
      <Box sx={{ bgcolor: '#800020', color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 7, md: 8 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center', px: { xs: 2, md: 3 } }}>
          <Typography sx={{ opacity: 0.7, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            IVD · Panel Administrativo
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
            Gestión de Eventos
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1.5, md: 2 }, pb: { xs: 3, md: 5 } }}>
        {/* Contador de eventos */}
        <Box
          sx={{
            mt: { xs: -5, md: -6 }, mb: 3,
            bgcolor: '#fff', borderRadius: 3,
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            display: 'flex', justifyContent: 'center',
            p: { xs: 2, md: 2.75 }, textAlign: 'center',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#800020', lineHeight: 1.1, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>{eventos.length}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#2B1E1E', fontWeight: 700, mt: 0.2 }}>Eventos Creados</Typography>
          </Box>
        </Box>

        {/* Pestañas */}
        <Tabs
          value={tabActivo}
          onChange={(e, v) => setTabActivo(v)}
          sx={{
            mb: 4,
            borderBottom: '2px solid #eee',
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '1rem', color: '#7A4069' },
            '& .Mui-selected': { color: '#800020 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#800020', height: 3 },
          }}
        >
          <Tab icon={<AddCircleOutlineIcon />} iconPosition="start" label="Crear Evento" value="crear" />
          <Tab icon={<EventAvailableIcon />} iconPosition="start" label="Eventos Existentes" value="ver" />
        </Tabs>

        {/* Panel Crear Evento */}
        {tabActivo === 'crear' && (
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, mb: 4, borderRadius: 3, border: '1px solid #eee' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ width: 6, height: 28, borderRadius: 1, backgroundColor: '#800020' }} />
              <Typography variant="h5" sx={{ color: '#800020', fontWeight: 800 }}>
                Crear Nuevo Evento
              </Typography>
            </Stack>

            <form onSubmit={manejarSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
                <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 7' } }}>
                  <TextField
                    fullWidth
                    label="Título del evento"
                    name="titulo"
                    value={evento.titulo}
                    onChange={manejarChangeEvento}
                    required
                    placeholder="Ej. Torneo Nacional Sub-18 2026"
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 5' } }}>
                  <TextField
                    fullWidth
                    label="Lugar"
                    name="lugar"
                    value={evento.lugar}
                    onChange={manejarChangeEvento}
                    required
                    placeholder="Ej. Estadio Central"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PlaceIcon sx={{ color: '#800020' }} fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha"
                    name="fecha"
                    value={evento.fecha}
                    onChange={manejarChangeEvento}
                    required
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EventIcon sx={{ color: '#800020' }} fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Hora"
                    name="hora"
                    value={evento.hora}
                    onChange={manejarChangeEvento}
                    required
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon sx={{ color: '#800020' }} fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: 'span 12' }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Descripción"
                    name="descripcion"
                    value={evento.descripcion}
                    onChange={manejarChangeEvento}
                    placeholder="Detalles del evento (opcional)"
                  />
                </Box>
              </Box>

              {/* Zona de convocatoria */}
              <Box
                sx={{
                  mt: 4,
                  p: { xs: 2, md: 3 },
                  borderRadius: 3,
                  border: '1px dashed #989898',
                  backgroundColor: '#f5f4f4',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                  <CampaignIcon sx={{ color: '#800020' }} />
                  <Typography variant="h6" sx={{ color: '#800020', fontWeight: 800 }}>
                    Zona de Convocatoria
                  </Typography>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: '20px' }}>
                  {/* Imagen del evento */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#555', fontWeight: 700 }}>
                      <ImageIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                      Imagen / Flyer del evento <Box component="span" sx={{ color: '#999', fontWeight: 400 }}>(opcional)</Box>
                    </Typography>
                    <Box
                      sx={{
                        position: 'relative',
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        height: 180,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                      }}
                    >
                      {imagenPreview ? (
                        <>
                          <Box
                            component="img"
                            src={imagenPreview}
                            alt="Vista previa del evento"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <MuiIconButton
                            size="small"
                            onClick={manejarQuitarImagen}
                            sx={{
                              position: 'absolute', top: 6, right: 6,
                              backgroundColor: 'rgba(0,0,0,0.55)',
                              color: '#fff',
                              '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' }
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </MuiIconButton>
                        </>
                      ) : (
                        <Button
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          sx={{ color: '#800020' }}
                        >
                          Subir imagen
                          <input hidden type="file" accept="image/*" onChange={manejarImagenChange} />
                        </Button>
                      )}
                    </Box>
                    {imagenPreview && (
                      <Button
                        component="label"
                        size="small"
                        sx={{ mt: 1, color: '#800020' }}
                        startIcon={<CloudUploadIcon fontSize="small" />}
                      >
                        Cambiar imagen
                        <input hidden type="file" accept="image/*" onChange={manejarImagenChange} />
                      </Button>
                    )}
                  </Box>

                  {/* Documento de convocatoria oficial */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#555', fontWeight: 700 }}>
                      <DescriptionIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                      Documento de convocatoria <Box component="span" sx={{ color: '#800020' }}>*</Box>
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        height: 180,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                        p: 2,
                        textAlign: 'center',
                      }}
                    >
                      {documentoConvocatoria ? (
                        <>
                          <InsertDriveFileIcon sx={{ fontSize: 34, color: '#800020', mb: 1 }} />
                          <Typography variant="caption" sx={{ wordBreak: 'break-all', mb: 1 }}>
                            {documentoConvocatoria.name}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Button component="label" size="small" sx={{ color: '#800020' }}>
                              Cambiar
                              <input hidden type="file" accept=".pdf,.doc,.docx" onChange={manejarDocumentoConvocatoriaChange} />
                            </Button>
                            <Button size="small" color="error" onClick={() => setDocumentoConvocatoria(null)}>
                              Quitar
                            </Button>
                          </Stack>
                        </>
                      ) : (
                        <Button component="label" startIcon={<CloudUploadIcon />} sx={{ color: '#800020' }}>
                          Subir documento
                          <input hidden type="file" accept=".pdf,.doc,.docx" onChange={manejarDocumentoConvocatoriaChange} />
                        </Button>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      PDF o Word con las bases oficiales del evento.
                    </Typography>
                  </Box>

                  {/* Deslinde de responsabilidad */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#555', fontWeight: 700 }}>
                      <ShieldIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                      Deslinde de responsabilidad <Box component="span" sx={{ color: '#800020' }}>*</Box>
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        height: 180,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                        p: 2,
                        textAlign: 'center',
                      }}
                    >
                      {documentoDeslinde ? (
                        <>
                          <InsertDriveFileIcon sx={{ fontSize: 34, color: '#800020', mb: 1 }} />
                          <Typography variant="caption" sx={{ wordBreak: 'break-all', mb: 1 }}>
                            {documentoDeslinde.name}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Button component="label" size="small" sx={{ color: '#800020' }}>
                              Cambiar
                              <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={manejarDocumentoDeslindeChange} />
                            </Button>
                            <Button size="small" color="error" onClick={() => setDocumentoDeslinde(null)}>
                              Quitar
                            </Button>
                          </Stack>
                        </>
                      ) : (
                        <Button component="label" startIcon={<CloudUploadIcon />} sx={{ color: '#800020' }}>
                          Subir documento
                          <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={manejarDocumentoDeslindeChange} />
                        </Button>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Aviso de riesgo / consentimiento firmado.
                    </Typography>
                  </Box>
                </Box>

                <Alert
                  severity="warning"
                  icon={<ShieldIcon />}
                  sx={{ mt: 3, alignItems: 'flex-start', backgroundColor: '#fff4e5' }}
                >
                  <FormControlLabel
                    sx={{ alignItems: 'flex-start', m: 0 }}
                    control={
                      <Checkbox
                        checked={aceptaDeslinde}
                        onChange={(e) => setAceptaDeslinde(e.target.checked)}
                        sx={{ color: '#800020', '&.Mui-checked': { color: '#800020' } }}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Confirmo que los participantes serán informados de que la práctica deportiva implica riesgo de
                        lesión u otros daños, y que el evento se publica bajo el deslinde de responsabilidad correspondiente.
                      </Typography>
                    }
                  />
                </Alert>
              </Box>

              {/* Botón para mostrar/ocultar convocatorias */}
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setMostrarFormularioConvocatorias(!mostrarFormularioConvocatorias)}
                  startIcon={<GestureIcon />}
                  sx={{
                    color: '#800020',
                    borderColor: '#800020',
                    '&:hover': {
                      borderColor: '#800020',
                      backgroundColor: 'rgba(128, 0, 32, 0.04)'
                    }
                  }}
                >
                  {mostrarFormularioConvocatorias ? 'Ocultar Convocatorias' : 'Agregar Convocatorias'}
                </Button>
              </Box>

              {/* Formulario de convocatorias */}
              <Collapse in={mostrarFormularioConvocatorias}>
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
                  <Typography variant="h6" sx={{ color: '#800020', mb: 2 }}>
                    Convocatorias del Evento
                  </Typography>
                  
                  {convocatorias.map((convocatoria, index) => (
                    <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1, backgroundColor: 'white' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ color: '#800020', fontWeight: 'bold' }}>
                          Convocatoria {index + 1}
                        </Typography>
                        {convocatorias.length > 1 && (
                          <Tooltip title="Eliminar convocatoria">
                            <MuiIconButton
                              onClick={() => quitarConvocatoria(index)}
                              color="error"
                              size="small"
                            >
                              <RemoveIcon />
                            </MuiIconButton>
                          </Tooltip>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '16px' }}>
                        <Box>
                          <TextField
                            select
                            fullWidth
                            label="Disciplina"
                            name="disciplina_id"
                            value={convocatoria.disciplina_id}
                            onChange={(e) => manejarDisciplinaChange(index, e)}
                            required
                            disabled={catalogosCargando}
                            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                          >
                            <option value="">Seleccione una disciplina</option>
                            {disciplinas.map((disc) => (
                              <option key={disc.id} value={disc.id}>{disc.nombre}</option>
                            ))}
                          </TextField>
                        </Box>
                        
                        <Box>
                          <TextField
                            select
                            fullWidth
                            label="Categoría"
                            name="categoria_id"
                            value={convocatoria.categoria_id}
                            onChange={(e) => manejarCategoriaChange(index, e)}
                            required
                            disabled={catalogosCargando}
                            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                          >
                            <option value="">Seleccione una categoría</option>
                            {categorias.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                          </TextField>
                        </Box>
                        
                        <Box>
                          <TextField
                            fullWidth
                            type="number"
                            label="Edad mínima"
                            name="edadMin"
                            value={convocatoria.edadMin}
                            onChange={(e) => manejarConvocatoriaChange(index, e)}
                            inputProps={{ min: 12, max: 35 }}
                            required
                          />
                        </Box>
                        
                        <Box>
                          <TextField
                            fullWidth
                            type="number"
                            label="Edad máxima"
                            name="edadMax"
                            value={convocatoria.edadMax}
                            onChange={(e) => manejarConvocatoriaChange(index, e)}
                            inputProps={{ min: convocatoria.edadMin || 12, max: 35 }}
                            required
                          />
                        </Box>
                        
                        <Box>
                          <TextField
                            select
                            fullWidth
                            label="Género"
                            name="genero_id"
                            value={convocatoria.genero_id}
                            onChange={(e) => manejarGeneroChange(index, e)}
                            required
                            disabled={catalogosCargando}
                            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                          >
                            <option value="">Seleccione un género</option>
                            {generos.map((g) => (
                              <option key={g.id} value={g.id}>{g.nombre}</option>
                            ))}
                          </TextField>
                        </Box>

                        <Box>
                          <TextField
                            fullWidth
                            type="time"
                            label="Hora de esta prueba (opcional)"
                            name="hora"
                            value={convocatoria.hora || ''}
                            onChange={(e) => manejarConvocatoriaChange(index, e)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            helperText="Si la dejas en blanco, aplica el horario general del evento"
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={agregarConvocatoria}
                      startIcon={<AddIcon />}
                      sx={{
                        color: '#800020',
                        borderColor: '#800020',
                        '&:hover': {
                          borderColor: '#800020',
                          backgroundColor: 'rgba(128, 0, 32, 0.04)'
                        }
                      }}
                    >
                      Agregar Otra Convocatoria
                    </Button>
                  </Box>
                </Box>
              </Collapse>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={cargando}
                startIcon={cargando ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <EventIcon />}
                sx={{
                  mt: 4,
                  py: 1.4,
                  fontWeight: 800,
                  fontSize: '1rem',
                  borderRadius: 2,
                  backgroundColor: '#800020',
                  boxShadow: '0 6px 18px rgba(128,0,32,0.3)',
                  '&:hover': { backgroundColor: '#5c0017' },
                }}
              >
                {cargando ? 'Guardando...' : 'Crear Evento con Convocatorias'}
              </Button>
            </form>
          </Paper>
        )}

        {/* Panel Ver Eventos */}
        {tabActivo === 'ver' && (
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, border: '1px solid #eee' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ width: 6, height: 28, borderRadius: 1, backgroundColor: '#800020' }} />
              <Typography variant="h5" sx={{ color: '#800020', fontWeight: 800 }}>
                Eventos Creados
              </Typography>
            </Stack>

            {cargandoEventos ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : eventos.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                No hay eventos creados aún.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 2.5,
                  alignItems: 'stretch',
                }}
              >
                {eventos.map((evento) => {
                  const estadoInfo = obtenerEstado(evento.estado);
                  const esFinalizado = evento.finalizado || new Date(evento.fecha) < new Date();

                  return (
                    <Card
                      key={evento.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'box-shadow .2s, transform .2s, background-color .2s',
                        bgcolor: evento.estado ? '#fff' : '#f2f2f2',
                        borderColor: evento.estado ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)',
                        '&:hover': { boxShadow: '0 10px 24px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' },
                      }}
                    >
                      {obtenerImagenEvento(evento) ? (
                        <Box
                          component="img"
                          src={resolverUrlArchivo(obtenerImagenEvento(evento))}
                          alt={evento.titulo}
                          sx={{
                            width: '100%', height: 150, objectFit: 'cover', display: 'block', flexShrink: 0,
                            borderTopLeftRadius: 12, borderTopRightRadius: 12,
                            filter: evento.estado ? 'none' : 'grayscale(85%)',
                            opacity: evento.estado ? 1 : 0.75,
                          }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%', height: 150, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderTopLeftRadius: 12, borderTopRightRadius: 12,
                            position: 'relative', overflow: 'hidden',
                            background: evento.estado
                              ? 'linear-gradient(135deg, #A13A3A 0%, #800020 55%, #4a0012 100%)'
                              : 'linear-gradient(135deg, #8a8a8a 0%, #5c5c5c 55%, #333 100%)',
                          }}
                        >
                          <Box sx={{
                            position: 'absolute', width: 180, height: 180, borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.08)', filter: 'blur(30px)', top: -50, left: -30,
                          }} />
                          <Box sx={{
                            position: 'absolute', width: 140, height: 140, borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.06)', filter: 'blur(26px)', bottom: -40, right: -20,
                          }} />
                          <ImageIcon sx={{ fontSize: 42, color: 'rgba(255,255,255,0.55)', position: 'relative' }} />
                        </Box>
                      )}

                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{
                              color: evento.estado ? '#800020' : '#8a8a8a',
                              minHeight: '2.6em',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              flex: 1,
                            }}
                          >
                            {evento.titulo}
                          </Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                          <Switch
                            size="small"
                            checked={!!evento.estado}
                            onChange={() => manejarAlternarEstado(evento)}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#800020' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#800020' } }}
                          />
                          <Chip
                            size="small"
                            label={estadoInfo.texto}
                            sx={{
                              fontWeight: 700,
                              bgcolor: evento.estado ? 'rgba(46,125,50,0.1)' : 'rgba(0,0,0,0.1)',
                              color: evento.estado ? '#2e7d32' : '#757575',
                            }}
                          />
                          {esFinalizado && (
                            <Chip
                              size="small"
                              icon={<DoneAllIcon sx={{ fontSize: 14 }} />}
                              label="Finalizado"
                              sx={{ fontWeight: 700, bgcolor: 'rgba(128,0,32,0.1)', color: '#800020' }}
                            />
                          )}
                        </Stack>

                        <Stack spacing={0.5} sx={{ mb: 1.5, color: 'text.secondary' }}>
                          <Stack direction="row" spacing={0.7} alignItems="center">
                            <EventIcon fontSize="inherit" />
                            <Typography variant="body2">{formatearFecha(evento.fecha || evento.createdAt)}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.7} alignItems="center">
                            <PlaceIcon fontSize="inherit" />
                            <Typography variant="body2" noWrap>{evento.lugar}</Typography>
                          </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, rowGap: 1, minHeight: 24 }}>
                          {evento.documentoConvocatoria && (
                            <Chip
                              size="small"
                              icon={<DescriptionIcon />}
                              label="Convocatoria"
                              onClick={() => abrirDocumentoParaVer(resolverUrlArchivo(evento.documentoConvocatoria))}
                              clickable
                              sx={{ color: '#800020' }}
                            />
                          )}
                          {evento.documentoDeslinde && (
                            <Chip
                              size="small"
                              icon={<ShieldIcon />}
                              label="Deslinde"
                              onClick={() => abrirDocumentoParaVer(resolverUrlArchivo(evento.documentoDeslinde))}
                              clickable
                            />
                          )}
                        </Stack>

                        <Box sx={{ mt: 'auto' }}>
                          <Divider sx={{ mb: 1.5 }} />
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => manejarVerConvocatorias(evento)}
                              startIcon={<PeopleIcon />}
                              sx={{
                                color: '#800020',
                                borderColor: '#800020',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                '&:hover': { borderColor: '#800020', backgroundColor: 'rgba(128, 0, 32, 0.04)' }
                              }}
                            >
                              Convocatorias ({evento.convocatorias ? evento.convocatorias.length : 0})
                            </Button>
                            <Tooltip title="Ver detalles del evento">
                              <MuiIconButton size="small" onClick={() => manejarVerEvento(evento)} sx={{ color: '#800020' }}>
                                <VisibilityIcon fontSize="small" />
                              </MuiIconButton>
                            </Tooltip>
                            <Tooltip title="Ver todos los participantes del evento">
                              <MuiIconButton size="small" onClick={() => manejarVerParticipantes(evento)} sx={{ color: '#7A4069' }}>
                                <GroupsIcon fontSize="small" />
                              </MuiIconButton>
                            </Tooltip>
                            <Tooltip title="Editar evento">
                              <MuiIconButton size="small" onClick={() => manejarAbrirEditar(evento)} sx={{ color: '#1565c0' }}>
                                <EditIcon fontSize="small" />
                              </MuiIconButton>
                            </Tooltip>
                            <Tooltip title={evento.finalizado ? 'Reabrir evento' : 'Finalizar evento'}>
                              <MuiIconButton
                                size="small"
                                onClick={() => manejarFinalizarEvento(evento, !evento.finalizado)}
                                sx={{ color: evento.finalizado ? '#757575' : '#800020' }}
                              >
                                {evento.finalizado ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                              </MuiIconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar evento">
                              <MuiIconButton size="small" onClick={() => manejarEliminarEvento(evento)} sx={{ color: '#A13A3A' }}>
                                <DeleteIcon fontSize="small" />
                              </MuiIconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* Modal de Participantes */}
      <Dialog open={modalParticipantesAbierto} onClose={manejarCerrarParticipantes} maxWidth="sm" fullWidth>
        <DialogTitle>
          Participantes de "{eventoSeleccionado?.titulo}"
          {eventoSeleccionado?.convocatoriaSeleccionada && (
            <Typography variant="subtitle2" component="div" sx={{ color: '#800020', mt: 1 }}>
              Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {cargandoParticipantes ? (
            <CircularProgress />
          ) : participantes.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              No hay participantes inscritos en esta convocatoria.
            </Typography>
          ) : (
            <List>
              {participantes.map((p, idx) => (
                <ListItem
                  key={idx}
                  divider
                  secondaryAction={
                    <Tooltip title="Dar de baja a este atleta">
                      <MuiIconButton edge="end" onClick={() => manejarDarDeBajaAtleta(p)} sx={{ color: '#A13A3A' }}>
                        <PersonRemoveIcon />
                      </MuiIconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={[p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ') || 'Nombre no disponible'}
                    secondary={
                      <>
                        <b>Edad:</b> {p.edad ?? 'N/A'} años <br />
                        <b>Género:</b> {p.genero || 'N/A'} <br />
                        <b>Disciplina:</b> <Box component="span" sx={{ color: '#A13A3A', fontWeight: 700 }}>{p.disciplina || 'N/A'}</Box> — <b>Categoría:</b> {p.categoria || 'N/A'} <br />
                        <b>Fecha de Inscripción:</b> {formatearFecha(p.fecha_inscripcion)} <br />
                        <b>Estado:</b> {p.validado ? 'Validado' : 'Pendiente'}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={manejarCerrarParticipantes} color="secondary">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Convocatorias */}
      <Dialog open={modalConvocatoriasAbierto} onClose={manejarCerrarConvocatorias} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="h6" component="div" sx={{ color: '#800020', fontWeight: 'bold' }}>
              Convocatorias del Evento: {eventoConvocatorias?.titulo}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={manejarAbrirAgregarConvocatoria}
              sx={{ bgcolor: '#800020', '&:hover': { bgcolor: '#5c0017' }, whiteSpace: 'nowrap' }}
            >
              Agregar Convocatoria
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {eventoConvocatorias && eventoConvocatorias.convocatorias ? (
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '16%' }}><strong>Disciplina</strong></TableCell>
                  <TableCell sx={{ width: '12%' }}><strong>Categoría</strong></TableCell>
                  <TableCell sx={{ width: '14%' }}><strong>Rango de Edad</strong></TableCell>
                  <TableCell sx={{ width: '12%' }}><strong>Género</strong></TableCell>
                  <TableCell sx={{ width: '9%' }}><strong>Hora</strong></TableCell>
                  <TableCell sx={{ width: '10%' }}><strong>Estado</strong></TableCell>
                  <TableCell sx={{ width: '27%' }}><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eventoConvocatorias.convocatorias.map((convocatoria, index) => {
                  const estadoInfo = obtenerEstado(convocatoria.estado);
                  return (
                    <TableRow key={index}>
                      <TableCell sx={{ width: '16%' }}>
                        <Typography variant="subtitle2" fontWeight="bold" noWrap>
                          {convocatoria.disciplina}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '12%' }}>{convocatoria.categoria}</TableCell>
                      <TableCell sx={{ width: '14%' }}>{convocatoria.edadMin} - {convocatoria.edadMax} años</TableCell>
                      <TableCell sx={{ width: '12%' }}>
                        <Chip 
                          label={textoGenero(convocatoria.genero)}
                          color={colorGenero(convocatoria.genero)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ width: '9%' }}>
                        {convocatoria.hora ? convocatoria.hora.slice(0, 5) : '—'}
                      </TableCell>
                      <TableCell sx={{ width: '10%' }}>
                        <Chip 
                          label={estadoInfo.texto} 
                          color={estadoInfo.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ width: '27%' }}>
                        <Box display="flex" gap={0.5}>
                          <IconButton 
                            size="small" 
                            onClick={() => manejarVerDetalleConvocatoria(eventoConvocatorias, convocatoria)}
                            color="primary"
                            title="Ver detalles de la convocatoria"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => manejarVerParticipantesConvocatoria(eventoConvocatorias, convocatoria)}
                            color="secondary"
                            title="Ver participantes de esta convocatoria"
                          >
                            <PeopleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => manejarAbrirEditarConvocatoria(convocatoria, eventoConvocatorias)}
                            sx={{ color: '#1565c0' }}
                            title="Editar convocatoria"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => manejarEliminarConvocatoria(convocatoria, eventoConvocatorias)}
                            sx={{ color: '#A13A3A' }}
                            title="Eliminar convocatoria"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              No hay convocatorias para este evento.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={manejarCerrarConvocatorias} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalle de Convocatoria */}
      <Dialog open={modalDetalleConvocatoriaAbierto} onClose={manejarCerrarDetalleConvocatoria} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Detalles de la Convocatoria
          </Typography>
          {convocatoriaDetalle?.eventoTitulo && (
            <Typography variant="subtitle2" component="div" sx={{ color: '#7A4069', mt: 0.5 }}>
              {convocatoriaDetalle.eventoTitulo}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {convocatoriaDetalle && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: '#7A4069', fontWeight: 700, textTransform: 'uppercase' }}>Disciplina</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{convocatoriaDetalle.disciplina}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                <Chip label={convocatoriaDetalle.categoria} size="small" sx={{ border: '1px solid #7A4069', bgcolor: 'transparent', color: '#7A4069' }} />
                <Chip
                  label={textoGenero(convocatoriaDetalle.genero)}
                  size="small" sx={{ border: '1px solid rgba(128,0,32,0.18)', bgcolor: 'transparent' }}
                />
                <Chip label={`${convocatoriaDetalle.edadMin}-${convocatoriaDetalle.edadMax} años`} size="small" sx={{ border: '1px solid rgba(128,0,32,0.18)', bgcolor: 'transparent' }} />
                <Chip
                  label={obtenerEstado(convocatoriaDetalle.estado).texto}
                  color={obtenerEstado(convocatoriaDetalle.estado).color}
                  size="small"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={manejarCerrarDetalleConvocatoria} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Editar Evento */}
      <Dialog open={modalEditarAbierto} onClose={manejarCerrarEditar} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Editar Evento
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Título del evento"
              value={formEditar.titulo}
              onChange={(e) => setFormEditar((p) => ({ ...p, titulo: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Lugar"
              value={formEditar.lugar}
              onChange={(e) => setFormEditar((p) => ({ ...p, lugar: e.target.value }))}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="Fecha"
                value={formEditar.fecha}
                onChange={(e) => setFormEditar((p) => ({ ...p, fecha: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                type="time"
                label="Hora"
                value={formEditar.hora}
                onChange={(e) => setFormEditar((p) => ({ ...p, hora: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Descripción"
              value={formEditar.descripcion}
              onChange={(e) => setFormEditar((p) => ({ ...p, descripcion: e.target.value }))}
            />

            <Divider />
            <Typography variant="subtitle2" sx={{ color: '#7A4069', fontWeight: 700 }}>
              Reemplazar archivos (opcional — deja en blanco para conservar los actuales)
            </Typography>

            <Button variant="outlined" component="label" startIcon={<ImageIcon />} sx={{ justifyContent: 'flex-start', color: '#7A4069', borderColor: '#7A4069' }}>
              {imagenEditar ? imagenEditar.name : 'Reemplazar imagen del evento'}
              <input type="file" accept="image/*" hidden onChange={(e) => setImagenEditar(e.target.files?.[0] || null)} />
            </Button>
            <Button variant="outlined" component="label" startIcon={<DescriptionIcon />} sx={{ justifyContent: 'flex-start', color: '#7A4069', borderColor: '#7A4069' }}>
              {documentoConvocatoriaEditar ? documentoConvocatoriaEditar.name : 'Reemplazar documento de convocatoria'}
              <input type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => setDocumentoConvocatoriaEditar(e.target.files?.[0] || null)} />
            </Button>
            <Button variant="outlined" component="label" startIcon={<ShieldIcon />} sx={{ justifyContent: 'flex-start', color: '#7A4069', borderColor: '#7A4069' }}>
              {documentoDeslindeEditar ? documentoDeslindeEditar.name : 'Reemplazar deslinde de responsabilidad'}
              <input type="file" accept=".pdf,.doc,.docx,image/*" hidden onChange={(e) => setDocumentoDeslindeEditar(e.target.files?.[0] || null)} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            onClick={() => { manejarCerrarEditar(); manejarEliminarEvento(eventoEnEdicion); }}
            startIcon={<DeleteIcon />}
            sx={{ color: '#A13A3A' }}
          >
            Eliminar Evento
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={manejarCerrarEditar} sx={{ color: '#7A4069' }}>Cancelar</Button>
            <Button
              onClick={manejarGuardarEdicion}
              variant="contained"
              disabled={guardandoEdicion}
              sx={{ bgcolor: '#800020', '&:hover': { bgcolor: '#5c0017' } }}
            >
              {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Modal de Editar Convocatoria */}
      <Dialog open={modalEditarConvocatoriaAbierto} onClose={manejarCerrarEditarConvocatoria} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Editar Convocatoria
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '16px', pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Disciplina"
              value={formEditarConvocatoria.disciplina_id}
              onChange={manejarDisciplinaChangeEditar}
              disabled={catalogosCargando}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">Seleccione una disciplina</option>
              {disciplinas.map((disc) => (
                <option key={disc.id} value={disc.id}>{disc.nombre}</option>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Categoría"
              value={formEditarConvocatoria.categoria_id}
              onChange={manejarCategoriaChangeEditar}
              disabled={catalogosCargando}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Rango de edad"
              value={formEditarConvocatoria.edadMin !== '' ? `${formEditarConvocatoria.edadMin} - ${formEditarConvocatoria.edadMax} años` : ''}
              slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
              helperText="Se define automáticamente según la categoría"
            />

            <TextField
              select
              fullWidth
              label="Género"
              value={formEditarConvocatoria.genero_id}
              onChange={manejarGeneroChangeEditar}
              disabled={catalogosCargando}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">Seleccione un género</option>
              {generos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </TextField>

            <TextField
              fullWidth
              type="time"
              label="Hora de esta prueba (opcional)"
              value={formEditarConvocatoria.hora}
              onChange={(e) => setFormEditarConvocatoria((p) => ({ ...p, hora: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Déjalo en blanco si aplica el horario general del evento"
            />
          </Box>
          <Alert severity="info" sx={{ mt: 2.5 }}>
            Si hay atletas ya inscritos en esta convocatoria, el cambio no los da de baja — pero sí puede dejarlos
            inscritos en una disciplina/categoría/género distinto al que eligieron originalmente. Úsalo con cuidado
            si ya hay inscripciones.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={manejarCerrarEditarConvocatoria} sx={{ color: '#7A4069' }}>Cancelar</Button>
          <Button
            onClick={manejarGuardarEdicionConvocatoria}
            variant="contained"
            disabled={guardandoEdicionConvocatoria}
            sx={{ bgcolor: '#800020', '&:hover': { bgcolor: '#5c0017' } }}
          >
            {guardandoEdicionConvocatoria ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Agregar Convocatoria */}
      <Dialog open={modalAgregarConvocatoriaAbierto} onClose={manejarCerrarAgregarConvocatoria} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Agregar Convocatoria
          </Typography>
          <Typography variant="subtitle2" component="div" sx={{ color: '#7A4069', mt: 0.5 }}>
            {eventoConvocatorias?.titulo}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '16px', pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Disciplina"
              value={formNuevaConvocatoria.disciplina_id}
              onChange={manejarDisciplinaChangeNueva}
              disabled={catalogosCargando}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">Seleccione una disciplina</option>
              {disciplinas.map((disc) => (
                <option key={disc.id} value={disc.id}>{disc.nombre}</option>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Categoría"
              value={formNuevaConvocatoria.categoria_id}
              onChange={manejarCategoriaChangeNueva}
              disabled={catalogosCargando}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Rango de edad"
              value={formNuevaConvocatoria.edadMin !== '' ? `${formNuevaConvocatoria.edadMin} - ${formNuevaConvocatoria.edadMax} años` : ''}
              slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
              helperText="Se define automáticamente según la categoría"
            />

            <TextField
              select
              fullWidth
              label="Género"
              value={formNuevaConvocatoria.genero_id}
              onChange={manejarGeneroChangeNueva}
              disabled={catalogosCargando}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">Seleccione un género</option>
              {generos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </TextField>

            <TextField
              fullWidth
              type="time"
              label="Hora de esta prueba (opcional)"
              value={formNuevaConvocatoria.hora}
              onChange={(e) => setFormNuevaConvocatoria((p) => ({ ...p, hora: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Déjalo en blanco si aplica el horario general del evento"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={manejarCerrarAgregarConvocatoria} sx={{ color: '#7A4069' }}>Cancelar</Button>
          <Button
            onClick={manejarGuardarNuevaConvocatoria}
            variant="contained"
            disabled={guardandoNuevaConvocatoria}
            sx={{ bgcolor: '#800020', '&:hover': { bgcolor: '#5c0017' } }}
          >
            {guardandoNuevaConvocatoria ? 'Guardando...' : 'Agregar Convocatoria'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionarEventos;