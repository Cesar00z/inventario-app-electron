import { app, BrowserWindow } from "electron";

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minHeight: 400,
        minWidth: 600,
    });

    win.loadFile("index.html");
};

app.whenReady().then(() => {
    createWindow();
});
