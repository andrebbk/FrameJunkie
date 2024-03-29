//creating a window and it's main events
const { app, BrowserWindow, ipcMain } = require('electron');
const debug = require('electron-debug');
const path = require("path");
const url = require("url");
const electronDialog = require('electron').dialog;
const { nanoid } = require("nanoid");
const fs = require('fs').promises;
const logger = require('./logger');
const { pathEqual } = require('path-equal');

require('@electron/remote/main').initialize();

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

require('v8-compile-cache');

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
            webSecurity: true,
            nodeIntegration: true,
            preload: __dirname + '/preload.js'
        }, 
        resizable: false,
        minimizable: true,
        maximizable: false,
        icon: __dirname + '/Content/Icons/action-movie.ico',
    });

    require('@electron/remote/main').enable(win.webContents);

    //Load the index.html of the app.
    win.loadURL(`file://${__dirname}/index.html`)

    require('electron-reload')(__dirname, {
        // Note that the path to electron may vary according to the main file
        electron: require(`${__dirname}/node_modules/electron`), // electron: path.join(__dirname, 'node_modules', '.bin', 'electron'), 
        hardResetMethod: 'exit'
    });

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

        //Edit movie
        ipcMain.on('edit-movie', async (event, moviesCoversPath, movieDataToEdit) => {      
            try
            {
                if(movieDataToEdit.updateCover && movieDataToEdit.movieCover != undefined && movieDataToEdit.movieCover != ""){
                    //get movie cover
                    let movieCoverDB = await knex('MovieCovers')
                        .where('MovieId', movieDataToEdit.movieId)
                        .where('Deleted', 0)
                        .select('*')
                        .first()
                        .then(function (movieCoverData){
                            return movieCoverData.CoverPath;
                        });    

                    if(!pathEqual(movieCoverDB, movieDataToEdit.movieCover)){
                        //save new movie cover & update db MovieCovers
                        let newCover = saveCover(moviesCoversPath, movieDataToEdit.movieTitle, movieDataToEdit.movieCover);
                        if(newCover != null){
                            let updatedMovieCover = await knex('MovieCovers')
                                .where({ MovieId: movieDataToEdit.movieId})
                                .update({ 
                                    CoverName: newCover.newCoverName,
                                    CoverPath: newCover.newPath
                                }, ['MovieId'])
                                .then(function(resp) {                    
                                    output = true;
                                    return resp;
                                }).catch(err => {
                                    logger.error(err);
                                    console.log(err);
                                });

                            if(updatedMovieCover.length > 0 && updatedMovieCover[0].MovieId > 0) {
                                //remove previous movie cover
                                await fs.rm(movieCoverDB, {
                                    force: true,
                                });  
                            }
                        }                
                    }
                }       

                //update movie
                let updatedMovie = await knex('Movies')
                .where({ MovieId: movieDataToEdit.movieId})
                .update({ 
                    MovieTitle: movieDataToEdit.movieTitle, 
                    MovieYear: movieDataToEdit.movieYear,
                    NrViews: movieDataToEdit.movieNrViews,
                    IsFavorite: movieDataToEdit.isFavMovie, 
                    MovieRating: movieDataToEdit.movieRating, 
                    Observations: movieDataToEdit.movieObservations
                }, ['MovieId'])
                .then(function(resp) {                    
                    output = true;
                    return resp;
                }).catch(err => {
                    logger.error(err);
                    console.log(err);
                });

                if(updatedMovie.length > 0 && updatedMovie[0].MovieId > 0) {
                    setTimeout(async () => {  
                        win.webContents.send('reload-movies-list', null);       
                        BrowserWindow.getAllWindows().find((win) => win.webContents.id === event.sender.id).webContents.send('result-edited-movie', updatedMovie[0].MovieId);                        			
                    }, 100);   
                }                 
            }
            catch(error){
                logger.error(error);
                console.error(error);
                return false;
            }               
        });



        //Get tvshows
        ipcMain.on("getTvShows", function(e, tTitle, tYear, tIsFav, tRating, crrPage) {
            let result = knex
            .select('*')
            .from('v_TvShows')
            .orderBy([
                { column: 'TvShowYear', order: 'desc' }, 
                { column: 'TvShowTitle', order: 'asc' }
            ])
            .limit(50)
            .offset(crrPage * 50);

            if(tTitle && tTitle != '' && tTitle != ' '){
                let queryStrTile = '%' + tTitle + '%';
                result = result.whereLike('TvShowTitle', queryStrTile);
            }                

            if(tYear && tYear != '' && tYear.length > 3)
            result = result.whereLike('TvShowYear', tYear);

            if(tIsFav)
                result = result.where('IsFavorite', 1);

            if(tRating && tRating > 0 && tRating <= 10)
                result = result.where('TvShowRating', tRating);

            result.then(function (rows){          
                win.webContents.send('resultSent_tvshows', rows);
            });  
        }); 

        //Update tv show views number
        ipcMain.on('update-tvshow-nrviews', async (event, updateThisTvShowId, tvShowNrViews) => {
            tvShowNrViews++;

            //update tv show NrViews
            let updatedTvShowsPathConfig = await knex('TvShows')
            .where({ TvShowId: updateThisTvShowId})
            .update({ 
                NrViews: tvShowNrViews
            }, ['TvShowId', 'NrViews'])
            .then(function(resp) {                    
                output = true;
                return resp;
            }).catch(err => {
                logger.error(err);
                console.log(err);
            });

            if(updatedTvShowsPathConfig.length > 0) {
                //Add new tv show view
                await knex('TvShowView').insert({ 
                    TvShowId: updateThisTvShowId, 
                    CreateDate: new Date().toISOString()
                })
                .catch(function(error) {
                    logger.error(error);
                    console.error(error);
                });
                
                setTimeout(async () => {         
                    BrowserWindow.getAllWindows().find((win) => win.webContents.id === event.sender.id).webContents.send('result-update-tvshow-nrviews', updateThisTvShowId);			
                }, 1000);                   
            }
        });

        //Event to reload tvshows list
        ipcMain.on('reload-tvshows-menu', async (event, deletedTvShowId) => {
            let tvShowDB = knex('TvShows')
            .where('TvShowId', deletedTvShowId)
            .select('TvShowId', 'TvShowTitle')
            .first();

            await tvShowDB.then(function (tvShowData){          
                if(tvShowData != null && tvShowData.TvShowId > 0){
                    win.webContents.send('reload-tvshows-list', tvShowData.TvShowTitle);
                }
            });            
        });

        //Edit tv show
        ipcMain.on('edit-tvshow', async (event, tvShowsCoversPath, tvShowDataToEdit) => {      
            try
            {
                if(tvShowDataToEdit.updateCover && tvShowDataToEdit.tvShowCover != undefined && tvShowDataToEdit.tvShowCover != ""){
                    //get tvshow cover
                    let tvShowCoverDB = await knex('TvShowCovers')
                        .where('TvShowId', tvShowDataToEdit.tvShowId)
                        .where('Deleted', 0)
                        .select('*')
                        .first()
                        .then(function (tvShowCoverData){
                            return tvShowCoverData.CoverPath;
                        });    

                    if(!pathEqual(tvShowCoverDB, tvShowDataToEdit.tvShowCover)){
                        //save new tvshow cover & update db TvShowCovers
                        let newCover = saveCover(tvShowsCoversPath, tvShowDataToEdit.tvShowTitle, tvShowDataToEdit.tvShowCover);
                        if(newCover != null){
                            let updatedTvShowCover = await knex('TvShowCovers')
                                .where({ TvShowId: tvShowDataToEdit.tvShowId})
                                .update({ 
                                    CoverName: newCover.newCoverName,
                                    CoverPath: newCover.newPath
                                }, ['TvShowId'])
                                .then(function(resp) {                    
                                    output = true;
                                    return resp;
                                }).catch(err => {
                                    logger.error(err);
                                    console.log(err);
                                });

                            if(updatedTvShowCover.length > 0 && updatedTvShowCover[0].TvShowId > 0) {
                                //remove previous movie cover
                                await fs.rm(tvShowCoverDB, {
                                    force: true,
                                });  
                            }
                        }                
                    }
                }       

                //update tvshow
                let updatedTvShow = await knex('TvShows')
                .where({ TvShowId: tvShowDataToEdit.tvShowId })
                .update({ 
                    TvShowTitle: tvShowDataToEdit.tvShowTitle, 
                    TvShowYear: tvShowDataToEdit.tvShowYear,
                    NrViews: tvShowDataToEdit.tvShowNrViews,
                    IsFavorite: tvShowDataToEdit.isFavTvShow, 
                    TvShowRating: tvShowDataToEdit.tvShowRating, 
                    Observations: tvShowDataToEdit.tvShowObservations
                }, ['TvShowId'])
                .then(function(resp) {                    
                    output = true;
                    return resp;
                }).catch(err => {
                    logger.error(err);
                    console.log(err);
                });

                if(updatedTvShow.length > 0 && updatedTvShow[0].TvShowId > 0) {
                    setTimeout(async () => {  
                        win.webContents.send('reload-tvshows-list', null);       
                        BrowserWindow.getAllWindows().find((win) => win.webContents.id === event.sender.id).webContents.send('result-edited-tvshow', updatedTvShow[0].TvShowId);                        			
                    }, 100);   
                }                 
            }
            catch(error){
                logger.error(error);
                console.error(error);
                return false;
            }               
        });
    });
}

app.on('ready', createWindow);

//"Private methods"
let saveCover = (coversPath, title, newCover) => {

    if(coversPath == null || title == null || title == '' || title == ' ' || newCover == null)
        return null;

    //get new cover file extension
    let coverExtension = "";
    let fileName = newCover.split('/');
    if(fileName != null && fileName.length > 0){    
        let fileExtension = fileName[fileName.length - 1].split('.');
        if(fileExtension != null && fileExtension.length > 0){
            coverExtension = fileExtension[fileExtension.length - 1];
        }
    }

    //remove spaces and special chars from title
    //generate small guid with nanoid package
    //create new cover name with file extension
    let newCoverName = title.replace(/[^A-Z0-9]+/ig, "") + '_' + nanoid(7) + '.' + coverExtension;
   
    //TODO: Get config path for covers folder
    //let path = "C:\\Users\\AndrePC\\Downloads\\TesteFrameJunkie";
    let newPath = coversPath.concat(newCoverName);

    //oldPath = newMovieCover
    renameFile(newCover, newPath);

    return { newCoverName, newPath };
}

async function renameFile(oldPath, newPath) {
    try 
    {
        await fs.rename(oldPath, newPath);
        console.log('Rename complete!');
        
    } catch (err) 
    {
        logger.error(error);
        console.error(error);
    }
}