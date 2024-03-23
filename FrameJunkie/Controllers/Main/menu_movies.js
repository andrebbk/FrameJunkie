const electron = require("electron");
const ipc = electron.ipcRenderer;
const BrowserWindow = require('@electron/remote').BrowserWindow;

//pagination
let currentPage = 0;
let maxPage = 1000;
let itemsPerPage = 50;

let popupWindow = null;

function loadMovies(){

	//Load Filters
	$('#fltr-movie-year').html('');
	var optionHtml = '<option value="0">Select movie year</option>';
	$('#fltr-movie-year').append(optionHtml);

	var crrYear = new Date().getFullYear();	
	for (let y = Number(crrYear); y > 1979; y--) {
		var optionHtml = '<option value="' + y + '">' + y + '</option>';
		$('#fltr-movie-year').append(optionHtml);
	}

	$('#fltr-movie-year').val(0); //init Movie Year

	//Filters
	var isFavorites = $('#fltr-movie-isfav').is(':checked');

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
		  
		  input.on('change',function(){
			
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
	  
	//Init	 
	$('.numberstyle').numberstyle();
	
	//Get movies
	currentPage = 0;
	ipc.send("getMovies", null, null, null, null, currentPage);
	ipc.on("resultSent_movies", async function (event, result) {

		//to top
		$("#content-main-app").animate({ scrollTop: 0 }, "fast");

		document.getElementById('pagination-controls-container').style.display = "none";
		document.getElementById('gridMovies').style.visibility = "collapse";
		document.getElementById('gridMovies').style.opacity = 0;

		//show loading
		var loadingHtml = '<div id="loading_container" class="loading-container">' +
    	'<img class="loading-img" src="./Content/Images/loading_animation.gif" width="60" height="60"></div>';

    	document.getElementById('movies_empty_container').innerHTML = loadingHtml;
		$('#gridMovies').html('');
		
		document.getElementById("content-main-app").style.overflowY = "hidden";	

		await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec	

		for(var i = 0; i < result.length; i++){
			let movieElm = '<div class="movie-card" data-movieid="' + result[i].MovieId + '">' +
			`<div class="movie-header" style="background: url('file://` + result[i].CoverPath.trim() + `');  background-size: cover;">` +
			'<div class="header-icon-container">' +
			'</div>' +
			'</div>' +
			'<div class="movie-content">' +
			'<div class="movie-content-header">';

			if(result[i].IsFavorite === 1)
				movieElm += '<a href="#"><h3 class="movie-title">' + result[i].MovieTitle + '  &nbsp; &#9733;</h3></a>';
			else
				movieElm += '<a href="#"><h3 class="movie-title">' + result[i].MovieTitle + '</h3></a>';

			movieElm += '<h3 class="movie-year">' + result[i].MovieYear + '<span style="margin-left:200px;">' + result[i].MovieRating + '/10</span></h3>' +
			'</div></div></div>';

			$('#gridMovies').append($(movieElm));
		}

		if(result.length < 50) maxPage = currentPage;
		else{
			//reset pagination values
			maxPage = 1000;
		}

		//show pagination controls	        
        var paginationControlsContainer = document.getElementById('pagination-controls-container');
		if(result.length === itemsPerPage || currentPage !== 0){	
			paginationControlsContainer.style.display = "block";
		}else if(currentPage === 0){
            paginationControlsContainer.style.display = "none";
        }

		await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sec		

		if(document.getElementById('loading_container') != undefined) { document.getElementById('loading_container').remove(); }			
		document.getElementById('gridMovies').style.visibility = "visible";
        $("#gridMovies").animate({"opacity": 1}, 600);
		document.getElementById("content-main-app").style.overflowY = "auto";

		//init events
		var movieElements = document.querySelectorAll('#gridMovies .movie-card');
		if(movieElements != null && movieElements.length > 0){
			movieElements.forEach(movieElm => {
				movieElm.addEventListener("dblclick", function(e) {
					openMovieDetails(movieElm.dataset.movieid);
				}, false);
			});
		}
	});

	//Search menu
	var coll = document.getElementsByClassName("collapsible");
	var i;

	for (i = 0; i < coll.length; i++) {
		coll[i].addEventListener("click", function() {
			this.classList.toggle("active");
			var content = this.nextElementSibling;
			if (content.style.display === "inline-block") {
			content.style.display = "none";
			} else {
			content.style.display = "inline-block";
			}
		});
	}

	//BUTTONS
	$('#btnClearMovieFilters').on('click', function (event){
		
		$('#fltr-movie-title').val(''); //Title

		$('#fltr-movie-year').val(0); //Year

		$('#fltr-movie-isfav').prop("checked", false); //Is Favorite

		$('#fltr-movie-rating').val('0'); //Rating
	
		//Reset pagination
		currentPage = 0;
	});

	$('#btnSearchMovies').on('click', function (event){
		
		var mTitle = null, mYear = null, mIsFav = null, mRating = null;

		if($('#fltr-movie-title').val() != null && $('#fltr-movie-title').val() != '' && $('#fltr-movie-title').val() != ' ')
			mTitle = $('#fltr-movie-title').val();

		if($('#fltr-movie-year').val() != null && $('#fltr-movie-year').val() != '' && $('#fltr-movie-year').val() != ' ' && $('#fltr-movie-year').val() != '0')
			mYear = $('#fltr-movie-year').val();

		if($('#fltr-movie-isfav').prop("checked") != null && $('#fltr-movie-isfav').prop("checked"))
			mIsFav = $('#fltr-movie-isfav').prop("checked");

		if($('#fltr-movie-rating').val() != null && $('#fltr-movie-rating').val() != '' && $('#fltr-movie-rating').val() != '0')
			mRating = $('#fltr-movie-rating').val();

		currentPage = 0;
		ipc.send("getMovies", mTitle, mYear, mIsFav, mRating, currentPage);		
	});

	$('#btn_previous').on('click', function (event){
		
		if(currentPage === 0) return;

		var mTitle = null, mYear = null, mIsFav = null, mRating = null;

		if($('#fltr-movie-title').val() != null && $('#fltr-movie-title').val() != '' && $('#fltr-movie-title').val() != ' ')
			mTitle = $('#fltr-movie-title').val();

		if($('#fltr-movie-year').val() != null && $('#fltr-movie-year').val() != '' && $('#fltr-movie-year').val() != ' ' && $('#fltr-movie-year').val() != '0')
			mYear = $('#fltr-movie-year').val();

		if($('#fltr-movie-isfav').prop("checked") != null && $('#fltr-movie-isfav').prop("checked"))
			mIsFav = $('#fltr-movie-isfav').prop("checked");

		if($('#fltr-movie-rating').val() != null && $('#fltr-movie-rating').val() != '' && $('#fltr-movie-rating').val() != '0')
			mRating = $('#fltr-movie-rating').val();

		currentPage -= 1;
		ipc.send("getMovies", mTitle, mYear, mIsFav, mRating, currentPage);		
	});

	$('#btn_next').on('click', function (event){
		
		if(currentPage >= maxPage) return;

		var mTitle = null, mYear = null, mIsFav = null, mRating = null;

		if($('#fltr-movie-title').val() != null && $('#fltr-movie-title').val() != '' && $('#fltr-movie-title').val() != ' ')
			mTitle = $('#fltr-movie-title').val();

		if($('#fltr-movie-year').val() != null && $('#fltr-movie-year').val() != '' && $('#fltr-movie-year').val() != ' ' && $('#fltr-movie-year').val() != '0')
			mYear = $('#fltr-movie-year').val();

		if($('#fltr-movie-isfav').prop("checked") != null && $('#fltr-movie-isfav').prop("checked"))
			mIsFav = $('#fltr-movie-isfav').prop("checked");

		if($('#fltr-movie-rating').val() != null && $('#fltr-movie-rating').val() != '' && $('#fltr-movie-rating').val() != '0')
			mRating = $('#fltr-movie-rating').val();

		currentPage += 1;
		ipc.send("getMovies", mTitle, mYear, mIsFav, mRating, currentPage);		
	});
}

async function openMovieDetails(movieID){
	let currentWindow = require('@electron/remote').getCurrentWindow();
	const currentWindowPos = currentWindow.getPosition();

	// renderer process open new window
	popupWindow = new BrowserWindow(
		{ 
			fullscreen: false,
			frame: false,
			width: 1844,
			height: 898,
			x: currentWindowPos[0] + 40,
			y: currentWindowPos[1] + 125,
			autoHideMenuBar: true,
			transparent:true,
			webPreferences: {
				enableRemoteModule: true,  
				nativeWindowOpen: true,
				contextIsolation: false,
				nodeIntegrationInWorker: true,
				webSecurity: false,
				nodeIntegration: true
			},
			resizable: false,
			minimizable: false,
			maximizable: false,
			icon: './Content/Icons/action-movie.ico'
		}
	);	

	//@electron/remote for multiple windows
	//@electron/remote is disabled for this WebContents
	const remote = require('@electron/remote');
	remote.require("@electron/remote/main").enable(popupWindow.webContents);

	popupWindow.loadFile("./Views/Movies/movie-detail.html");

	popupWindow.webContents.once('dom-ready', () => {
		popupWindow.webContents.send('message-movie-id', movieID);			
	});	
	
	/*popupWindow.on('blur', () => {
		// Do your required stuff, when the window loose the focus
		popupWindow.close();
	});*/

	popupWindow.on('closed', () => {
        popupWindow = null; //to garbage collector
    });		
}

module.exports = { loadMovies }