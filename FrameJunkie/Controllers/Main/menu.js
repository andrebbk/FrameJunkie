const electron = require("electron");
const ipc = electron.ipcRenderer;
const fs = require('fs')
const path = require('path');

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
fs.readFile(path.join(__dirname, '../../Views/Movies/movies.html'), (err, data) => {
	document.getElementById('content-main-app').innerHTML = data;
	loadMovies();
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
    $('#content-main-app').load(' ');
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
    $('#navcheck').click();
}

//HOME
function loadDashBoardData(){
	//STATS
	ipc.send("getStats");
	ipc.on("resultSent_stats", function (event, result) {
		let h_m_total = document.getElementById("h_m_total");
		h_m_total.innerHTML = result[0].TotalMovies;

		let h_m_total_views = document.getElementById("h_m_total_views");
		h_m_total_views.innerHTML = result[0].Movies_TotalViews;

		let h_tv_total = document.getElementById("h_tv_total");
		h_tv_total.innerHTML = result[0].TotalTvShows;

		let h_tv_total_views = document.getElementById("h_tv_total_views");
		h_tv_total_views.innerHTML = result[0].TvShows_TotalViews;		
	});	

    let moviesViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tvshowsViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    let monthsHTML = '<li>Janeiro</li>' +
    '<li>Fevereiro</li>' +		
    '<li>Março</li>' +		
    '<li>Abril</li>' +		
    '<li>Maio</li>' +		
    '<li>Junho</li>' +		
    '<li>Julho</li>' +		
    '<li>Agosto</li>' +		
    '<li>Setembro</li>' +		
    '<li>Outubro</li>' +		
    '<li>Novembro</li>' +		
    '<li>Dezembro</li>';

	//MOVIES Views
	ipc.send("getMoviesViewsCount");
	ipc.on("resultSent_mvc", function (event, result) {
		for(var i = 0; i < result.length; i++){
			moviesViews[result[i].month - 1] = result[i].monthNumber;
		}

		var ul_m = document.getElementById("movies_month_views");
        ul_m.innerHTML = monthsHTML;
		for(var i = 0; i < moviesViews.length; i++){
			let newLi = document.createElement("li");
			newLi.appendChild(document.createTextNode(moviesViews[i].toString()));
			ul_m.appendChild(newLi);
		}
	});	

	//TVSHOWS - CHART
	ipc.send("getTvShowsViewsCount");
	ipc.on("resultSent_tsvc", function (event, result) {
		for(var i = 0; i < result.length; i++){
			tvshowsViews[result[i].month - 1] = result[i].monthNumber;
		}

		var ul_tv = document.getElementById("tvshows_month_views");
        ul_tv.innerHTML = monthsHTML;
		for(var i = 0; i < tvshowsViews.length; i++){
			let newLi = document.createElement("li");
			newLi.appendChild(document.createTextNode(tvshowsViews[i].toString()));
			ul_tv.appendChild(newLi);
		}
	});	
}

//MOVIES
function loadMovies(){

	//Load Filters
	var crrYear = new Date().getFullYear();
	$('#fltr-movie-year').html('');
	for (let y = Number(crrYear); y > 1979; y--) {
		var optionHtml = '<option value="' + y + '">' + y + '</option>';
		$('#fltr-movie-year').append(optionHtml);
	}

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
	ipc.send("getMovies");
	ipc.on("resultSent_movies", function (event, result) {
		for(var i = 0; i < result.length; i++){
			let movieElm = '<div class="movie-card">' +
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
	});

	//Search menu
	var coll = document.getElementsByClassName("collapsible");
	var i;

	for (i = 0; i < coll.length; i++) {
		coll[i].addEventListener("click", function() {
			this.classList.toggle("active");
			var content = this.nextElementSibling;
			if (content.style.display === "block") {
			content.style.display = "none";
			} else {
			content.style.display = "block";
			}
		});
	}

	//BUTTONS
	$('#btnClearMovieFilters').on('click', function (event){
		
		$('#fltr-movie-title').val(''); //Title

		var crrYear = new Date().getFullYear();
		$('#fltr-movie-year').val(crrYear); //Year

		$('#fltr-movie-isfav').prop("checked", false); //Is Favorite

		$('#fltr-movie-rating').val('0'); //Rating
	});

	$('#btnSearchMovies').on('click', function (event){
		
		var mTitle = null, mYear = null, mIsFav = null, mRating = null;

		if($('#fltr-movie-title').val() != null && $('#fltr-movie-title').val() != '' && $('#fltr-movie-title').val() != ' ')
			mTitle = $('#fltr-movie-title').val();

		if($('#fltr-movie-year').val() != null && $('#fltr-movie-year').val() != '' && $('#fltr-movie-year').val() != ' ')
			mYear = $('#fltr-movie-year').val();

		if($('#fltr-movie-isfav').val() != null && $('#fltr-movie-isfav').val() !== false)
			mIsFav = $('#fltr-movie-isfav').val();

		if($('#fltr-movie-rating').val() != null && $('#fltr-movie-rating').val() != '' && $('#fltr-movie-rating').val() != '0')
			mRating = $('#fltr-movie-rating').val();

		ipc.send("getMovies", mTitle, mYear, mIsFav, mRating);
		ipc.on("resultSent_movies", function (event, result) {
			$('#gridMovies').html('');

			for(var i = 0; i < result.length; i++){
				let movieElm = '<div class="movie-card">' +
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
		});
	});
}