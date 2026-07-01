import { perfilEmpresaAPI } from '../../api/index.js';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Layout, Typography } from 'antd';
import {
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaWhatsapp } from 'react-icons/fa';

const { Footer } = Layout;
const { Text, Title } = Typography;

// URL base del backend
const API_BASE_URL = 'http://localhost:5000';

// URL de geocodificación de Nominatim (OpenStreetMap)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const PieDePagina = () => {
  const [datosEmpresa, setDatosEmpresa] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    telefono: '',
    correo: '',
    direccion: '',
    mostrarWhatsapp: true, // Nuevo campo para controlar la visibilidad del WhatsApp
  });
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
  const fetchPerfil = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/perfil-empresa`)
      const perfil = response.data.perfil  // ← extraer .perfil
      const redes = perfil.redes_sociales || []

      setDatosEmpresa({
        facebook:       redes.find(r => r.plataforma === 'facebook')?.url || '',
        twitter:        redes.find(r => r.plataforma === 'twitter')?.url  || '',
        instagram:      redes.find(r => r.plataforma === 'instagram')?.url || '',
        telefono:       perfil.telefono  || '',
        correo:         perfil.correo    || '',
        direccion:      perfil.direccion || '',
        mostrarWhatsapp: perfil.mostrar_whatsapp ?? true,
      })

      if (perfil.direccion && mapRef.current) {
        initializeOrUpdateMap(perfil.direccion)
      }
    } catch (err) {
      console.error('Error fetching perfil:', err)
      setError('No se pudieron cargar los datos de la empresa.')
    }
  }
  fetchPerfil()
}, [])

  useEffect(() => {
    // Inicializar el mapa solo si el contenedor existe
    if (mapRef.current && !mapRef.current._leaflet_id) {
      const mapInstance = L.map(mapRef.current).setView([21.1376, -98.6728], 13); // Coordenadas por defecto cerca de Huejutla
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);

      // Añadir marcador por defecto
      const defaultMarker = L.marker([21.1376, -98.6728]).addTo(mapInstance);

      // Guardar el mapa y el marcador en el ref
      mapRef.current.map = mapInstance;
      mapRef.current.marker = defaultMarker;

      // Actualizar el mapa si hay dirección
      if (datosEmpresa.direccion) {
        initializeOrUpdateMap(datosEmpresa.direccion);
      }
    }
  }, [datosEmpresa.direccion]);

  const initializeOrUpdateMap = async (direccion) => {
    if (mapRef.current && mapRef.current.map) {
      try {
        const response = await axios.get(NOMINATIM_URL, {
          params: {
            q: direccion,
            format: 'json',
            addressdetails: 1,
            limit: 1,
          },
        });

        if (response.data && response.data.length > 0) {
          const { lat, lon } = response.data[0];
          mapRef.current.map.setView([lat, lon], 13);

          if (mapRef.current.marker) {
            mapRef.current.marker.setLatLng([lat, lon]);
          } else {
            const newMarker = L.marker([lat, lon]).addTo(mapRef.current.map);
            mapRef.current.marker = newMarker;
          }
        } else {
          console.warn('No se encontró la ubicación para la dirección:', direccion);
          mapRef.current.map.setView([21.1376, -98.6728], 13);
          if (mapRef.current.marker) mapRef.current.marker.setLatLng([21.1376, -98.6728]);
        }
      } catch (err) {
        console.error('Error al geocodificar la dirección:', err);
      }
    }
  };

  return (
    <Layout>
      <Footer
        style={{
          backgroundColor: '#720F3C',
          textAlign: 'center',
          padding: '40px 20px',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: "'Arial', 'Helvetica', sans-serif",
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            width: '100%',
            gap: '20px',
            marginBottom: '20px',
            maxWidth: '1200px',
          }}
        >
          {/* Sección Redes Sociales */}
          <div>
            <Title level={4} style={{ color: '#FFFFFF', fontSize: '18px', marginBottom: '15px', fontWeight: 600 }}>
              Síguenos en nuestras redes sociales
            </Title>
            {datosEmpresa.facebook ? (
              <a
                href={datosEmpresa.facebook}
                style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Facebook
              </a>
            ) : (
              <Text style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', opacity: 0.6 }}>
                <FacebookOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Facebook (No disponible)
              </Text>
            )}
            {datosEmpresa.twitter ? (
              <a
                href={datosEmpresa.twitter}
                style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Twitter
              </a>
            ) : (
              <Text style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', opacity: 0.6 }}>
                <TwitterOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Twitter (No disponible)
              </Text>
            )}
            {datosEmpresa.instagram ? (
              <a
                href={datosEmpresa.instagram}
                style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Instagram
              </a>
            ) : (
              <Text style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', opacity: '0.6' }}>
                <InstagramOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Instagram (No disponible)
              </Text>
            )}
          </div>

          {/* Sección Contacto */}
          <div>
            <Title level={4} style={{ color: '#FFFFFF', fontSize: '18px', marginBottom: '15px', fontWeight: 600 }}>
              Contacto
            </Title>
            {datosEmpresa.mostrarWhatsapp !== false && (
              <Text style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                <FaWhatsapp style={{ fontSize: '18px', marginRight: '5px', color: '#25D366', verticalAlign: 'middle' }} />
                WhatsApp: {datosEmpresa.telefono ? (
                  <a
                    href={`https://wa.me/52${datosEmpresa.telefono.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, necesito ayuda con los servicios del Instituto Veracruzano del Deporte.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#F5E8C7', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    {datosEmpresa.telefono}
                  </a>
                ) : 'No disponible'}
              </Text>
            )}
            {datosEmpresa.correo ? (
              <a
                href={`mailto:${datosEmpresa.correo}`}
                style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}
              >
                <MailOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Correo electrónico: {datosEmpresa.correo}
              </a>
            ) : (
              <Text style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', opacity: 0.6 }}>
                <MailOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Correo electrónico: No disponible
              </Text>
            )}
            {datosEmpresa.direccion ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(datosEmpresa.direccion)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}
              >
                <EnvironmentOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Ubicación: {datosEmpresa.direccion}
              </a>
            ) : (
              <Text style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', opacity: 0.6 }}>
                <EnvironmentOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Ubicación: No disponible
              </Text>
            )}
            {datosEmpresa.direccion && (
              <div
                ref={mapRef}
                id="map-container"
                style={{
                  height: '150px',
                  width: '100%',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  marginTop: '10px',
                }}
              />
            )}
          </div>

          {/* Sección Información */}
          <div>
            <Title level={4} style={{ color: '#FFFFFF', fontSize: '18px', marginBottom: '15px', fontWeight: 600 }}>
              Información
            </Title>
            <Link to="/politicaspca" style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}>
              <SafetyOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Política de Privacidad
            </Link>
            <Link to="/terminospca" style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}>
              <FileTextOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Términos y Condiciones
            </Link>
            <Link to="/misionpca" style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}>
              <ThunderboltOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Misión
            </Link>
            <Link to="/visionpca" style={{ color: '#F5E8C7', fontSize: '16px', display: 'block', marginBottom: '10px', textDecoration: 'none' }}>
              <BulbOutlined style={{ fontSize: '18px', marginRight: '5px', color: '#F5E8C7' }} /> Visión
            </Link>
          </div>
        </div>
        {error && (
          <Text style={{ color: '#FFFFFF', textAlign: 'center', marginTop: '10px' }}>
            {error}
          </Text>
        )}
      </Footer>
    </Layout>
  );
};

export default PieDePagina;