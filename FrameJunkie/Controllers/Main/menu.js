const electron = require("electron");
const ipc = electron.ipcRenderer;
const fs = require('fs')
const path = require('path');
const { pathToFileURL } = require('node:url');

const { closeToastMessage } = require('../../index.js'); 
const { loadDashBoardData } = require('./menu_dashboard');
const { loadMovies } = require('./menu_movies'); 
const { loadNewMovie } = require('./menu_newMovie.js'); 
const { loadSettings } = require('./menu_settings.js'); 

//INIT WITH HOME
fs.readFile('./Views/Home/home.html', (err, data) => {

    setTimeout(() => {
        document.getElementById('content-main-app').innerHTML += data;

        loadDashBoardData();
    
        //Show data container
        document.getElementById('loading_container').remove();
        document.getElementById('home_container').style.visibility = "visible";
    
        $("#home_container").animate({"opacity": 1}, 600);
    }, 1000);            
});

 //BUTTONS
$('#btnHome').on('click', function (event){
    hideMenu();
    resetMenu();

    fs.readFile(path.join(__dirname, '../../Views/Home/home.html'), (err, data) => {          
		if(err != null) 
            alert(err);
        else{
            setTimeout(() => {
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
	fs.readFile(path.join(__dirname, '../../Views/Movies/movies.html'), (err, data) => {
		document.getElementById('content-main-app').innerHTML = data;
		loadMovies();
		if(err != null) alert(err);
    });

    hideMenu();
});

$('#btnNewMovie').on('click', function (event){
    fs.readFile(path.join(__dirname, '../../Views/Movies/new-movie.html'), (err, data) => {
		document.getElementById('content-main-app').innerHTML = data;
        loadNewMovie();
		if(err != null) alert(err);
    });

    hideMenu();
});

$('#btnTvShows').on('click', function (event){
    $('#content-main-app').load(' ');
    hideMenu();
});

$('#btnNewTvShow').on('click', function (event){
    $('#content-main-app').load(' ');
    hideMenu();
});

$('#btnSettings').on('click', function (event){
    fs.readFile(path.join(__dirname, '../../Views/SettingsPages/settings.html'), (err, data) => {
		document.getElementById('content-main-app').innerHTML = data;
        loadSettings();
		if(err != null) alert(err);
    });

    hideMenu();
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

