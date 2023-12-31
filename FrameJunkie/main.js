//creating a window and it's main events
console.log('main process working');

const { app, BrowserWindow, ipcMain } = require('electron');

/*const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow*/
const path = require("path");
const url = require("url");

//window
let win;

var knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./Northwind.sl3"
    },
    useNullAsDefault: true
});

const env = process.env.NODE_ENV || 'development';
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function createWindow() {
    win = new BrowserWindow({
        show: false,
        fullscreen: false,
        frame: false,
        width: 1920,
        height: 1080,
        webPreferences: {          
            enableRemoteModule: true,  
            contextIsolation: false,
            nodeIntegrationInWorker: true,
            webSecurity: false,
            nodeIntegration: true,
            preload: __dirname + '/preload.js'
        }, 
        resizable: false,
        minimizable: true,
        maximizable: false,
        icon: __dirname + '/Content/Icons/action-movie.ico',
    });

      // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/index.html`)

    /*win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: "file",
        slashes: true
    }));*/

    // If development environment 
    if (env === 'development') { 
        require('electron-reload')(__dirname, { 
            electron: path.join(__dirname, 'node_modules', '.bin', 'electron'), 
            hardResetMethod: 'exit'
        }); 
    }

    win.webContents.clearHistory(); //deleting cookies

    //with chromium we can access to dev tools on running time
    //win.webContents.openDevTools();
    
    win.on('closed', () => {
        win = null; //to garbage collector
    });

    win.on('window-all-closed', () => {
        app.quit(); //to garbage collector
    });

    win.once("ready-to-show", () => { win.show(); }) //without this event (with show parameter set to false) u might see a blank window for a while    

        //IPC
    ipcMain.on('minimize-app', () => {
        win.isMinimized() ? win.restore() : win.minimize()
        // or alternatively: win.isVisible() ? win.hide() : win.show()
      })

    ipcMain.on('close-app', () => {
        app.quit(0); //to garbage collector
    });

    //QUERYS KNEX
    //************************************************************************************************************************************************************//
    win.webContents.on('dom-ready', () => {
        //Get stats
        ipcMain.on("getStats", function() {
            let result = knex.select('*').from('v_MovieTvShowStats');

            result.then(function (rows){
                win.webContents.send("resultSent_stats", rows);
            });       
        });

        //Get movies views count
        ipcMain.on("getMoviesViewsCount", function() {
            let result = knex.select('*').from('v_MoviesViews');

            result.then(function (rows){
                win.webContents.send("resultSent_mvc", rows);
            });
        });

        //Get tvshows views count
        ipcMain.on("getTvShowsViewsCount", function() {
            let result = knex.select('*').from('v_TvShowsViews');
        
            result.then(function (rows){
                win.webContents.send('resultSent_tsvc', rows);
            });
        });

        //get movies
        ipcMain.on("getMovies", function() {
            let currentYear = new Date().getFullYear();
            let result = knex
            .select('*')
            .from('v_Movies')
            .where('MovieYear', currentYear)
            .orderBy('MovieTitle');
    
            result.then(function (rows){          
                win.webContents.send('resultSent_movies', rows);
            });  
        });
    });
}

app.on('ready', createWindow);