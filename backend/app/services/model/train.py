import torch
import torch.nn as nn
import torch.optim as optim
import os
import numpy as np
import traceback
from torch.utils.data import Dataset, DataLoader

class SimpleNN(nn.Module):
    def __init__(self, dropout_rate=0.3):
        super(SimpleNN, self).__init__()
        # Capa de entrada con menos unidades para evitar sobreajuste
        self.fc1 = nn.Linear(16000, 256)
        self.bn1 = nn.BatchNorm1d(256)  # Normalización por lotes
        self.dropout1 = nn.Dropout(dropout_rate)
        
        self.fc2 = nn.Linear(256, 128)
        self.bn2 = nn.BatchNorm1d(128)
        self.dropout2 = nn.Dropout(dropout_rate)
        
        self.fc3 = nn.Linear(128, 2)  # Capa de salida
    
    def forward(self, x):
        # Asegurarnos que el tensor es float32
        x = x.to(torch.float32)
        # Aplanar el tensor si es necesario
        if x.dim() > 2:
            x = x.view(x.size(0), -1)
        elif x.dim() == 1:
            x = x.unsqueeze(0)  # Añadir dimensión de batch si es necesario
        
        # Red con capas adicionales y regularización
        x = self.fc1(x)
        if x.size(0) > 1:  # BatchNorm solo funciona con batch_size > 1
            x = self.bn1(x)
        x = torch.relu(x)
        x = self.dropout1(x)
        
        x = self.fc2(x)
        if x.size(0) > 1:  # BatchNorm solo funciona con batch_size > 1
            x = self.bn2(x)
        x = torch.relu(x)
        x = self.dropout2(x)
        
        x = self.fc3(x)
        return x

class AudioDataset(Dataset):
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.samples = []
        self.labels = []
        
        # Cargar audios "sí" (etiqueta 0)
        si_dir = os.path.join(data_dir, "si")
        if os.path.exists(si_dir):
            for file in os.listdir(si_dir):
                if file.endswith(".webm"):
                    self.samples.append(os.path.join(si_dir, file))
                    self.labels.append(0)
        
        # Cargar audios "no" (etiqueta 1)
        no_dir = os.path.join(data_dir, "no")
        if os.path.exists(no_dir):
            for file in os.listdir(no_dir):
                if file.endswith(".webm"):
                    self.samples.append(os.path.join(no_dir, file))
                    self.labels.append(1)
        
        print(f"Cargados {len(self.samples)} archivos de audio para entrenamiento")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        try:
            file_path = self.samples[idx]
            print(f"Procesando archivo: {file_path}")
            
            try:
                # Intentar cargar con librosa (requiere ffmpeg)
                import librosa
                data, samplerate = librosa.load(file_path, sr=16000, mono=True)
                waveform = torch.tensor(data, dtype=torch.float32)
            except Exception as e:
                print(f"Error cargando con librosa: {e}")
                
                try:
                    # Intentar usar pydub si librosa falla
                    from pydub import AudioSegment
                    import numpy as np
                    
                    # Cargar audio con pydub (también usa ffmpeg bajo el capó)
                    audio = AudioSegment.from_file(file_path)
                    audio = audio.set_channels(1).set_frame_rate(16000)
                    
                    # Convertir a numpy array y normalizar
                    samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
                    samples = samples / 32768.0  # Normalizar a [-1, 1]
                    
                    waveform = torch.tensor(samples, dtype=torch.float32)
                except Exception as e2:
                    print(f"Error cargando con pydub: {e2}")
                    
                    # Si todo falla, proporcionar un tensor vacío
                    print(f"Usando tensor de ceros para: {file_path}")
                    waveform = torch.zeros(16000, dtype=torch.float32)
            
            # Normalizar amplitud
            if waveform.abs().max() > 0:
                waveform = waveform / waveform.abs().max()
            
            # Recortar o rellenar para estandarizar a 16000 muestras
            waveform = waveform[:16000]
            if waveform.shape[0] < 16000:
                waveform = torch.nn.functional.pad(waveform, (0, 16000 - waveform.shape[0]))
            
            return waveform, torch.tensor(self.labels[idx], dtype=torch.long)
        except Exception as e:
            print(f"Error procesando audio {file_path}: {str(e)}")
            import traceback
            traceback.print_exc()
            # Devolver tensor vacío con tipo explícito
            return torch.zeros(16000, dtype=torch.float32), torch.tensor(self.labels[idx], dtype=torch.long)

def train_model(data_dir, model_save_path, num_epochs=50, batch_size=16, learning_rate=0.0005):
    print(f"Iniciando entrenamiento: {num_epochs} épocas, batch={batch_size}, lr={learning_rate}")
    print(f"Directorio de datos: {data_dir}")
    print(f"Ruta de guardado del modelo: {model_save_path}")
    
    # Establecer semilla para reproducibilidad
    torch.manual_seed(42)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(42)
    
    try:
        # Explícitamente establecer el tipo por defecto
        torch.set_default_dtype(torch.float32)
        
        # Crear dataset y dataloader
        dataset = AudioDataset(data_dir)
        
        if len(dataset) < 2:
            print("No hay suficientes datos para entrenar el modelo")
            return
        
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        # Probar un batch para verificar tipos
        sample_batch = next(iter(dataloader))
        inputs, labels = sample_batch
        print(f"Muestra de entrada - Forma: {inputs.shape}, Tipo: {inputs.dtype}")
        print(f"Muestra de etiquetas - Forma: {labels.shape}, Tipo: {labels.dtype}")
        
        # Crear modelo y configurar entrenamiento
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = SimpleNN().to(device)
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(model.parameters(), lr=learning_rate)
        
        # Bucle de entrenamiento
        for epoch in range(num_epochs):
            model.train()  # Modo entrenamiento
            running_loss = 0.0
            correct = 0
            total = 0
            
            for i, (inputs, labels) in enumerate(dataloader):
                # Mover a device y asegurar tipos
                inputs = inputs.to(device, dtype=torch.float32)
                labels = labels.to(device, dtype=torch.long)
                
                # Reiniciar gradientes
                optimizer.zero_grad()
                
                # Forward pass
                outputs = model(inputs)
                
                # Calcular pérdida
                loss = criterion(outputs, labels)
                
                # Backward pass
                loss.backward()
                
                # Actualizar pesos
                optimizer.step()
                
                # Estadísticas
                running_loss += loss.item()
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
            
            # Mostrar estadísticas de la época
            epoch_loss = running_loss / len(dataloader)
            accuracy = 100 * correct / total if total > 0 else 0
            print(f'Época [{epoch+1}/{num_epochs}], Pérdida: {epoch_loss:.4f}, Precisión: {accuracy:.2f}%')
        
        # Evaluar modelo final
        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for inputs, labels in dataloader:
                inputs = inputs.to(device, dtype=torch.float32)
                labels = labels.to(device, dtype=torch.long)
                outputs = model(inputs)
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        final_accuracy = 100 * correct / total if total > 0 else 0
        print(f'Precisión final del modelo: {final_accuracy:.2f}%')

        # Guardar el modelo
        print(f"Guardando modelo en {model_save_path}...")
        torch.save(model.state_dict(), model_save_path)
        print(f"Modelo guardado exitosamente.")
        
        return {
            "success": True,
            "accuracy": final_accuracy,
            "model_path": str(model_save_path)
        }
        
    except Exception as e:
        print(f"Error durante el entrenamiento: {str(e)}")
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }