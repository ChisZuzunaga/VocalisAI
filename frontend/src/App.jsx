import { useState } from 'react';
import api from './services/api';

function App() {
  const [random, setRandom] = useState(null);

  const fetchRandomNumber = async () => {
    try {
      const response = await api.get('/random');
      setRandom(response.data.number);
    } catch (error) {
      console.error("Error fetching number:", error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Generador de númerooo aleatorio</h1>
      <button onClick={fetchRandomNumber}>Obtener número</button>
      {random !== null && <p>Número aleatorio: {random}</p>}
    </div>
  );
}

export default App;
