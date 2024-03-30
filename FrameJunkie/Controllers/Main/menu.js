const electron = require("electron");
const ipc = electron.ipcRenderer;
const fs = require('fs')
const path = require('path');
const { pathToFileURL } = require('node:url');

const { closeToastMessage } = require('../../index.js'); 
const { loadDashBoardData } = require('./menu_dashboard.js');
const { loadMovies } = require('./menu_movies.js'); 
const { loadNewMovie } = require('./menu_newMovie.js'); 
const { loadTvShows } = require('./menu_tvshows.js'); 
const { loadNewTvShow } = require('./menu_newTvShow.js'); 
const { loadSettings } = require('./menu_settings.js'); 

//INIT WITH HOME
fs.readFile(path.join(__dirname, '../../Views/Home/home.html'), (err, data) => {
    if(err != null) 
        alert(err);
    else{
        setTimeout(async () => {
            document.getElementById('content-main-app').innerHTML += data;
    
            loadDashBoardData();       
    
            //Show data container
            document.getElementById('loading_container').remove();
            document.getElementById('home_container').style.visibility = "visible";
        
            $("#home_container").animate({"opacity": 1 }, 600);
        }, 1000);  
    }              
});

 //BUTTONS
$('#btnHome').on('click', function (event){
    hideMenu();
    resetMenu();

    fs.readFile(path.join(__dirname, '../../Views/Home/home.html'), (err, data) => {          
		if(err != null) 
            alert(err);
        else{
            setTimeout(async () => {
                document.getElementById('content-main-app').innerHTML += data;
        
                loadDashBoardData();
            
                //Show data container
                document.getElementById('loading_container').remove();
                document.getElementById('home_container').style.visibility = "visible";
            
                $("#home_container").animate({"opacity": 1}, 600);
            }, 1000);   
        }
     });
});

$('#btnMovies').on('click', function (event){
    hideMenu();
    resetMenu();

	fs.readFile(path.join(__dirname, '../../Views/Movies/movies.html'), (err, data) => {
		if(err != null) 
            alert(err);
        else{
            setTimeout(async () => {
                document.getElementById('content-main-app').innerHTML += data;                

                loadMovies();                
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec

                //Show data container
                document.getElementById('loading_container').remove();
                document.getElementById('movies_container').style.visibility = "visible";
            
                $("#movies_container").animate({"opacity": 1}, 600);
            }, 1000);            
        }      		
    });
});

$('#btnNewMovie').on('click', function (event){
    hideMenu();
    resetMenu();

    fs.readFile(path.join(__dirname, '../../Views/Movies/new-movie.html'), (err, data) => {
        if(err != null) 
            alert(err);
        else{
            setTimeout(async () => {
                document.getElementById('content-main-app').innerHTML += data;

                loadNewMovie();

                //Show data container
                document.getElementById('loading_container').remove();
                document.getElementById('new_movie_container').style.visibility = "visible";
            
                $("#new_movie_container").animate({"opacity": 1}, 600);
            }, 1000);      
        }   
    });
});

$('#btnTvShows').on('click', function (event){
    hideMenu();
    resetMenu();

	fs.readFile(path.join(__dirname, '../../Views/TvShows/tvshows.html'), (err, data) => {
		if(err != null) 
            alert(err);
        else{
            setTimeout(async () => {
                document.getElementById('content-main-app').innerHTML += data;                

                loadTvShows();                
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec

                //Show data container
                document.getElementById('loading_container').remove();
                document.getElementById('tvshows_container').style.visibility = "visible";
            
                $("#tvshows_container").animate({"opacity": 1}, 600);
            }, 1000);            
        }      		
    });
});

$('#btnNewTvShow').on('click', function (event){
    hideMenu();
    resetMenu();

    fs.readFile(path.join(__dirname, '../../Views/TvShows/new-tvshow.html'), (err, data) => {
        if(err != null) 
            alert(err);
        else{
            setTimeout(async () => {
                document.getElementById('content-main-app').innerHTML += data;

                loadNewTvShow();

                //Show data container
                document.getElementById('loading_container').remove();
                document.getElementById('new_tvshow_container').style.visibility = "visible";
            
                $("#new_tvshow_container").animate({"opacity": 1}, 600);
            }, 1000);      
        }   
    });
});

$('#btnSettings').on('click', function (event){
    hideMenu();
    resetMenu();

    fs.readFile(path.join(__dirname, '../../Views/SettingsPages/settings.html'), (err, data) => {
		if(err != null) 
            alert(err);
        else{
            setTimeout(async () => {
                document.getElementById('content-main-app').innerHTML += data;

                loadSettings();

                //Show data container
                document.getElementById('loading_container').remove();
                document.getElementById('settings_container').style.visibility = "visible";
            
                $("#settings_container").animate({"opacity": 1}, 600);
            }, 1000);                 
        }       
		
    });
});

function hideMenu(){
    closeToastMessage();

    $('#navcheck').trigger("click"); //.click();  deprecated
}

function resetMenu(){
    var loadingHtml = '<div id="loading_container" class="loading-container">' +
    '<img class="loading-img" src="./Content/Images/loading_animation.gif" width="60" height="60"></div>';

    document.getElementById('content-main-app').innerHTML = loadingHtml;
    document.getElementById("content-main-app").style.overflowY = "hidden";
}

