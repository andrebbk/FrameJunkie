//creating a window and it's main events
const { app, BrowserWindow, ipcMain } = require('electron');
const debug = require('electron-debug');
const path = require("path");
const url = require("url");
const electronDialog = require('electron').dialog;

require('@electron/remote/main').initialize();

//debug();

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

//#region start window

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

    require('@electron/remote/main').enable(win.webContents);

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

    //clear cache
    win.webContents.session.clearCache(function(){});

    win.webContents.clearHistory(); //clear cookies
    win.webContents.session.clearStorageData() //clear login sessions

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

    //#endregion

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

        //Get movies
        ipcMain.on("getMovies", function(e, mTitle, mYear, mIsFav, mRating, crrPage) {
            let result = knex
            .select('*')
            .from('v_Movies')
            .orderBy([
                { column: 'MovieYear', order: 'desc' }, 
                { column: 'MovieTitle', order: 'asc' }
            ])
            .limit(50)
            .offset(crrPage * 50);

            if(mTitle && mTitle != '' && mTitle != ' '){
                let queryStrTile = '%' + mTitle + '%';
                result = result.whereLike('MovieTitle', queryStrTile);
            }                

            if(mYear && mYear != '' && mYear.length > 3)
            result = result.whereLike('MovieYear', mYear);

            if(mIsFav)
                result = result.where('IsFavorite', 1);

            if(mRating && mRating > 0 && mRating <= 10)
                result = result.where('MovieRating', mRating);

            result.then(function (rows){          
                win.webContents.send('resultSent_movies', rows);
            });  
        }); 
        
        //Update movie views number
        ipcMain.on('update-movie-nrviews', async (event, updateThisMovieId, movieNrViews) => {
            movieNrViews++;

            //update movie NrViews
            let updatedTvShowsPathConfig = await knex('Movies')
            .where({ MovieId: updateThisMovieId})
            .update({ 
                NrViews: movieNrViews
            }, ['MovieId', 'NrViews'])
            .then(function(resp) {                    
                output = true;
                return resp;
            }).catch(err => {
                logger.error(err);
                console.log(err);
            });

            if(updatedTvShowsPathConfig.length > 0) {
                //Add new movie view
                await knex('MovieView').insert({ 
                    MovieId: updateThisMovieId, 
                    CreateDate: new Date().toISOString()
                })
                .catch(function(error) {
                    logger.error(error);
                    console.error(error);
                });
                
                setTimeout(async () => {         
                    BrowserWindow.getAllWindows().find((win) => win.webContents.id === event.sender.id).webContents.send('result-update-movie-nrviews', updateThisMovieId);			
                }, 1000);                   
            }
        });

        //Confirm dialog
        ipcMain.on('openConfirmDialog', (event, confirmMsg, ipcCallBack) => {
            let window = BrowserWindow.getAllWindows().find((win) => win.webContents.id === event.sender.id);

            const options = {
                type: "question",
                buttons: ["Confirm", "Cancel"],
                defaultId: 1,
                cancelId: 1,
                title: "Frame Junkie",
                message: confirmMsg,
                detail: "This action cannot be undone",
                icon: path.join(__dirname, '/Content/Icons/action-movie.ico')
            };

            // Dialog returns a promise
            electronDialog
                .showMessageBox(window, options)            
                .then((result) => {
                    // Bail if the user pressed "Cancel" or escaped (ESC) from the dialog box
                    if (result.response !== 0) { return; }
        
                    // Testing.
                    if (result.response === 0) {
                        // Reply to the render process
                        window.webContents.send(ipcCallBack, result.response);
                    }   
                });
        });

        //Event to reload movies list
        ipcMain.on('reload-movies-menu', async (event, deletedMovieId) => {
            let movieDB = knex('Movies')
            .where('MovieId', deletedMovieId)
            .select('MovieId', 'MovieTitle')
            .first();

            await movieDB.then(function (movieData){          
                if(movieData != null && movieData.MovieId > 0){
                    win.webContents.send('reload-movies-list', movieData.MovieTitle);
                }
            });            
        });
    });
}

app.on('ready', createWindow);