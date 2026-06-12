import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Politica = () => {
  const [politica, setPolitica] = useState({
    titulo: '',
    contenido: '',
  });
  const [politicas, setPoliticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPoliticas();
  }, []);

  const fetchPoliticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/contenido/politica');
      const formattedPoliticas = response.data.map((p) => ({
        _id: p._id,
        titulo: p.titulo || '',
        contenido: p.contenido || '',
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : null
      }));
      setPoliticas(formattedPoliticas);
    } catch (err) {
      setError('Error al cargar las políticas. Verifica tu conexión o el servidor.');
      console.error('Error al obtener políticas:', err.message);
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'titulo' && value.length > 255) return;
    if (name === 'contenido' && value.length > 2000) return;
    setPolitica({ ...politica, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!politica.titulo.trim() || !politica.contenido.trim()) {
      MySwal.fire({
        title: '¡Error!',
        text: 'El título y el contenido son obligatorios.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#800020',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { titulo: politica.titulo.trim(), contenido: politica.contenido.trim() };
      let response;

      if (editingId) {
        response = await axios.put(`http://localhost:5000/api/contenido/politica/${editingId}`, payload);
        if (response.status === 200 || response.status === 201) {
          MySwal.fire({
            title: '¡Éxito!',
            text: 'Política actualizada correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#7A4069',
          });
          // Actualizar la política en el estado local con verificación de datos
          const politicaActualizada = {
            _id: response.data._id,
            titulo: response.data.titulo || '',
            contenido: response.data.contenido || '',
            createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
          };
          setPoliticas(politicas.map((p) => p._id.toString() === editingId ? politicaActualizada : p));
        } else {
          throw new Error(response.data?.message || 'Error desconocido');
        }
      } else {
        response = await axios.post('http://localhost:5000/api/contenido/politica', payload);
        MySwal.fire({
          title: '¡Éxito!',
          text: 'Política creada correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#7A4069',
        });
        // Como solo puede haber una política, reemplazar completamente el array
        const nuevaPolitica = {
          _id: response.data._id,
          titulo: response.data.titulo || '',
          contenido: response.data.contenido || '',
          createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
        };
        setPoliticas([nuevaPolitica]);
      }
      setPolitica({ titulo: '', contenido: '' });
      setEditingId(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'No se pudo guardar la política. Intenta de nuevo.';
      MySwal.fire({
        title: '¡Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#800020',
      });
      console.error('Error al guardar política:', err.response ? err.response.data : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la política actual y no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#7A4069',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await axios.delete(`http://localhost:5000/api/contenido/politica/${id}`);
        // Limpiar completamente el array de políticas
        setPoliticas([]);
        MySwal.fire({
          title: '¡Éxito!',
          text: 'Política eliminada correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#7A4069',
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'No se pudo eliminar la política.';
        MySwal.fire({
          title: '¡Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#800020',
        });
        console.error('Error al eliminar política:', err.response ? err.response.data : err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (politica) => {
    setPolitica({
      titulo: politica.titulo,
      contenido: politica.contenido,
    });
    setEditingId(politica._id.toString());
  };

  const handleCancel = () => {
    setPolitica({ titulo: '', contenido: '' });
    setEditingId(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gestión de Políticas</h1>
      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          <strong>Nota:</strong> Solo puede existir una política de privacidad activa en el sistema. 
          Al crear una nueva política, se eliminará automáticamente la anterior. 
          Esta política se mostrará en todos los pies de página del sitio.
        </p>
      </div>
      {loading && <p style={styles.loading}>Cargando...</p>}
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.flexContainer}>
        <section style={styles.gestionPoliticaContainer}>
          <h2 style={styles.subtitle}>Gestión de Política</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Título (máx. 255 caracteres)</label>
                <input
                  type="text"
                  name="titulo"
                  placeholder="Título de la política"
                  value={politica.titulo}
                  onChange={handleChange}
                  maxLength={255}
                  required
                  style={styles.input}
                />
                <span style={styles.charCount}>{politica.titulo.length}/255</span>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contenido (máx. 2000 caracteres)</label>
                <textarea
                  name="contenido"
                  placeholder="Contenido de la política (usa saltos de línea para separar puntos)"
                  value={politica.contenido}
                  onChange={handleChange}
                  maxLength={2000}
                  required
                  style={{ ...styles.input, height: '150px', resize: 'vertical' }}
                />
                <span style={styles.charCount}>{politica.contenido.length}/2000</span>
              </div>
            </div>
            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.editButton} disabled={loading}>
                {editingId ? 'Actualizar Política' : 'Crear Política'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} style={styles.cancelButton} disabled={loading}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={styles.politicasGuardadasContainer}>
          <h2 style={styles.subtitle}>Política Actual</h2>
          {politicas.length === 0 && !loading && <p>No hay políticas guardadas. Crea la primera política de privacidad del sistema.</p>}
          {politicas.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Contenido</th>
                  <th style={styles.th}>Fecha de Creación</th>
                  <th style={styles.th}>Última Actualización</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {politicas.map((politica) => (
                  <tr key={politica._id} style={styles.tr}>
                    <td style={styles.td}>{politica.titulo}</td>
                    <td style={styles.td}>
                      <ul style={styles.contentList}>
                        {politica.contenido ? politica.contenido.split('\n').map((item, index) => (
                          item.trim() && <li key={index} style={styles.contentItem}>{item.trim()}</li>
                        )) : <li style={styles.contentItem}>Sin contenido</li>}
                      </ul>
                    </td>
                    <td style={styles.td}>{politica.createdAt.toLocaleString()}</td>
                    <td style={styles.td}>{politica.updatedAt ? politica.updatedAt.toLocaleString() : 'N/A'}</td>
                    <td style={styles.td}>
                      <div style={styles.buttonGroup}>
                        <button
                          style={styles.editButton}
                          onClick={() => handleEdit(politica)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDelete(politica._id.toString())}
                          disabled={loading}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '30px auto',
    padding: '30px',
    background: '#F5E8C7',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    fontFamily: "'Arial', 'Helvetica', sans-serif",
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '30px',
    textAlign: 'center',
    color: '#800020',
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#800020',
  },
  flexContainer: {
    display: 'flex',
    gap: '25px',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gestionPoliticaContainer: {
    flex: '1 1 45%',
    padding: '20px',
    background: '#FFFFFF',
    borderRadius: '15px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.3s ease',
    cursor: 'default',
  },
  politicasGuardadasContainer: {
    flex: '1 1 50%',
    padding: '20px',
    background: '#FFFFFF',
    borderRadius: '15px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontWeight: '700',
    marginBottom: '8px',
    color: '#7A4069',
    fontSize: '15px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '2px solid #D3D0F7',
    backgroundColor: '#FAFAFF',
    transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
    outline: 'none',
    fontWeight: '500',
    color: '#333333',
  },
  charCount: {
    fontSize: '12px',
    color: '#7A4069',
    textAlign: 'right',
    marginTop: '4px',
  },
  buttonGroup: {
    marginTop: '28px',
    display: 'flex',
    gap: '18px',
    justifyContent: 'flex-start',
  },
  editButton: {
    background: '#800020',
    color: '#FFFFFF',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    boxShadow: '0 4px 10px rgba(128, 0, 32, 0.3)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  cancelButton: {
    background: '#7A4069',
    color: '#FFFFFF',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    boxShadow: '0 4px 10px rgba(122, 64, 105, 0.3)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  deleteButton: {
    background: '#D32F2F',
    color: '#FFFFFF',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    boxShadow: '0 4px 10px rgba(211, 47, 47, 0.3)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#800020',
    color: '#FFFFFF',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #F5E8C7',
  },
  tr: {
    borderBottom: '1px solid #EEEEEE',
  },
  td: {
    padding: '12px',
    verticalAlign: 'top',
  },
  contentList: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    margin: '10px 0',
  },
  contentItem: {
    margin: '5px 0',
    color: '#333333',
  },
  loading: {
    textAlign: 'center',
    color: '#7A4069',
    fontSize: '18px',
  },
  error: {
    textAlign: 'center',
    color: '#D32F2F',
    fontSize: '18px',
  },
  infoBox: {
    background: '#E3F2FD',
    border: '2px solid #2196F3',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
  },
  infoText: {
    margin: '0',
    color: '#1976D2',
    fontSize: '14px',
    lineHeight: '1.5',
  },
};

export default Politica;