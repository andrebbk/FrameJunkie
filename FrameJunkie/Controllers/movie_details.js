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
let isToEdit = false;

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

ipc.on('delete-movie', (event) => {    
    console.log('delete-movie');   
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

            let starElements = document.querySelectorAll('#md-container input[type=radio].star');
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

function loadEditMovie() {   

    //Load Filters
	$('#movie-edit-year', '#me-container').html('');

	var crrYear = new Date().getFullYear();	
	for (let y = Number(crrYear); y > 1979; y--) {
		var optionHtml = '<option value="' + y + '">' + y + '</option>';
		$('#movie-edit-year', '#me-container').append(optionHtml);
	}

	$('#movie-edit-year').val(Number(crrYear)); //init Movie Year     

    //BUTTONS SECTION
    $('#btnSelectCover', '.details-buttons-container').off('click').on('click', function(){
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

    //init numberstyle
    $.fn.numberstyle = function(options) {
	  
		/*
		 * Default settings
		 */
		var settings = $.extend({
		  value: 0,
		  step: undefined,
		  min: undefined,
		  max: undefined
		}, options );
	
		/*
		 * Init every element
		 */
		return this.each(function(i) {
			
		  /*
		   * Base options
		   */
		  var input = $(this);
			  
		  /*
		   * Add new DOM
		   */
          if(input.closest('.numberstyle-qty')[0] == undefined){
                var container = document.createElement('div'),
                btnAdd = document.createElement('div'),
                btnRem = document.createElement('div'),
                min = (settings.min) ? settings.min : input.attr('min'),
                max = (settings.max) ? settings.max : input.attr('max'),
                value = (settings.value) ? settings.value : parseFloat(input.val());

                container.className = 'numberstyle-qty';
                btnAdd.className = (max && value >= max ) ? 'qty-btn qty-add disabled' : 'qty-btn qty-add';
                btnAdd.innerHTML = '+';
                btnRem.className = (min && value <= min) ? 'qty-btn qty-rem disabled' : 'qty-btn qty-rem';
                btnRem.innerHTML = '-';
                input.wrap(container);
                input.closest('.numberstyle-qty').prepend(btnRem).append(btnAdd);
          }	 
	
		  /*
		   * Attach events
		   */
		  // use .off() to prevent triggering twice
		  $(document).off('click','.qty-btn').on('click','.qty-btn',function(e){
			
			var input = $(this).siblings('input'),
				sibBtn = $(this).siblings('.qty-btn'),
				step = (settings.step) ? parseFloat(settings.step) : parseFloat(input.attr('step')),
				min = (settings.min) ? settings.min : ( input.attr('min') ) ? input.attr('min') : undefined,
				max = (settings.max) ? settings.max : ( input.attr('max') ) ? input.attr('max') : undefined,
				oldValue = parseFloat(input.val()),
				newVal;
			
			//Add value
			if ( $(this).hasClass('qty-add') ) {   
			  
			  newVal = (oldValue >= max) ? oldValue : oldValue + step,
			  newVal = (newVal > max) ? max : newVal;
			  
			  if (newVal == max) {
				$(this).addClass('disabled');
			  }
			  sibBtn.removeClass('disabled');
			 
			//Remove value
			} else {
			  
			  newVal = (oldValue <= min) ? oldValue : oldValue - step,
			  newVal = (newVal < min) ? min : newVal; 
			  
			  if (newVal == min) {
				$(this).addClass('disabled');
			  }
			  sibBtn.removeClass('disabled');
			  
			}
			  
			//Update value
			input.val(newVal).trigger('change');
				
		  });
		  
		  input.off('change').on('change',function(){
			
			const val = parseFloat(input.val()),
				  min = (settings.min) ? settings.min : ( input.attr('min') ) ? input.attr('min') : undefined,
				  max = (settings.max) ? settings.max : ( input.attr('max') ) ? input.attr('max') : undefined;
			
			if ( val > max ) {
			  input.val(max);   
			}
			
			if ( val < min ) {
			  input.val(min);
			}
		  });
		  
		});
	};	
	  
	//Init number controller
	$('.numberstyle').numberstyle();

    //add star events
    const stars = document.querySelectorAll('#me-container .star');
    stars.forEach(el => el.addEventListener('click', event => {
        var btnRefresh = document.getElementById('btnRefreshMovieRating');
                
        if(!document.getElementById('btnRefreshMovieRating').classList.contains("change"))
        { document.querySelector('#me-container .refresh-movie-rating').classList.toggle('change'); }      
    }));

    //Edit a movie means rating and cover fields have always a content value
    if(!document.getElementById('btnRefreshMovieCover').classList.contains("change"))
    { document.querySelector('.refresh-movie-cover').classList.toggle('change'); }      
                
    if(!document.getElementById('btnRefreshMovieRating').classList.contains("change"))
    { document.querySelector('#me-container .refresh-movie-rating').classList.toggle('change'); } 

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

    if(isToEdit){
        isToEdit = false;
        showToastMessage("Frame Junkie", "Successfully edited Movie!");  
    }else{

        //LOAD MOVIE TO EDIT        
        $("#movie-details-container .details-buttons-container").animate({"opacity": 0 }, 0);
        document.querySelector('#movie-details-container #moviedetails_partial #md-container').style.visibility = "collapse";    
        document.querySelector('#movie-details-container #moviedetails_partial #md-container').style.height = 0;    
        $("#movie-details-container #moviedetails_partial #md-container").animate({"opacity": 0 }, 0);
    
        //Show loading
        addAndShowLoading();
    
        loadEditMovie();
        
        setTimeout(async () => {
            await loadMovieToEdit();
            //Show data container
            document.querySelector('#movie-details-container #moviedetails_partial #loading_container').remove();
    
            document.querySelector('#movie-details-container #moviedetails_partial #me-container').style.visibility = "visible";   
            document.querySelector('#movie-details-container #moviedetails_partial #me-container').style.height = 530;   
            $("#movie-details-container #moviedetails_partial #me-container").animate({"opacity": 1 }, 600);
    
            $('#movie-edit-title', '#me-container').trigger('focus');
    
            showEditButtons(true);
            isToEdit = true;
            
        }, 500);
    }    
});

async function loadMovieToEdit(){
    let movieToEditDB = knex('Movies')
    .where('MovieId', loadedMovieId)
    .select('*')
    .first();

    movieToEditDB.then(function (movieData){          
        if(movieData != null && movieData.MovieId > 0){

            //Movie Data
            $('#movie-edit-title', '#me-container').val(movieData.MovieTitle);
            $('#movie-edit-year', '#me-container').val(Number(movieData.MovieYear));
            $('#movie-edit-views', '#me-container').val(movieData.NrViews);
            $('#movie-edit-observations', '#me-container').text(movieData.Observations);

            //Is Favorite
            $('#switch_IsFav').prop("checked", movieData.IsFavorite);

            //Movie Rating
            let starElements = document.querySelectorAll('#me-container input[type=radio].star');
            if(starElements != null && starElements.length > 0){
                $.each(starElements, function(idx, value){
                    value.checked = false;
                    if(value.dataset.starvalue == movieData.MovieRating) value.checked = true;
                });
            }

            //Movie Cover
            let movieCoverDB = knex('MovieCovers')
            .where('MovieId', loadedMovieId)
            .where('Deleted', 0)
            .select('*')
            .first();
            
            movieCoverDB.then(function (movieCoverData){      
                if(movieCoverData != null && movieCoverData.MovieId > 0){
                    var movieCoverElm = document.querySelector('#me-container #movie-cover-output');
                    if(movieCoverElm != null){
                        movieCoverElm.src = pathToFileURL(movieCoverData.CoverPath);
                    }
                }
            });
        }
    });
}

//BACK
$('#btnBack', '#movie_detail_container').on('click', function(event){
    $("#movie-details-container .details-buttons-container").animate({"opacity": 0 }, 0);
    document.querySelector('#movie-details-container #moviedetails_partial #me-container').style.visibility = "collapse";    
    document.querySelector('#movie-details-container #moviedetails_partial #me-container').style.height = 0;    
    $("#movie-details-container #moviedetails_partial #me-container").animate({"opacity": 0 }, 0);

    //Show loading
    addAndShowLoading();

    setTimeout(async () => {         
        await loadMovieDetails();

        //Show data container
        document.querySelector('#movie-details-container #moviedetails_partial #loading_container').remove();

        document.querySelector('#movie-details-container #moviedetails_partial #md-container').style.height = 530;  
        document.querySelector('#movie-details-container #moviedetails_partial #md-container').style.visibility = "visible";    
        $("#movie-details-container #moviedetails_partial #md-container").animate({"opacity": 1}, 600);

        showEditButtons(false);   
        isToEdit = false;
    }, 1000); 
});

function showEditButtons(showEditButtons){
    if(showEditButtons === true){
        document.querySelector("#movie-details-container #btnAddMovieView").style.display = "none";  
        document.querySelector("#movie-details-container #btnBack").style.display = "";  
        document.querySelector("#movie-details-container #btnEditMovie").style.display = "";  
        document.querySelector("#movie-details-container #btnDeleteMovie").style.display = "none";  
        document.querySelector("#movie-details-container #btnSelectCover").style.display = "";  
    }
    else{
        document.querySelector("#movie-details-container #btnAddMovieView").style.display = "";  
        document.querySelector("#movie-details-container #btnBack").style.display = "none";  
        document.querySelector("#movie-details-container #btnEditMovie").style.display = "";  
        document.querySelector("#movie-details-container #btnDeleteMovie").style.display = "";  
        document.querySelector("#movie-details-container #btnSelectCover").style.display = "none";  
    }

    $("#movie-details-container .details-buttons-container").animate({"opacity": 1 }, 200);
}

//DELETE
$('#btnDeleteMovie', '#movie_detail_container').on('click', function(event){
    ipc.send('openConfirmDialog', 'Are you sure you would like to delete this movie?', 'delete-movie');
});

async function deleteMovie(){
    let output = true;

    try
    {
        //delete movie
        let deletedMovie = await knex('Movies')
        .where({ MovieId: loadedMovieId})
        .update({ 
            Deleted: 1
        }, ['MovieId', 'Deleted'])
        .then(function(resp) {                    
            output = true;
            return resp;
        }).catch(err => {
            logger.error(err);
            console.log(err);
        });

        if(deletedMovie.length > 0) {

            //delete movie cover            
            let deletedMovie = await knex('MovieCovers')
            .where({ MovieId: loadedMovieId})
            .update({ 
                Deleted: 1
            }, ['MovieId', 'Deleted'])
            .then(function(resp) {                    
                output = true;
                return resp;
            }).catch(err => {
                logger.error(err);
                console.log(err);
            });                
        }
    }
    catch(error){
        logger.error(error);
        console.error(error);
        return false;
    }  

    return output;
}

