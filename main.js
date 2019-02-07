const {app, BrowserWindow} = require('electron');
let win;

function createWindow () {
  win = new BrowserWindow({
    width: 600, 
    height: 600, 
    resizable: false,
    useContentSize: true,
    fullscreenable: false
  });
  win.loadFile('index.html');
  win.on('closed', () => { win = null; });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => { if (win === null) createWindow(); });
