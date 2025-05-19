import axios from 'axios'

// Ahora todas las llamadas a /random o /upload-audio
// se harán al mismo host/puerto donde corre Vite,
// que a su vez Vite reenviará al backend.
export default axios.create({ baseURL: '' })