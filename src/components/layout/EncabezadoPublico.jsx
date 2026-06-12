import React, { useState, useEffect, useRef } from 'react';
import { HomeOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { perfilEmpresaAPI } from '../../api/index.js';

const EncabezadoPublico = () => {
  const [active, setActive] = useState('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState('Instituto Veracruzano del Deporte');
  const [logoUrl, setLogoUrl] = useState('');
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await perfilEmpresaAPI.get();
        const data = response.data.perfil;     
        setNombreEmpresa(data.nombre_empresa || 'Instituto Veracruzano del Deporte');
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
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClick = (key) => {
    switch (key) {
      case 'home':
        navigate('/');
        break;
      case 'login':
        navigate('/login');
        break;
      default:
        console.log('No se reconoce la acción del menú');
    }
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMobileMenuOpen(false);
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
        :root {
          --color-primary: #800020; /* Granada/Vino - fondo y botones */
          --color-secondary: #FFFFFF; /* Blanco - texto principal */
          --color-highlight: #7A4069; /* Morado medio - acentos */
          --color-hover: #A52A2A; /* Tono más claro para hover */
          --color-mobile-bg: #800020; /* Fondo móvil */
          --color-mobile-text: #FFFFFF; /* Texto móvil */
          --color-detail: #F5E8C7; /* Beige claro - detalles */
          --color-divider: #B0BEC5; /* Gris claro - separadores */
          --color-text-secondary: #333333; /* Gris oscuro para subtítulos */
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
          background-color: var(--color-primary);
          color: var(--color-secondary);
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía aplicada al header */
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1100;
          transition: all 0.3s ease;
        }

        .logo {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .logo img {
          width: 100px; /* Tamaño base en escritorio */
          height: 100px; /* Tamaño base en escritorio */
          max-width: 100%; /* Ajuste dinámico al contenedor */
          max-height: 100px; /* Límite máximo para mantener proporciones */
          border-radius: 8px; /* Mantenemos el borde redondeado si lo deseas */
          margin-right: 20px; /* Espacio entre logo y texto */
          object-fit: contain; /* Asegura que la imagen no se corte */
          border: none; /* Quitamos el borde */
          box-shadow: none; /* Quitamos la sombra */
        }

        .logo h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--color-secondary);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita */
        }

        .menu ul {
          display: flex;
          gap: 20px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .menu ul li {
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-secondary);
          transition: all 0.3s ease;
          border-radius: 5px;
        }

        .menu ul li:hover {
          background: rgba(255, 255, 255, 0.15);
          color: var(--color-secondary);
        }

        .menu ul li.active {
          background: rgba(122, 64, 105, 0.8);
          color: var(--color-secondary);
        }

        .mobile-menu-icon {
          display: none;
          flex-direction: column;
          cursor: pointer;
          gap: 4px;
        }

        .hamburger {
          width: 30px;
          height: 3px;
          background-color: var(--color-secondary);
          transition: all 0.3s ease;
          border-radius: 1px;
        }

        .mobile-menu-icon:hover .hamburger {
          background-color: var(--color-detail);
        }

        @media (max-width: 768px) {
          .header {
            padding: 10px 15px;
          }
          .menu ul {
            flex-direction: column;
            position: fixed;
            top: 90px; /* Espacio para el logo más grande */
            left: -100%;
            width: 70%;
            height: calc(100% - 90px); /* Ajustado para el logo */
            background-color: var(--color-mobile-bg);
            padding: 20px;
            transition: left 0.4s ease-in-out;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
          }

          .menu.menu-open ul {
            left: 0;
          }

          .menu ul li {
            padding: 15px 20px;
            border-bottom: 1px solid var(--color-divider);
            color: var(--color-mobile-text);
            font-size: 1.2rem;
            font-weight: 500;
          }

          .mobile-menu-icon {
            display: flex;
          }

          .logo img {
            width: 80px; /* Tamaño base en móvil */
            height: 80px; /* Tamaño base en móvil */
            max-height: 80px; /* Límite máximo */
            margin-right: 15px; /* Espacio ajustado */
            border: none; /* Quitamos el borde */
            box-shadow: none; /* Quitamos la sombra */
          }

          .logo h1 {
            font-size: 1.3rem;
            font-family: 'Arial', 'Helvetica', sans-serif; /* Tipografía explícita en móvil */
          }
        }
      `}</style>

      <header className="header">
        <div className="logo">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${nombreEmpresa} logo`}
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '3px solid #800020',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginRight: '20px',
              }}
            />
          ) : (
            <div style={{ width: '100px', height: '100px', backgroundColor: '#E0E0E0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5568', fontSize: '0.8rem', fontWeight: 600, border: '3px solid #800020', marginRight: '20px' }}>
              Logo
            </div>
          )}
          <h1>{nombreEmpresa}</h1>
        </div>
        <nav className={`menu ${isMobileMenuOpen ? 'menu-open' : ''}`} ref={menuRef}>
          <ul>
            <li
              className={active === 'home' ? 'active' : ''}
              onClick={() => { handleClick('home'); handleMenuClick('home'); }}
            >
              <HomeOutlined style={{ color: '#F5E8C7' }} /> Inicio
            </li>
            <li
              className={active === 'login' ? 'active' : ''}
              onClick={() => { handleClick('login'); handleMenuClick('login'); }}
            >
              <LoginOutlined style={{ color: '#F5E8C7' }} /> Iniciar Sesión
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

export default EncabezadoPublico;