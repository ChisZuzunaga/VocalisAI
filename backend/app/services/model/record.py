from tkinter import Tk, Button, Label, StringVar
import sounddevice as sd
import numpy as np
import wave
import os
import requests
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data"))

class AudioRecorder:
    def __init__(self, master):
        self.master = master
        master.title("Audio Recognition Demo")

        self.label = Label(master, text="Graba tu audio de prueba")
        self.label.pack()

        self.result_var = StringVar()
        self.result_label = Label(master, textvariable=self.result_var)
        self.result_label.pack()

        self.test_button = Button(master, text="Grabar y predecir", command=self.record_and_predict)
        self.test_button.pack(pady=5)

        self.yes_button = Button(master, text="Grabar 'Sí' (entrenar)", command=lambda: self.record_and_save('si'))
        self.yes_button.pack(pady=5)

        self.no_button = Button(master, text="Grabar 'No' (entrenar)", command=lambda: self.record_and_save('no'))
        self.no_button.pack(pady=5)

    def record_and_save(self, clase):
        fs = 16000
        duration = 3  # 3 segundos
        self.result_var.set(f"Grabando '{clase}' por {duration} segundos...")
        self.master.update()
        audio_data = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='int16')
        sd.wait()
        folder = os.path.join(DATA_DIR, clase)
        os.makedirs(folder, exist_ok=True)
        filename = os.path.join(folder, f"{clase}_{int(time.time())}.wav")
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(fs)
            wf.writeframes(audio_data.tobytes())
        self.result_var.set(f"Guardado en {filename}")

    def record_and_predict(self):
        filename = "temp_test.wav"
        fs = 16000
        duration = 3  # 3 segundos para coincidir con la grabación de entrenamiento
        self.result_var.set(f"Grabando por {duration} segundos...")
        self.master.update()
        audio_data = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='int16')
        sd.wait()
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(fs)
            wf.writeframes(audio_data.tobytes())
        self.result_var.set("Enviando al modelo...")
        self.master.update()
        try:
            with open(filename, "rb") as f:
                files = {"audio": f}
                response = requests.post("http://127.0.0.1:8000/predict/", files=files)
            if response.ok:
                pred = response.json().get("prediction", "Error")
                self.result_var.set(f"Predicción: {pred}")
            else:
                self.result_var.set("Error en la predicción")
        except Exception as e:
            self.result_var.set(f"Error: {e}")
        os.remove(filename)

if __name__ == "__main__":
    root = Tk()
    app = AudioRecorder(root)
    root.mainloop()