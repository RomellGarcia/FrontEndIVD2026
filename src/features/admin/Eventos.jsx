import { perfilEmpresaAPI, eventosAPI, catalogosAPI } from '../../api/index.js';
// components/AgregarEvento.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// import { PDFDownloadLink, Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';

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

const MySwal = withReactContent(Swal);

// Base del backend (usada para armar la URL completa de imágenes y documentos subidos)
const API_BASE_URL = 'http://localhost:5000';

// Convierte una ruta relativa que devuelve el backend (ej. "/uploads/evento-1.jpg")
// en una URL completa y absoluta que el navegador pueda cargar.
const resolveArchivoUrl = (ruta) => {
  if (!ruta) return '';
  if (/^(https?:|blob:|data:)/i.test(ruta)) return ruta;
  return `${API_BASE_URL}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
};

// Los PDF los abre el navegador solo, sin ayuda. Los Word (.doc/.docx) no
// se pueden ver en el navegador de forma nativa, así que esos pasan por el
// visor público de Google Docs, que sabe renderizarlos sin descargarlos.
const abrirDocumentoParaVer = (url) => {
  if (!url) return;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  const urlFinal = esPdf ? url : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  window.open(urlFinal, '_blank', 'noopener,noreferrer');
};

// El backend podría devolver el campo de la imagen con distintos nombres
// según cómo se haya implementado el endpoint; probamos los más comunes.
const obtenerImagenEvento = (evento) => {
  if (!evento) return '';
  const posiblesCampos = ['imagen', 'imagenUrl', 'imagen_url', 'foto', 'flyer', 'banner', 'bannerUrl', 'imagePath', 'imagePath'];
  for (const campo of posiblesCampos) {
    if (evento[campo]) return evento[campo];
  }
  return '';
};

// Disciplinas, categorías y géneros ya NO son listas fijas: se piden al
// backend (catalogosAPI) para tener los id reales que espera createEventoSchema.

const AgregarEvento = () => {
  const [evento, setEvento] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    lugar: '',
    descripcion: '',
  });

  // Zona de convocatoria: imagen del evento y documentos adjuntos
  const [imagenEvento, setImagenEvento] = useState(null); // File
  const [imagenPreview, setImagenPreview] = useState('');
  const [documentoConvocatoria, setDocumentoConvocatoria] = useState(null); // File (PDF/DOC de la convocatoria oficial)
  const [documentoDeslinde, setDocumentoDeslinde] = useState(null); // File (deslinde de responsabilidad firmado/anexo)
  const [aceptaDeslinde, setAceptaDeslinde] = useState(false); // checkbox de aceptación de riesgo

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
    }
  ]);
  const [showConvocatoriasForm, setShowConvocatoriasForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalParticipantesOpen, setModalParticipantesOpen] = useState(false);
  const [vista, setVista] = useState('lista');
  const [modalDetalleConvocatoriaOpen, setModalDetalleConvocatoriaOpen] = useState(false);
  const [convocatoriaDetalle, setConvocatoriaDetalle] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [modalConvocatoriasOpen, setModalConvocatoriasOpen] = useState(false);
  const [eventoConvocatorias, setEventoConvocatorias] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [catalogosCargando, setCatalogosCargando] = useState(true);
  const [tabActivo, setTabActivo] = useState('crear');
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [eventoAEditar, setEventoAEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({ titulo: '', fecha: '', hora: '', lugar: '', descripcion: '' });
  const [imagenEditar, setImagenEditar] = useState(null);
  const [documentoConvocatoriaEditar, setDocumentoConvocatoriaEditar] = useState(null);
  const [documentoDeslindeEditar, setDocumentoDeslindeEditar] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [modalEditarConvocatoriaOpen, setModalEditarConvocatoriaOpen] = useState(false);
  const [convocatoriaAEditar, setConvocatoriaAEditar] = useState(null);
  const [formEditarConvocatoria, setFormEditarConvocatoria] = useState({
    disciplina_id: '', disciplina: '', categoria_id: '', categoria: '',
    edadMin: '', edadMax: '', genero_id: '', genero: '',
  });
  const [guardandoEdicionConvocatoria, setGuardandoEdicionConvocatoria] = useState(false);
  const [modalAgregarConvocatoriaOpen, setModalAgregarConvocatoriaOpen] = useState(false);
  const [formNuevaConvocatoria, setFormNuevaConvocatoria] = useState({
    disciplina_id: '', disciplina: '', categoria_id: '', categoria: '',
    edadMin: '', edadMax: '', genero_id: '', genero: '',
  });
  const [guardandoNuevaConvocatoria, setGuardandoNuevaConvocatoria] = useState(false);

  // Cargar eventos al montar el componente
  useEffect(() => {
    cargarEventos();
    fetchLogo();
    cargarCatalogos();
  }, []);

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

  const cargarEventos = async () => {
  try {
    setLoadingEventos(true);
    const response = await eventosAPI.getAll({ todos: true });
    const data = response.data;
    const listaEventos = Array.isArray(data)
      ? data
      : Array.isArray(data?.eventos)
        ? data.eventos
        : [];
    // Los cerrados van siempre al final, para no mezclarlos con los activos
    listaEventos.sort((a, b) => Number(!!b.estado) - Number(!!a.estado));
    setEventos(listaEventos);
    if (listaEventos.length > 0) {
      // Ayuda a depurar: revisa en la consola del navegador qué campo
      // usa el backend para la imagen si las tarjetas no la muestran.
      console.log('Campos disponibles en un evento:', Object.keys(listaEventos[0]), listaEventos[0]);
    }
  } catch (error) {
    console.error('Error al cargar eventos:', error);
    setEventos([]);
    if (eventos.length > 0) {
      MySwal.fire({
        title: 'Error!',
        text: 'Error al cargar los eventos',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  } finally {
    setLoadingEventos(false);
  }
};

  const handleAbrirEditar = (evento) => {
    setEventoAEditar(evento);
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
    setModalEditarOpen(true);
  };

  const handleCerrarEditar = () => {
    setModalEditarOpen(false);
    setEventoAEditar(null);
  };

  const handleGuardarEdicion = async () => {
    if (!eventoAEditar) return;
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

      await eventosAPI.update(eventoAEditar.id, formData);
      handleCerrarEditar();
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

  const handleToggleEstado = async (evento) => {
    const nuevoEstado = !evento.estado;
    try {
      await eventosAPI.toggleEstado(evento.id, nuevoEstado);
      await cargarEventos();
    } catch (error) {
      console.error('Error al cambiar estado del evento:', error);
      MySwal.fire({ title: 'Error', text: 'No se pudo cambiar el estado del evento.', icon: 'error', confirmButtonText: 'OK' });
    }
  };

  const handleEliminarEvento = async (evento) => {
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

  const handleEliminarConvocatoria = async (convocatoria, eventoPadre) => {
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
        const actualizado = (await eventosAPI.getAll()).data.eventos?.find((e) => e.id === eventoPadre.id);
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

  const handleAbrirEditarConvocatoria = (convocatoria, eventoPadre) => {
    // El backend (findAll) no manda disciplina_id/categoria_id/genero_id, solo
    // los nombres — así que los resolvemos contra los catálogos ya cargados.
    const disc = disciplinas.find((d) => d.id === convocatoria.disciplina_id) || disciplinas.find((d) => (d.nombre || '').toLowerCase() === (convocatoria.disciplina || '').toLowerCase());
    const cat = categorias.find((c) => c.id === convocatoria.categoria_id) || categorias.find((c) => (c.nombre || '').toLowerCase() === (convocatoria.categoria || '').toLowerCase());
    const gen = generos.find((g) => g.id === convocatoria.genero_id) || generos.find((g) => (g.nombre || '').toLowerCase() === (convocatoria.genero || '').toLowerCase());

    setConvocatoriaAEditar({ ...convocatoria, eventoPadreId: eventoPadre?.id });
    setFormEditarConvocatoria({
      disciplina_id: disc?.id ?? '',
      disciplina: disc?.nombre ?? convocatoria.disciplina ?? '',
      categoria_id: cat?.id ?? '',
      categoria: cat?.nombre ?? convocatoria.categoria ?? '',
      edadMin: cat?.edad_min ?? convocatoria.edadMin ?? '',
      edadMax: cat?.edad_max ?? convocatoria.edadMax ?? '',
      genero_id: gen?.id ?? '',
      genero: gen?.nombre ?? convocatoria.genero ?? '',
    });
    setModalEditarConvocatoriaOpen(true);
  };

  const handleCerrarEditarConvocatoria = () => {
    setModalEditarConvocatoriaOpen(false);
    setConvocatoriaAEditar(null);
  };

  const handleDisciplinaChangeEditar = (e) => {
    const id = Number(e.target.value);
    const disc = disciplinas.find((d) => d.id === id);
    setFormEditarConvocatoria((p) => ({ ...p, disciplina_id: id, disciplina: disc?.nombre || '' }));
  };

  const handleCategoriaChangeEditar = (e) => {
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

  const handleGeneroChangeEditar = (e) => {
    const id = Number(e.target.value);
    const gen = generos.find((g) => g.id === id);
    setFormEditarConvocatoria((p) => ({ ...p, genero_id: id, genero: gen?.nombre || '' }));
  };

  const handleGuardarEdicionConvocatoria = async () => {
    if (!convocatoriaAEditar) return;
    if (!formEditarConvocatoria.disciplina_id || !formEditarConvocatoria.categoria_id || !formEditarConvocatoria.genero_id) {
      MySwal.fire({ title: 'Faltan datos', text: 'Selecciona disciplina, categoría y género.', icon: 'warning', confirmButtonText: 'OK' });
      return;
    }
    try {
      setGuardandoEdicionConvocatoria(true);
      await eventosAPI.updateConvocatoria(convocatoriaAEditar.id, {
        disciplina_id: formEditarConvocatoria.disciplina_id,
        categoria_id: formEditarConvocatoria.categoria_id,
        genero_id: formEditarConvocatoria.genero_id,
      });
      handleCerrarEditarConvocatoria();
      await cargarEventos();
      // Refrescar la convocatoria abierta en el modal, si sigue abierto
      if (eventoConvocatorias?.id === convocatoriaAEditar.eventoPadreId) {
        const actualizado = (await eventosAPI.getAll({ todos: true })).data.eventos?.find((e) => e.id === convocatoriaAEditar.eventoPadreId);
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

  const handleAbrirAgregarConvocatoria = () => {
    setFormNuevaConvocatoria({
      disciplina_id: '', disciplina: '', categoria_id: '', categoria: '',
      edadMin: '', edadMax: '', genero_id: '', genero: '',
    });
    setModalAgregarConvocatoriaOpen(true);
  };

  const handleCerrarAgregarConvocatoria = () => {
    setModalAgregarConvocatoriaOpen(false);
  };

  const handleDisciplinaChangeNueva = (e) => {
    const id = Number(e.target.value);
    const disc = disciplinas.find((d) => d.id === id);
    setFormNuevaConvocatoria((p) => ({ ...p, disciplina_id: id, disciplina: disc?.nombre || '' }));
  };

  const handleCategoriaChangeNueva = (e) => {
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

  const handleGeneroChangeNueva = (e) => {
    const id = Number(e.target.value);
    const gen = generos.find((g) => g.id === id);
    setFormNuevaConvocatoria((p) => ({ ...p, genero_id: id, genero: gen?.nombre || '' }));
  };

  const handleGuardarNuevaConvocatoria = async () => {
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
      });
      handleCerrarAgregarConvocatoria();
      await cargarEventos();
      // Refrescar la convocatoria abierta en el modal, para que la nueva aparezca en la tabla al toque
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

  const handleDarDeBajaAtleta = async (participante) => {
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

  const fetchLogo = async () => {
    try {
      const response = await perfilEmpresaAPI.get();
      setLogoUrl(response.data.perfil.logo || '');
    } catch (error) {
      setLogoUrl('');
    }
  };

  const handleDisciplinaChange = (index, e) => {
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

  const handleCategoriaChange = (index, e) => {
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

  const handleGeneroChange = (index, e) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvento({ ...evento, [name]: value });
  };

  // Imagen del evento (banner/flyer)
  const handleImagenChange = (e) => {
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

  const handleQuitarImagen = () => {
    setImagenEvento(null);
    setImagenPreview('');
  };

  // Documento oficial de la convocatoria (PDF/DOC)
  const handleDocumentoConvocatoriaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const permitido = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!permitido.includes(file.type)) {
      MySwal.fire({ title: 'Error!', text: 'El documento de convocatoria debe ser PDF o Word.', icon: 'error' });
      return;
    }
    setDocumentoConvocatoria(file);
  };

  // Documento de deslinde de responsabilidad (aviso de riesgo / consentimiento)
  const handleDocumentoDeslindeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const permitido = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (!permitido.includes(file.type)) {
      MySwal.fire({ title: 'Error!', text: 'El documento de deslinde debe ser PDF, Word o imagen.', icon: 'error' });
      return;
    }
    setDocumentoDeslinde(file);
  };

  const handleConvocatoriaChange = (index, e) => {
    const { name, value } = e.target;
    const nuevasConvocatorias = [...convocatorias];
    nuevasConvocatorias[index] = {
      ...nuevasConvocatorias[index],
      [name]: value,
    };
    setConvocatorias(nuevasConvocatorias);
  };

  const addConvocatoria = () => {
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
      }
    ]);
  };

  const removeConvocatoria = (index) => {
    if (convocatorias.length > 1) {
      const nuevasConvocatorias = convocatorias.filter((_, i) => i !== index);
      setConvocatorias(nuevasConvocatorias);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación frontend
    if (!evento.titulo || !evento.fecha || !evento.hora || !evento.lugar) {
      MySwal.fire({
        title: 'Error!',
        text: 'Todos los campos del evento son requeridos',
        icon: 'error',
        confirmButtonText: 'OK',
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

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(evento).forEach(([key, value]) => formData.append(key, value));
      const convocatoriasParaEnviar = convocatorias.map((c) => ({
        disciplina_id: c.disciplina_id,
        categoria_id: c.categoria_id,
        genero_id: c.genero_id,
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
        
        // Resetear formularios
        setEvento({
          titulo: '',
          fecha: '',
          hora: '',
          lugar: '',
          descripcion: '',
        });
        setConvocatorias([
          {
            disciplina: '',
            categoria: '',
            edadMin: '',
            edadMax: '',
            genero: 'mixto',
          }
        ]);
        setShowConvocatoriasForm(false);
        handleQuitarImagen();
        setDocumentoConvocatoria(null);
        setDocumentoDeslinde(null);
        setAceptaDeslinde(false);
        
        // Recargar eventos después de crear uno nuevo
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
      setLoading(false);
    }
  };

  const handleVerParticipantes = async (evento) => {
    setEventoSeleccionado(evento);
    setModalParticipantesOpen(true);
    setLoadingParticipantes(true);
    try {
      const response = await eventosAPI.getParticipantes(evento.id);
      setParticipantes(response.data.participantes || []);
    } catch (error) {
      setParticipantes([]);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  const handleVerEvento = (evento) => {
    setEventoSeleccionado(evento);
    setVista('detalle');
  };

  const handleVerPDF = (evento) => {
    if (!evento.documentoConvocatoria) {
      MySwal.fire({
        title: 'Sin documento',
        text: 'Este evento no tiene un documento de convocatoria subido.',
        icon: 'info',
        confirmButtonText: 'OK',
      });
      return;
    }
    abrirDocumentoParaVer(resolveArchivoUrl(evento.documentoConvocatoria));
  };

  const handleCerrarParticipantes = () => {
      setModalParticipantesOpen(false);
      setEventoSeleccionado(null);
  };

  const handleCerrarEvento = () => {
      setVista('lista');
      setEventoSeleccionado(null);
  };

  const handleCerrarConvocatorias = () => {
      setModalConvocatoriasOpen(false);
      setEventoConvocatorias(null);
  };

  const obtenerColorEstado = (estado) => {
    return estado ? 'success' : 'error';
  };

  const obtenerTextoEstado = (estado) => {
    return estado ? 'Activo' : 'Cancelado';
  };

  // La comparación exacta contra 'masculino'/'mixto' en minúsculas fallaba
  // silenciosamente a "Femenino" apenas el valor de la BD viniera con otra
  // capitalización o espacios (p. ej. "Masculino" en vez de "masculino") —
  // por eso una convocatoria masculina se veía marcada como femenina en la
  // tabla. Normalizamos antes de comparar, y si de plano no reconocemos el
  // valor, mostramos el valor crudo en vez de adivinar.
  const textoGenero = (genero) => {
    const v = (genero || '').toLowerCase().trim();
    if (v === 'masculino') return 'Masculino';
    if (v === 'femenino') return 'Femenino';
    if (v === 'mixto') return 'Mixto';
    return genero || 'N/A';
  };

  const colorGenero = (genero) => {
    const v = (genero || '').toLowerCase().trim();
    if (v === 'masculino') return 'primary';
    if (v === 'femenino') return 'secondary';
    return 'default';
  };

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


  const handleVerConvocatorias = (evento) => {
    setEventoConvocatorias(evento);
    setModalConvocatoriasOpen(true);
  };

  const handleVerParticipantesConvocatoria = async (evento, convocatoria, index) => {
    setEventoSeleccionado({ ...evento, convocatoriaSeleccionada: convocatoria, convocatoriaIndex: index });
    setModalParticipantesOpen(true);
    setLoadingParticipantes(true);
    try {
      const response = await eventosAPI.getParticipantesPorConvocatoria(convocatoria.id);
      setParticipantes(response.data.participantes || []);
    } catch (error) {
      setParticipantes([]);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  const handleVerEventoConvocatoria = (evento, convocatoria, index) => {
    setConvocatoriaDetalle({ ...convocatoria, eventoTitulo: evento?.titulo, convocatoriaIndex: index });
    setModalDetalleConvocatoriaOpen(true);
  };

  const handleCerrarDetalleConvocatoria = () => {
    setModalDetalleConvocatoriaOpen(false);
    setConvocatoriaDetalle(null);
  };

  if (vista === 'detalle' && eventoSeleccionado) {
    return (
      <Box sx={{ bgcolor: '#e4e4e5', minHeight: '100vh' }}>
        <style>{`.swal2-container { z-index: 2000 !important; }`}</style>

        <Box sx={{ bgcolor: '#800020', color: '#fff', pt: { xs: 4, md: 5 }, pb: { xs: 6, md: 7 } }}>
          <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 } }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleCerrarEvento}
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
                  src={resolveArchivoUrl(obtenerImagenEvento(eventoSeleccionado))}
                  alt={eventoSeleccionado.titulo}
                  sx={{ width: '100%', height: { xs: 260, md: 300 }, objectFit: 'cover', borderRadius: '8px', mb: 2.5 }}
                />
              )}

              <Chip
                label={obtenerTextoEstado(eventoSeleccionado.estado)}
                color={obtenerColorEstado(eventoSeleccionado.estado)}
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
                      onClick={() => abrirDocumentoParaVer(resolveArchivoUrl(eventoSeleccionado.documentoConvocatoria))}
                      clickable
                      size="small"
                      sx={{ color: '#800020' }}
                    />
                  )}
                  {eventoSeleccionado.documentoDeslinde && (
                    <Chip
                      icon={<ShieldIcon />}
                      label="Deslinde"
                      onClick={() => abrirDocumentoParaVer(resolveArchivoUrl(eventoSeleccionado.documentoDeslinde))}
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
                  {eventoSeleccionado.convocatorias.map((conv, i) => (
                    <Box
                      key={conv.id || i}
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
                            label={obtenerTextoEstado(conv.estado)}
                            color={obtenerColorEstado(conv.estado)}
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

  return (
    <Box sx={{ bgcolor: '#e4e4e5', minHeight: '100vh', '& .MuiFormLabel-asterisk': { display: 'none' } }}>
      {/* Los modales de MUI usan z-index ~1300; SweetAlert2 por default usa
          1060, así que si se abre un Swal mientras hay un Dialog de MUI
          abierto, queda tapado detrás (invisible, aunque sí se dispare). */}
      <style>{`.swal2-container { z-index: 2000 !important; }`}</style>

      {/* ── Franja de bienvenida ── */}
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

        {/* ── Stat-strip flotante ── */}
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

        {/* ── Pestañas ── */}
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

        {tabActivo === 'crear' && (
        <>
      {/* Formulario para crear evento */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, mb: 4, borderRadius: 3, border: '1px solid #eee' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ width: 6, height: 28, borderRadius: 1, backgroundColor: '#800020' }} />
          <Typography variant="h5" sx={{ color: '#800020', fontWeight: 800 }}>
            Crear Nuevo Evento
          </Typography>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 7' } }}>
              <TextField
                fullWidth
                label="Título del evento"
                name="titulo"
                value={evento.titulo}
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
                placeholder="Detalles del evento (opcional)"
              />
            </Box>
          </Box>

          {/* ===================== ZONA DE CONVOCATORIA ===================== */}
          <Box
            sx={{
              mt: 4,
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px dashed #c9a2ad',
              backgroundColor: '#fdf6f8',
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
                  Imagen / Flyer del evento
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
                        onClick={handleQuitarImagen}
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
                      <input hidden type="file" accept="image/*" onChange={handleImagenChange} />
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
                    <input hidden type="file" accept="image/*" onChange={handleImagenChange} />
                  </Button>
                )}
              </Box>

              {/* Documento de convocatoria oficial */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#555', fontWeight: 700 }}>
                  <DescriptionIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                  Documento de convocatoria
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
                          <input hidden type="file" accept=".pdf,.doc,.docx" onChange={handleDocumentoConvocatoriaChange} />
                        </Button>
                        <Button size="small" color="error" onClick={() => setDocumentoConvocatoria(null)}>
                          Quitar
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Button component="label" startIcon={<CloudUploadIcon />} sx={{ color: '#800020' }}>
                      Subir documento
                      <input hidden type="file" accept=".pdf,.doc,.docx" onChange={handleDocumentoConvocatoriaChange} />
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
                  Deslinde de responsabilidad
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
                          <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleDocumentoDeslindeChange} />
                        </Button>
                        <Button size="small" color="error" onClick={() => setDocumentoDeslinde(null)}>
                          Quitar
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Button component="label" startIcon={<CloudUploadIcon />} sx={{ color: '#800020' }}>
                      Subir documento
                      <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleDocumentoDeslindeChange} />
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Aviso de riesgo / consentimiento firmado (opcional).
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
          {/* =================== FIN ZONA DE CONVOCATORIA =================== */}

          {/* Botón para mostrar/ocultar formulario de convocatorias */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setShowConvocatoriasForm(!showConvocatoriasForm)}
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
              {showConvocatoriasForm ? 'Ocultar Convocatorias' : 'Agregar Convocatorias'}
            </Button>
          </Box>

          {/* Formulario de convocatorias */}
          <Collapse in={showConvocatoriasForm}>
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
                          onClick={() => removeConvocatoria(index)}
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
                        onChange={(e) => handleDisciplinaChange(index, e)}
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
                        onChange={(e) => handleCategoriaChange(index, e)}
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
                        onChange={(e) => handleConvocatoriaChange(index, e)}
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
                        onChange={(e) => handleConvocatoriaChange(index, e)}
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
                        onChange={(e) => handleGeneroChange(index, e)}
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
                  </Box>
                </Box>
              ))}
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={addConvocatoria}
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
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <EventIcon />}
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
            {loading ? 'Guardando...' : 'Crear Evento con Convocatorias'}
          </Button>
        </form>
      </Paper>
        </>
        )}

        {tabActivo === 'ver' && (
        <>
      {/* Lista de eventos creados */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, border: '1px solid #eee' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ width: 6, height: 28, borderRadius: 1, backgroundColor: '#800020' }} />
          <Typography variant="h5" sx={{ color: '#800020', fontWeight: 800 }}>
            Eventos Creados
          </Typography>
        </Stack>

        {loadingEventos ? (
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
            {eventos.map((evento) => (
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
                      src={resolveArchivoUrl(obtenerImagenEvento(evento))}
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
                        backgroundColor: evento.estado ? '#fdf6f8' : '#e8e8e8',
                        color: evento.estado ? '#c9a2ad' : '#aaa',
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 42 }} />
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
                        onChange={() => handleToggleEstado(evento)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#800020' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#800020' } }}
                      />
                      <Chip
                        size="small"
                        label={evento.estado ? 'Activo' : 'Cerrado'}
                        sx={{
                          fontWeight: 700,
                          bgcolor: evento.estado ? 'rgba(46,125,50,0.1)' : 'rgba(0,0,0,0.1)',
                          color: evento.estado ? '#2e7d32' : '#757575',
                        }}
                      />
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
                          onClick={() => abrirDocumentoParaVer(resolveArchivoUrl(evento.documentoConvocatoria))}
                          clickable
                          sx={{ color: '#800020' }}
                        />
                      )}
                      {evento.documentoDeslinde && (
                        <Chip
                          size="small"
                          icon={<ShieldIcon />}
                          label="Deslinde"
                          onClick={() => abrirDocumentoParaVer(resolveArchivoUrl(evento.documentoDeslinde))}
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
                          onClick={() => handleVerConvocatorias(evento)}
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
                          <MuiIconButton size="small" onClick={() => handleVerEvento(evento)} sx={{ color: '#800020' }}>
                            <VisibilityIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                        <Tooltip title="Descargar convocatoria en PDF">
                          <MuiIconButton size="small" onClick={() => handleVerPDF(evento)} sx={{ color: '#2e7d32' }}>
                            <PictureAsPdfIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                        <Tooltip title="Ver todos los participantes del evento">
                          <MuiIconButton size="small" onClick={() => handleVerParticipantes(evento)} sx={{ color: '#7A4069' }}>
                            <GroupsIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                        <Tooltip title="Editar evento">
                          <MuiIconButton size="small" onClick={() => handleAbrirEditar(evento)} sx={{ color: '#1565c0' }}>
                            <EditIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar evento">
                          <MuiIconButton size="small" onClick={() => handleEliminarEvento(evento)} sx={{ color: '#A13A3A' }}>
                            <DeleteIcon fontSize="small" />
                          </MuiIconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
            ))}
          </Box>
        )}
      </Paper>
        </>
        )}

      </Box>

      {/* Modal de Participantes */}
      <Dialog open={modalParticipantesOpen} onClose={handleCerrarParticipantes} maxWidth="sm" fullWidth>
        <DialogTitle>
          Participantes de "{eventoSeleccionado?.titulo}"
          {eventoSeleccionado?.convocatoriaSeleccionada && (
            <Typography variant="subtitle2" component="div" sx={{ color: '#800020', mt: 1 }}>
              Convocatoria: {eventoSeleccionado.convocatoriaSeleccionada.disciplina} - {eventoSeleccionado.convocatoriaSeleccionada.categoria}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingParticipantes ? (
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
                      <MuiIconButton edge="end" onClick={() => handleDarDeBajaAtleta(p)} sx={{ color: '#A13A3A' }}>
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
          <Button onClick={handleCerrarParticipantes} color="secondary">Cerrar</Button>
        </DialogActions>
      </Dialog>


      {/* Modal de Convocatorias */}
      <Dialog open={modalConvocatoriasOpen} onClose={handleCerrarConvocatorias} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="h6" component="div" sx={{ color: '#800020', fontWeight: 'bold' }}>
              Convocatorias del Evento: {eventoConvocatorias?.titulo}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAbrirAgregarConvocatoria}
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
                  <TableCell sx={{ width: '18%' }}><strong>Disciplina</strong></TableCell>
                  <TableCell sx={{ width: '14%' }}><strong>Categoría</strong></TableCell>
                  <TableCell sx={{ width: '16%' }}><strong>Rango de Edad</strong></TableCell>
                  <TableCell sx={{ width: '14%' }}><strong>Género</strong></TableCell>
                  <TableCell sx={{ width: '12%' }}><strong>Estado</strong></TableCell>
                  <TableCell sx={{ width: '26%' }}><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eventoConvocatorias.convocatorias.map((convocatoria, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ width: '18%' }}>
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {convocatoria.disciplina}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ width: '14%' }}>{convocatoria.categoria}</TableCell>
                    <TableCell sx={{ width: '16%' }}>{convocatoria.edadMin} - {convocatoria.edadMax} años</TableCell>
                    <TableCell sx={{ width: '14%' }}>
                      <Chip 
                        label={textoGenero(convocatoria.genero)}
                        color={colorGenero(convocatoria.genero)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ width: '12%' }}>
                      <Chip 
                        label={obtenerTextoEstado(convocatoria.estado)} 
                        color={obtenerColorEstado(convocatoria.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ width: '26%' }}>
                      <Box display="flex" gap={0.5}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVerEventoConvocatoria(eventoConvocatorias, convocatoria, index)}
                          color="primary"
                          title="Ver detalles de la convocatoria"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleVerParticipantesConvocatoria(eventoConvocatorias, convocatoria, index)}
                          color="secondary"
                          title="Ver participantes de esta convocatoria"
                        >
                          <PeopleIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleAbrirEditarConvocatoria(convocatoria, eventoConvocatorias)}
                          sx={{ color: '#1565c0' }}
                          title="Editar convocatoria"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEliminarConvocatoria(convocatoria, eventoConvocatorias)}
                          sx={{ color: '#A13A3A' }}
                          title="Eliminar convocatoria"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              No hay convocatorias para este evento.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarConvocatorias} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalle de una Convocatoria (no de todo el evento) */}
      <Dialog open={modalDetalleConvocatoriaOpen} onClose={handleCerrarDetalleConvocatoria} maxWidth="xs" fullWidth>
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
                  label={obtenerTextoEstado(convocatoriaDetalle.estado)}
                  color={obtenerColorEstado(convocatoriaDetalle.estado)}
                  size="small"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarDetalleConvocatoria} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Editar Evento */}
      <Dialog open={modalEditarOpen} onClose={handleCerrarEditar} maxWidth="sm" fullWidth>
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
            onClick={() => { handleCerrarEditar(); handleEliminarEvento(eventoAEditar); }}
            startIcon={<DeleteIcon />}
            sx={{ color: '#A13A3A' }}
          >
            Eliminar Evento
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleCerrarEditar} sx={{ color: '#7A4069' }}>Cancelar</Button>
            <Button
              onClick={handleGuardarEdicion}
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
      <Dialog open={modalEditarConvocatoriaOpen} onClose={handleCerrarEditarConvocatoria} maxWidth="sm" fullWidth>
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
              onChange={handleDisciplinaChangeEditar}
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
              onChange={handleCategoriaChangeEditar}
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
              onChange={handleGeneroChangeEditar}
              disabled={catalogosCargando}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">Seleccione un género</option>
              {generos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </TextField>
          </Box>
          <Alert severity="info" sx={{ mt: 2.5 }}>
            Si hay atletas ya inscritos en esta convocatoria, el cambio no los da de baja — pero sí puede dejarlos
            inscritos en una disciplina/categoría/género distinto al que eligieron originalmente. Úsalo con cuidado
            si ya hay inscripciones.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCerrarEditarConvocatoria} sx={{ color: '#7A4069' }}>Cancelar</Button>
          <Button
            onClick={handleGuardarEdicionConvocatoria}
            variant="contained"
            disabled={guardandoEdicionConvocatoria}
            sx={{ bgcolor: '#800020', '&:hover': { bgcolor: '#5c0017' } }}
          >
            {guardandoEdicionConvocatoria ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Agregar Convocatoria */}
      <Dialog open={modalAgregarConvocatoriaOpen} onClose={handleCerrarAgregarConvocatoria} maxWidth="sm" fullWidth>
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
              onChange={handleDisciplinaChangeNueva}
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
              onChange={handleCategoriaChangeNueva}
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
              onChange={handleGeneroChangeNueva}
              disabled={catalogosCargando}
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            >
              <option value="">Seleccione un género</option>
              {generos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCerrarAgregarConvocatoria} sx={{ color: '#7A4069' }}>Cancelar</Button>
          <Button
            onClick={handleGuardarNuevaConvocatoria}
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

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#800020',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontWeight: '500',
    marginBottom: '5px',
    color: '#555',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#800020',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontWeight: 'bold',
  },
  'button:disabled': {
    backgroundColor: '#a0a0a0',
    cursor: 'not-allowed',
  },
};

export default AgregarEvento;