import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = 'http://localhost:5000';

const RestablecerPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  const navigate = useNavigate();
  const { gmail, code } = location.state || {};

  // Hook para detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Campos vacíos', text: 'Completa ambos campos.' });
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire({ icon: 'error', title: 'Contraseña débil', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'error', title: 'No coinciden', text: 'Las contraseñas no coinciden.' });
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/recuperar/reset-password`, { gmail, code, newPassword });
      Swal.fire({
        icon: 'success',
        title: 'Contraseña restablecida',
        text: 'Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión.',
      });
      navigate('/login');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo restablecer la contraseña. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Estilos responsivos
  const containerStyle = {
    maxWidth: isMobile ? '100%' : 400,
    width: '90%',
    margin: isMobile ? '20px auto' : '40px auto',
    background: '#F5E8C7',
    padding: isMobile ? '20px 16px' : '24px',
    borderRadius: isMobile ? 8 : 12,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const titleStyle = {
    color: '#800020',
    textAlign: 'center',
    fontSize: isMobile ? '1.5rem' : '2rem',
    marginBottom: isMobile ? '16px' : '24px',
    fontWeight: 'bold'
  };

  const inputContainerStyle = {
    position: 'relative',
    marginBottom: isMobile ? '20px' : '16px'
  };

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '16px' : '12px',
    paddingRight: '50px',
    borderRadius: 8,
    border: '2px solid #ddd',
    fontSize: isMobile ? '16px' : '14px',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
  };

  const eyeButtonStyle = {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease'
  };

  const submitButtonStyle = {
    width: '100%',
    background: '#800020',
    color: '#fff',
    padding: isMobile ? '16px' : '12px',
    border: 'none',
    borderRadius: 8,
    fontWeight: 'bold',
    fontSize: isMobile ? '16px' : '14px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  };

  if (!gmail || !code) {
    return (
      <div style={containerStyle}>
        <h2 style={titleStyle}>Restablecer Contraseña</h2>
        <p style={{ 
          color: '#800020', 
          textAlign: 'center',
          fontSize: window.innerWidth < 768 ? '14px' : '16px',
          lineHeight: '1.5'
        }}>
          Acceso inválido. Por favor, inicia el proceso de recuperación desde tu correo.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Restablecer Contraseña</h2>
      <form onSubmit={handleSubmit}>
        <div style={inputContainerStyle}>
          <input
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#800020'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            style={eyeButtonStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FontAwesomeIcon 
              icon={showNewPassword ? faEyeSlash : faEye} 
              size={window.innerWidth < 768 ? "lg" : "sm"}
            />
          </button>
        </div>
        
        <div style={inputContainerStyle}>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#800020'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={eyeButtonStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FontAwesomeIcon 
              icon={showConfirmPassword ? faEyeSlash : faEye} 
              size={window.innerWidth < 768 ? "lg" : "sm"}
            />
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={submitButtonStyle}
          onMouseEnter={(e) => !loading && (e.target.style.background = '#600018')}
          onMouseLeave={(e) => !loading && (e.target.style.background = '#800020')}
          onMouseDown={(e) => !loading && (e.target.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => !loading && (e.target.style.transform = 'scale(1)')}
        >
          {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
        </button>
      </form>
    </div>
  );
};

export default RestablecerPassword; 