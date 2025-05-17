# Etapa base de desarrollo
FROM node:18

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y lock
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Expone el puerto donde corre Vite
EXPOSE 5174

# Comando de desarrollo
CMD ["npm", "run", "dev"]
