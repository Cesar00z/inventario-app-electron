# 🚀 Aplicación de escritorio para manejo de inventario

[![Electron.js](https://shields.io)](https://electronjs.org)
[![Node.js](https://shields.io)](https://nodejs.org)
[![License](https://shields.io)](LICENSE)

## 📌 Características
- 💻 Multiplataforma (Windows, macOS, Linux)
- 🔒 Segura y rápida

## 🛠️ Requisitos
Antes de empezar, asegúrate de tener instalado:
- [Node.js](https://nodejs.org) (versión LTS recomendada)
- npm o yarn

## 🚀 Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Cesar00z/inventario-app-electron.git
   cd nombre-app
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Ejecutar la aplicación (modo desarrollo):**
   ```bash
   npm run dev
   ```

## 📦 Empaquetado y Distribución
Para crear los ejecutables (`.exe`, `.app`, `.deb`, etc.), utiliza [electron-builder](https://electron.build):

```bash
npm run build
```
Los archivos finales se encontrarán en la carpeta `dist/`.

## 📂 Estructura del Proyecto
```text
├── src/
│   ├── main/          # Proceso principal (Electron)
│   ├── renderer/      # Frontend (UI, HTML/CSS/JS)
│   └── preload.js     # Puente seguro entre main y renderer
├── package.json
└── README.md
```

## 🔐 Seguridad
Esta aplicación sigue las mejores prácticas de seguridad de Electron:
- `nodeIntegration` desactivado en el renderizador.
- `contextIsolation` activado.
- Uso de `preload.js` para exponer APIs específicas.
