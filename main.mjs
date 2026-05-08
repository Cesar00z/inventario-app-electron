//main process
import { app, BrowserWindow, Menu, screen, ipcMain} from "electron";
import getProductos from "./utils/mostrarDatos.js";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
    const win = new BrowserWindow({
        width: screen.getPrimaryDisplay().workArea.width,
        height: screen.getPrimaryDisplay().workArea.height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    //Menu.setApplicationMenu(null)
    win.loadFile("index.html");
    
};

ipcMain.handle('canal-supabase', async () => {
    return await getProductos();
});

app.whenReady().then(() => {
    createWindow();
});
