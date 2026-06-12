import { perfilEmpresaAPI } from '../../api/index.js';
import React, { useState, useRef, useEffect } from 'react';
import { AppstoreOutlined, LogoutOutlined, HomeOutlined, FileTextOutlined, TeamOutlined, ShopOutlined, ApartmentOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../common/AuthContext.jsx'; // Importa useAuth
import Swal from 'sweetalert2';

const EncabezadoAdministrativo = () => {
  const [active, setActive] = useState('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { logout } = useAuth(); // Obtén la función logout del contexto

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await perfilEmpresaAPI.get();
        const data = response.data.perfil;

        console.log('Datos recibidos del backend:', data); // Depuración

        setNombreEmpresa(data.nombre_empresa || 'Nombre no disponible');
        setLogoUrl(data.logo || '');
      } catch (error) {
        console.error('Error al obtener datos del perfil:', error);
      }
    };

    fetchPerfil();
  }, []);

  const handleClick = (option) => {
    setActive(option);
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const handleMenuClick = async (key) => {
    switch (key) {
      case 'politicas':
        navigate('/administrador/politicas');
        break;
      case 'home':
        navigate('/administrador');
        break;
      case 'terminos':
        navigate('/administrador/terminos');
        break;
      case 'perfil':
        navigate('/administrador/perfil');
        break;
      case 'mision':
        navigate('/administrador/mision');
        break;
      case 'vision':
        navigate('/administrador/vision');
        break;
      case 'gestionarAtletas':
        navigate('/administrador/gestionar-atletas');
        break;
      case 'altaAtleta':
        navigate('/administrador/atleta');
        break;
      case 'altaClub':
        navigate('/administrador/club');
        break;
      case 'gestionClubes':
        navigate('/administrador/gestion-clubes');
        break;
      case 'promocionarAtleta':
        navigate('/administrador/promocionar-atleta');
        break;
      case 'Eventos':
        navigate('/administrador/evento');
        break;
      case 'resultados':
        navigate('/administrador/resultados');
        break;
      
      case 'cerrarSesion':
        const result = await Swal.fire({
          title: '¿Confirmar cierre de sesión?',
          text: '¿Estás seguro de que deseas cerrar sesión?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#800020',
          cancelButtonColor: '#7A4069',
          confirmButtonText: 'Sí, cerrar sesión',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          try {
            // Primero hacer logout del contexto para limpiar el estado inmediatamente
            logout();
            
            // Luego limpiar el almacenamiento (usar sessionStorage para ser consistente con AuthContext)
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
            
            // Finalmente intentar hacer logout del servidor
            try {
              await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
            } catch (serverError) {
              console.log('Error del servidor al cerrar sesión (no crítico):', serverError);
            }
            
            // Redirigir inmediatamente
            navigate('/login', { replace: true });
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Asegurar que el logout se complete incluso si hay error
            logout();
            navigate('/login', { replace: true });
          }
        }
        break;
      default:
        console.log('No se reconoce la acción del menú');
    }
  };

  const handleLogout = async () => {
    console.log('Cerrando sesión...');
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      localStorage.removeItem('token'); // Elimina el token del localStorage
      sessionStorage.removeItem('token'); // Elimina el token de la sesión
      logout(); // Actualiza el estado en AuthContext
      navigate('/'); // Redirige a la pantalla pública
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMobileMenuOpen(false);
      setOpenDropdown(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <style>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #800020; /* Granada/vino */
          color: #FFFFFF; /* Blanco */
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía aplicada al header */
          position: relative;
          flex-wrap: wrap;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .logo {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .logo img {
          width: 100px; /* Aumentado para mejor visibilidad */
          height: 100px; /* Aumentado para mejor visibilidad */
          max-width: 100%; /* Ajuste dinámico */
          max-height: 100px; /* Límite máximo */
          margin-right: 10px; /* Espacio ajustado */
          object-fit: contain; /* Asegura que no se corte */
          border: none; /* Eliminamos el borde */
          box-shadow: none; /* Eliminamos la sombra */
        }

        .logo h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #FFFFFF; /* Blanco */
          margin: 0;
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita */
        }

        .menu {
          flex: 2;
          display: flex;
          justify-content: flex-end;
        }

        .menu ul {
          display: flex;
          gap: 15px;
          list-style-type: none;
          margin: 0;
          padding: 0;
        }

        .menu ul li {
          font-size: 1rem;
          cursor: pointer;
          padding: 8px 12px;
          color: #FFFFFF; /* Blanco */
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .menu ul li:hover {
          background-color: #F5E8C7; /* Beige claro */
          color: #333333; /* Gris oscuro */
          border-radius: 5px;
        }

        .menu ul li.active {
          background-color: #7A4069; /* Morado medio */
          color: #FFFFFF; /* Blanco */
          border-radius: 5px;
        }

        .menu ul .dropdown-menu {
          display: ${openDropdown ? 'block' : 'none'};
          position: absolute;
          left: 0;
          top: 100%;
          background-color: #800020; /* Granada/vino */
          list-style: none;
          padding: 10px;
          margin-top: 5px;
          border-radius: 5px;
          z-index: 10;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .menu ul .dropdown-menu li {
          padding: 8px 12px;
          cursor: pointer;
          color: #FFFFFF; /* Blanco */
        }

        .menu ul .dropdown-menu li:hover {
          background-color: #F5E8C7; /* Beige claro */
          color: #333333; /* Gris oscuro */
        }

        .mobile-menu-icon {
          display: none;
          cursor: pointer;
          flex-direction: column;
          gap: 4px;
        }

        .hamburger {
          width: 25px;
          height: 3px;
          background-color: #FFFFFF; /* Blanco */
          transition: background-color 0.3s ease;
        }

        @media (max-width: 768px) {
          .header {
            padding: 10px 15px;
          }
          .menu ul {
            display: none;
            flex-direction: column;
            position: fixed;
            top: 110px; /* Ajustado para el logo más grande */
            left: 0;
            width: 70%;
            height: calc(100% - 110px); /* Ajustado para el logo */
            background-color: #800020; /* Granada/vino */
            padding: 20px;
            transition: left 0.3s ease-in-out;
            box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
            z-index: 999;
          }

          .menu.menu-open ul {
            display: flex;
            left: 0;
          }

          .menu ul li {
            padding: 15px;
            border-bottom: 1px solid #F5E8C7; /* Beige claro */
            text-align: right;
            color: #FFFFFF; /* Blanco */
          }

          .menu ul li:hover {
            background-color: #F5E8C7; /* Beige claro */
            color: #333333; /* Gris oscuro */
          }

          .mobile-menu-icon {
            display: flex;
          }

          .logo img {
            width: 80px; /* Ajustado para móvil */
            height: 80px; /* Ajustado para móvil */
            max-height: 80px; /* Límite máximo */
            margin-right: 10px; /* Espacio ajustado */
            border: none; /* Eliminamos el borde */
            box-shadow: none; /* Eliminamos la sombra */
          }

          .logo h3 {
            font-size: 1.2rem;
            font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita en móvil */
          }
        }
      `}</style>

      <header className="header">
        <div className="logo">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo de la Empresa"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '3px solid #800020',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginRight: '10px',
              }}
            />
          )}
          <h3>{nombreEmpresa}</h3>
        </div>
        <nav className={`menu ${isMobileMenuOpen ? 'menu-open' : ''}`} ref={menuRef}>
          <ul>
            <li onClick={() => handleMenuClick('home')}>
              <HomeOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Inicio
            </li>
            <li className="dropdown" onClick={() => toggleDropdown('empresa')}>
              <span>
                <FileTextOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
                Datos del Instituto
              </span>
              {openDropdown === 'empresa' && (
                <ul className="dropdown-menu">
                  <li onClick={() => { handleClick('perfil'); handleMenuClick('perfil'); }}>Perfil</li>
                  <li onClick={() => { handleClick('terminos'); handleMenuClick('terminos'); }}>Términos</li>
                  <li onClick={() => { handleClick('politicas'); handleMenuClick('politicas'); }}>Políticas</li>
                  <li onClick={() => { handleClick('mision'); handleMenuClick('mision'); }}>Misión</li>
                  <li onClick={() => { handleClick('vision'); handleMenuClick('vision'); }}>Visión</li>
                </ul>
              )}
            </li>
            <li className="dropdown" onClick={() => toggleDropdown('alta')}>
              <span>
                <ShopOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
                Gestión de Usuarios
              </span>
              {openDropdown === 'alta' && (
                <ul className="dropdown-menu">
                  <li onClick={() => { handleClick('gestionarAtletas'); handleMenuClick('gestionarAtletas'); }}>Gestionar Atletas</li>
                  <li onClick={() => { handleClick('gestionClubes'); handleMenuClick('gestionClubes'); }}>Gestionar Clubes</li>
                  <li onClick={() => { handleClick('promocionarAtleta'); handleMenuClick('promocionarAtleta'); }}>Gestionar Entrenadores</li>
                </ul>
              )}
            </li>
            <li onClick={() => handleMenuClick('Eventos')}>
              <ApartmentOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Gestión de eventos
            </li>
            <li onClick={() => handleMenuClick('resultados')}>
              <TrophyOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Gestión de Resultados
            </li>

            <li onClick={() => handleMenuClick('cerrarSesion')}>
              <LogoutOutlined style={{ color: '#FFFFFF', marginRight: '8px' }} />
              Cerrar Sesión
            </li>
          </ul>
        </nav>
        <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
          <div className="hamburger"></div>
          <div className="hamburger"></div>
          <div className="hamburger"></div>
        </div>
      </header>
    </>
  );
};

export default EncabezadoAdministrativo;