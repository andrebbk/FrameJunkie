const electron = require("electron");
const ipc = electron.ipcRenderer;
const { pathToFileURL } = require('node:url');
const { nanoid } = require("nanoid");
const fs = require('fs').promises;
const path = require('path'); 
const logger = require('@electron/remote').require('./logger');

//Toast Notifications
const toast = document.querySelector("#movie_detail_container .toastt"), 
    closeIcon = document.querySelector("#movie_detail_container .close-toastt"), 
    progress = document.querySelector("#movie_detail_container .progress-toastt");

let timer1, timer2;

 //close notification event
 closeIcon.addEventListener("click", () => { 
    toast.classList.remove("active");
    toast.style.opacity = "0";

    setTimeout(() => {
      progress.classList.remove("active");
    }, 300);
  
    clearTimeout(timer1);
    clearTimeout(timer2);
  });

//Toast Notifications END

let knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./Northwind.sl3"
    },
    useNullAsDefault: true
});

let loadedMovieId = 0;
let loadedMovieNrViews = 0;
let hasNewMovieCover = false, newMovieCover = "";

ipc.on('message-movie-id', (event, movieId) => {
    loadedMovieId = movieId;

    setTimeout(async () => {         
        await loadMovieDetails();

        //Show data container
        document.querySelector('#movie-details-container #moviedetails_partial #loading_container').remove();

        document.querySelector('#movie-details-container #moviedetails_partial #md-container').style.visibility = "visible";    
        $("#movie-details-container #moviedetails_partial #md-container").animate({"opacity": 1}, 600);

        $("#movie-details-container .details-buttons-container").animate({"opacity": 1}, 600);
    }, 1000);       
});

ipc.on('result-update-movie-nrviews', (event, updateThisMovieId) => {    
    loadedMovieId = updateThisMovieId;

    setTimeout(async () => {         
        await loadMovieDetails();

        //Show data container
        document.querySelector('#movie-details-container #moviedetails_partial #loading_container').remove();

        document.querySelector('#movie-details-container #moviedetails_partial #md-container').style.visibility = "visible";    
        $("#movie-details-container #moviedetails_partial #md-container").animate({"opacity": 1}, 600);

        $("#movie-details-container .details-buttons-container").animate({"opacity": 1}, 600);

        await setTimeout(500);
        showToastMessage("Frame Junkie", "Movie view added!");      
    }, 1000);       
});

async function loadMovieDetails(){
    let movieDB = knex('Movies')
    .where('MovieId', loadedMovieId)
    .select('*')
    .first();

    movieDB.then(function (movieData){          
        if(movieData != null && movieData.MovieId > 0){
            $('#movie-details-title', '#movie_detail_container').text(movieData.MovieTitle);
            $('#movie-details-year', '#movie_detail_container').text(movieData.MovieYear);

            loadedMovieNrViews = movieData.NrViews;
            let movieViewsText = movieData.NrViews + (movieData.NrViews === 1 ? " VIEW" : " VIEWS");
            $('#movie-details-views', '#movie_detail_container').text(movieViewsText);

            if(movieData.IsFavorite)
                document.querySelector('#movie_detail_container #movie-details-fav').style.visibility = "visible";
            else
                document.querySelector('#movie_detail_container #movie-details-fav').style.visibility = "hidden";

            let starElements = document.querySelectorAll('#moviedetails_partial input[type=radio].star');
            if(starElements != null && starElements.length > 0){
                $.each(starElements, function(idx, value){
                    value.checked = false;

                    if(value.dataset.starvalue == movieData.MovieRating) value.checked = true;
                });
            }

            if(movieData.Observations != null && movieData.Observations != "" && movieData.Observations != " " && movieData.Observations.length > 1){
                $('#movie-details-observations', '#movie_detail_container').text(movieData.Observations);
            }else{
                $('#movie-details-observations', '#movie_detail_container').text("No observations added for this movie");                
            }

            let movieCoverDB = knex('MovieCovers')
            .where('MovieId', loadedMovieId)
            .where('Deleted', 0)
            .select('*')
            .first();
            
            movieCoverDB.then(function (movieCoverData){      
                if(movieCoverData != null && movieCoverData.MovieId > 0){
                    var movieCoverElm = document.querySelector('#movie_detail_container #movie-cover-details');
                    if(movieCoverElm != null){
                        movieCoverElm.src = pathToFileURL(movieCoverData.CoverPath);
                    }
                }
            });
        }
    });
}

function showToastMessage(title, msg) {   
    if(toast.classList.contains("active") || progress.classList.contains("active")){
        clearTimeout(timer1);
        clearTimeout(timer2);
        
        toast.classList.remove("active");
        progress.classList.remove("active");
        progress.style.right = getComputedStyle(progress).right;
    }

    //set message info
    document.getElementById("toastt-title").textContent = title;
    document.getElementById("toastt-msg").textContent = msg;

    //show toast warning
    toast.style.opacity = "1";
    toast.classList.add("active");
    progress.classList.add("active");
  
    timer1 = setTimeout(() => {
      toast.classList.remove("active");
      toast.style.opacity = "0";
    }, 5000); //1s = 1000 milliseconds
  
    timer2 = setTimeout(() => {
      progress.classList.remove("active");
    }, 5300);
}

function closeToastMessage(){
    toast.classList.remove("active");
    toast.style.opacity = "0";
    setTimeout(() => {
        progress.classList.remove("active");
    }, 300);
    
    clearTimeout(timer1);
    clearTimeout(timer2);
}

$('#btn_exit_movie_details').on('click', function(event){   
    let popupWindow = require('@electron/remote').getCurrentWindow();
    popupWindow.close();
});

//ADD MOVIE VIEW
$('#btnAddMovieView', '#movie_detail_container').on('click', function(event){       
    addNewMovieView();
});

function addNewMovieView(){
    let output = true;

    try
    {
        ipc.send('update-movie-nrviews', loadedMovieId, loadedMovieNrViews);
    }
    catch(error){
        logger.error(error);
        console.error(error);
        return false;
    }       

    return output;
}

function addAndShowLoading(){
    let loadingHTML = '<div id="loading_container" class="loading-container">'
        + '<img class="loading-img" src="../../Content/Images/loading_animation.gif" width="90" height="60"></div>';
        
    $("#moviedetails_partial", "#movie-details-container").prepend($(loadingHTML).fadeIn('slow'));
}

function loadNewMovie() {   

    //Load Filters
	$('#movie-year', '#me-container').html('');

	var crrYear = new Date().getFullYear();	
	for (let y = Number(crrYear); y > 1979; y--) {
		var optionHtml = '<option value="' + y + '">' + y + '</option>';
		$('#movie-year', '#me-container').append(optionHtml);
	}

	$('#movie-year').val(Number(crrYear)); //init Movie Year

    //BUTTONS SECTION
    $('#btnSelectCover', '#me-container').on('click', function(){
        $('#movie-cover-upload', '#me-container').trigger("click"); //.click() call is deprecated
    });    

    $('#movie-cover-upload', '#me-container').on('change', function(event){
        var reader = new FileReader();
        reader.onload = function(){
            if(event.target.files[0] != null && event.target.files[0] != undefined){
                var output = document.getElementById('movie-cover-output');
                //output.style.backgroundImage = "Url('" + pathToFileURL(event.target.files[0].path) + "')";

                output.src = pathToFileURL(event.target.files[0].path);

                //show refresh button
                var btnRefresh = document.getElementById('btnRefreshMovieCover');
                if(!document.getElementById('btnRefreshMovieCover').classList.contains("change"))
                { document.querySelector('.refresh-movie-cover').classList.toggle('change'); }      
                
                hasNewMovieCover = true;
                newMovieCover = event.target.files[0].path;
            }          
        };

        if(event.target.files[0] != null && event.target.files[0] != undefined)
            reader.readAsDataURL(event.target.files[0]);
    });    

    $('#btnRefreshMovieCover', '#me-container').on('click', function(){
        var output = document.getElementById('movie-cover-output');
        output.src = pathToFileURL("./Content/Images/No-Image-Placeholder.png");

        document.querySelector('.refresh-movie-cover').classList.toggle('change');

        hasNewMovieCover = false;
        newMovieCover = "";
    });    

    //add star events
    const stars = document.querySelectorAll('#me-container .star');
    stars.forEach(el => el.addEventListener('click', event => {
        var btnRefresh = document.getElementById('btnRefreshMovieRating');
                
        if(!document.getElementById('btnRefreshMovieRating').classList.contains("change"))
        { document.querySelector('me-container .refresh-movie-rating').classList.toggle('change'); }      
    }));

    $('#btnRefreshMovieRating', '#me-container').on('click', function(){
        var starElements = document.getElementsByClassName("star");
        if(starElements != null && starElements.length > 0){

            $.each(starElements, function(idx, value){
                value.checked = false;
            });
        }

        document.querySelector('#me-container .refresh-movie-rating').classList.toggle('change');
    });     
}


//EDIT MOVIE
$('#btnEditMovie', '#movie_detail_container').on('click', function(event){

    $("#movie-details-container .details-buttons-container").animate({"opacity": 0 }, 200);
    document.querySelector('#movie-details-container #moviedetails_partial #md-container').style.visibility = "collapse";    
    document.querySelector('#movie-details-container #moviedetails_partial #md-container').style.height = 0;    
    $("#movie-details-container #moviedetails_partial #md-container").animate({"opacity": 0 }, 200);

    //Show loading
    addAndShowLoading();
    loadNewMovie();
    
    setTimeout(() => {
         //Show data container
         document.querySelector('#movie-details-container #moviedetails_partial #loading_container').remove();

        document.querySelector('#movie-details-container #moviedetails_partial #me-container').style.visibility = "visible";   
        document.querySelector('#movie-details-container #moviedetails_partial #me-container').style.height = 530;   
        $("#movie-details-container #moviedetails_partial #me-container").animate({"opacity": 1 }, 600);
    }, 500);
    
});
