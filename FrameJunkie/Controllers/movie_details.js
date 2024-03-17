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

ipc.on('message-movie-id', (event, movieId) => {
    loadedMovieId = movieId;

    setTimeout(async () => {         
        await loadMovieDetails();

        //Show data container
        document.querySelector('#movie-details-container #moviedetails_partial #loading_container').remove();

        document.querySelector('#movie-details-container #moviedetails_partial .flex-container').style.visibility = "visible";    
        $("#movie-details-container #moviedetails_partial .flex-container").animate({"opacity": 1}, 600);

        $("#movie-details-container .details-buttons-container").animate({"opacity": 1}, 600);
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

$('#btnAddMovieView', '#movie_detail_container').on('click', function(event){       
    showToastMessage("Frame Junkie", "Added view!");
});