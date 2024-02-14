const electron = require("electron");
const ipc = electron.ipcRenderer;
const fs = require('fs')
const path = require('path');
const { pathToFileURL } = require('node:url');

const { loadDashBoardData } = require('./menu_dashboard');
const { loadMovies } = require('./menu_movies'); 
const { showToastMessage, closeToastMessage } = require('../../index.js'); 

let knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./Northwind.sl3"
    },
    useNullAsDefault: true
});

//INIT WITH HOME
/*fs.readFile('./Views/Home/home.html', (err, data) => {
    document.getElementById('content-main-app').innerHTML = data;
    loadDashBoardData();
});*/
fs.readFile(path.join(__dirname, '../../Views/Movies/new-movie.html'), (err, data) => {
    document.getElementById('content-main-app').innerHTML = data;
    loadNewMovie();
    if(err != null) alert(err);
});

 //BUTTONS
$('#btnHome').on('click', function (event){
    fs.readFile(path.join(__dirname, '../../Views/Home/home.html'), (err, data) => {
        document.getElementById('content-main-app').innerHTML = data;
        loadDashBoardData();
		if(err != null) alert(err);
     });

    hideMenu();
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
    $('#content-main-app').load(' ');
    hideMenu();
});

function hideMenu(){
    closeToastMessage();

    $('#navcheck').click();    
}

function loadNewMovie() {
    //Load Filters
	$('#movie-year').html('');

	var crrYear = new Date().getFullYear();	
	for (let y = Number(crrYear); y > 1979; y--) {
		var optionHtml = '<option value="' + y + '">' + y + '</option>';
		$('#movie-year').append(optionHtml);
	}

	$('#movie-year').val(Number(crrYear)); //init Movie Year

    //BUTTONS SECTION
    $('#btnSelectCover').on('click', function(){
        $('#movie-cover-upload').click();
    });    

    $('#movie-cover-upload').on('change', function(event){
        var reader = new FileReader();
        reader.onload = function(){
            if(event.target.files[0] != null){
                var output = document.getElementById('movie-cover-output');
                //output.style.backgroundImage = "Url('" + pathToFileURL(event.target.files[0].path) + "')";

                output.src = pathToFileURL(event.target.files[0].path);

                //show refresh button
                var btnRefresh = document.getElementById('btnRefreshMovieCover');
                if(!document.getElementById('btnRefreshMovieCover').classList.contains("change"))
                { document.querySelector('.refresh-movie-cover').classList.toggle('change'); }                    
            }          
        };
        reader.readAsDataURL(event.target.files[0]);
    });    

    $('#btnRefreshMovieCover').on('click', function(){
        var output = document.getElementById('movie-cover-output');
        output.src = pathToFileURL("./Content/Images/No-Image-Placeholder.png");

        document.querySelector('.refresh-movie-cover').classList.toggle('change');
    });    

    //add star events
    const stars = document.querySelectorAll('.star');
    stars.forEach(el => el.addEventListener('click', event => {
        var btnRefresh = document.getElementById('btnRefreshMovieRating');
                
        if(!document.getElementById('btnRefreshMovieRating').classList.contains("change"))
        { document.querySelector('.refresh-movie-rating').classList.toggle('change'); }      
    }));

    $('#btnRefreshMovieRating').on('click', function(){
        var starElements = document.getElementsByClassName("star");
        if(starElements != null && starElements.length > 0){

            $.each(starElements, function(idx, value){
                value.checked = false;
            });
        }

        document.querySelector('.refresh-movie-rating').classList.toggle('change');
    });    


    $('#btnClearNewMovie').on('click', function(){

        //Movie Title
        $('#movie-title').val('');

        //Movie Year
        var crrYear = new Date().getFullYear();	
		$('#movie-year').val(Number(crrYear)); 

         //Is Favorite
		$('#movie-isfav').prop("checked", false);

        //Movie Rating
        var starElements = document.getElementsByClassName("star");
        if(starElements != null && starElements.length > 0){

            $.each(starElements, function(idx, value){
                value.checked = false;
            });
        }

        if(document.getElementById('btnRefreshMovieRating').classList.contains("change"))
        { document.querySelector('.refresh-movie-rating').classList.toggle('change'); } 

        //Movie Observations
        $('#movie-observations-id').val('');

        //Movie Cover
        var output = document.getElementById('movie-cover-output');
        output.src = pathToFileURL("./Content/Images/No-Image-Placeholder.png");

        if(document.getElementById('btnRefreshMovieCover').classList.contains("change"))
        { document.querySelector('.refresh-movie-cover').classList.toggle('change'); }    

        showToastMessage("Frame Junkie", "New movie form cleared with success!");
    });

    $('#btnSaveNewMovie').on('click', function(){
        showToastMessage("Frame Junkie", "Save new movie test");
    });
}