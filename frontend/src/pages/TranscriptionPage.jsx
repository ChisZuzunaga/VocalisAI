import { useLocation, useNavigate } from 'react-router-dom'

const TranscriptionPage = () => {
  const { state } = useLocation()
  const navigate = useNavigate()

  if (!state) {
    // si se entra directo sin datos, redirige
    navigate('/')
    return null
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Tu transcripción</h2>
      <div className="p-4 bg-gray-100 rounded">
        {state.transcript}
      </div>
      <button
        onClick={() => navigate('/record')}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Grabar de nuevo
      </button>
    </div>
  )
}

export default TranscriptionPage