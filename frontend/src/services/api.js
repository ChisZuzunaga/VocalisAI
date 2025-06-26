// En tu archivo api.js o donde configures Axios
import axios from 'axios';

const api = axios.create({
  baseURL: '',
  timeout: 30000,  // 30 segundos para las transcripciones
});

// Interceptor para solicitudes
api.interceptors.request.use(
  (config) => {
    // Si es una solicitud multipart/form-data, no establezcas el Content-Type
    // para que Axios pueda agregar el boundary automáticamente
    if (config.data instanceof FormData) {
      // Eliminar la cabecera Content-Type para que axios la configure automáticamente con el boundary
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;