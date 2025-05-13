import { useState } from 'react';
import axios from 'axios';

function App() {
  const [random, setRandom] = useState(null);

  const fetchRandomNumber = async () => {
    try {
      const response = await axios.get('http://localhost:8000/random');
      setRandom(response.data.number);
    } catch (error) {
      console.error("Error fetching number:", error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Generador de número aleatorio</h1>
      <button onClick={fetchRandomNumber}>Obtener número</button>
      {random !== null && <p>Número aleatorio: {random}</p>}
    </div>
  );
}

export default App;
