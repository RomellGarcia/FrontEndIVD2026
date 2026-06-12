import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:5000'; // Ajusta si usas otro dominio

const RecuperarCorreo = () => {
  const [gmail, setGmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/recuperar/forgot-password`, { gmail });
      Swal.fire({
        icon: 'success',
        title: 'Código enviado',
        text: 'Revisa tu correo electrónico para obtener el código de recuperación.',
      });
      navigate('/verificar-codigo', { state: { gmail } });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo enviar el código. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', background: '#F5E8C7', padding: 24, borderRadius: 12, fontFamily: "'Arial', 'Helvetica', sans-serif" }}>
      <h2 style={{ color: '#800020', textAlign: 'center', fontFamily: "'Arial', 'Helvetica', sans-serif" }}>Recuperar Contraseña</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={gmail}
          onChange={e => setGmail(e.target.value)}
          required
          style={{ width: '100%', padding: 12, borderRadius: 6, border: '1.5px solid #7A4069', marginBottom: 16, fontFamily: "'Arial', 'Helvetica', sans-serif" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', background: '#800020', color: '#fff', padding: 12, border: 'none', borderRadius: 6, fontWeight: 'bold', fontFamily: "'Arial', 'Helvetica', sans-serif" }}
        >
          {loading ? 'Enviando...' : 'Solicitar Código'}
        </button>
      </form>
    </div>
  );
};

export default RecuperarCorreo; 