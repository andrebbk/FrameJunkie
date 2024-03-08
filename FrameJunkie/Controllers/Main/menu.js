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
/*fs.readFile('./Views/Home/home.html', (err, data) => {

    setTimeout(async () => {
        document.getElementById('content-main-app').innerHTML += data;

        loadDashBoardData();       

        //Show data container
        document.getElementById('loading_container').remove();
        document.getElementById('home_container').style.visibility = "visible";
    
        $("#home_container").animate({"opacity": 1}, 600);
    }, 1000);            
});*/

//TEST INIT
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
    $('#content-main-app').load(' ');
    hideMenu();
});

$('#btnNewTvShow').on('click', function (event){
    $('#content-main-app').load(' ');
    hideMenu();
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

