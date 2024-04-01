const electron = require("electron");
const ipc = electron.ipcRenderer;
const BrowserWindow = require('@electron/remote').BrowserWindow;
const { showToastMessage, closeToastMessage } = require('../../index.js'); 

//pagination
let currentPage = 0;
let maxPage = 1000;
let itemsPerPage = 50;

let popupWindow = null;

function loadTvShows(){
	ipc.removeAllListeners("getTvShows");
	ipc.removeAllListeners("resultSent_tvshows");
	ipc.removeAllListeners("reload-tvshows-list");

	//Load Filters
	$('#fltr-tvshow-year').html('');
	var optionHtml = '<option value="0">Select year</option>';
	$('#fltr-tvshow-year').append(optionHtml);

	var crrYear = new Date().getFullYear();	
	for (let y = Number(crrYear); y > 1979; y--) {
		var optionHtml = '<option value="' + y + '">' + y + '</option>';
		$('#fltr-tvshow-year').append(optionHtml);
	}

	$('#fltr-tvshow-year').val(0); //init Movie Year

	//Filters
	var isFavorites = $('#fltr-tvshow-isfav').is(':checked');

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
	
	//Get tvshows
	currentPage = 0;
	ipc.send("getTvShows", null, null, null, null, currentPage);
	ipc.on("resultSent_tvshows", async function (event, result) {

		//to top
		$("#content-main-app").animate({ scrollTop: 0 }, "fast");

		document.getElementById('pagination-controls-container').style.display = "none";
		document.getElementById('gridTvShows').style.visibility = "collapse";
		document.getElementById('gridTvShows').style.opacity = 0;

		//show loading
		var loadingHtml = '<div id="loading_container" class="loading-container">' +
    	'<img class="loading-img" src="./Content/Images/loading_animation.gif" width="60" height="60"></div>';

    	document.getElementById('tvshows_empty_container').innerHTML = loadingHtml;
		$('#gridTvShows').html('');
		
		document.getElementById("content-main-app").style.overflowY = "hidden";	

		await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec	

		for(var i = 0; i < result.length; i++){
			let tvshowElm = '<div class="tvshow-card" data-tvshowid="' + result[i].TvShowId + '">' +
			`<div class="tvshow-header" style="background: url('file://` + result[i].CoverPath.trim() + `'); background-size: cover;">` +
			'<div class="header-icon-container">' +
			'</div>' +
			'</div>' +
			'<div class="tvshow-content">' +
			'<div class="tvshow-content-header">';

			if(result[i].IsFavorite === 1)
                tvshowElm += '<a href="#"><h3 class="tvshow-title">' + result[i].TvShowTitle + '  &nbsp; &#9733;</h3></a>';
			else
                tvshowElm += '<a href="#"><h3 class="tvshow-title">' + result[i].TvShowTitle + '</h3></a>';

            tvshowElm += '<h3 class="tvshow-year">' + result[i].TvShowYear + '<span style="margin-left:200px;">' + result[i].TvShowRating + '/10</span></h3>' +
			'</div></div></div>';

			$('#gridTvShows').append($(tvshowElm));
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
		document.getElementById('gridTvShows').style.visibility = "visible";
        $("#gridTvShows").animate({"opacity": 1}, 600);
		document.getElementById("content-main-app").style.overflowY = "auto";

		//init events
		var tvShowElements = document.querySelectorAll('#gridTvShows .tvshow-card');
		if(tvShowElements != null && tvShowElements.length > 0){
			tvShowElements.forEach(tvShowElm => {
				tvShowElm.addEventListener("dblclick", function(e) {
					openTvShowDetails(tvShowElm.dataset.tvshowid);
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
	$('#btnClearTvShowsFilters').off('click').on('click', function (event){
		
		$('#fltr-tvshow-title').val(''); //Title

		$('#fltr-tvshow-year').val(0); //Year

		$('#fltr-tvshow-isfav').prop("checked", false); //Is Favorite

		$('#fltr-tvshow-rating').val('0'); //Rating
	
		$('#fltr-tvshow-iscomplete').prop("checked", false); //Is Complete

		//Reset pagination
		currentPage = 0;
	});

	$('#btnSearchTvShows').off('click').on('click', function (event){
		
		var tTitle = null, tYear = null, tIsFav = null, tRating = null, tIsComplete = null;

		if($('#fltr-tvshow-title').val() != null && $('#fltr-tvshow-title').val() != '' && $('#fltr-tvshow-title').val() != ' ')
			tTitle = $('#fltr-tvshow-title').val();

		if($('#fltr-tvshow-year').val() != null && $('#fltr-tvshow-year').val() != '' && $('#fltr-tvshow-year').val() != ' ' && $('#fltr-tvshow-year').val() != '0')
			tYear = $('#fltr-tvshow-year').val();

		if($('#fltr-tvshow-isfav').prop("checked") != null && $('#fltr-tvshow-isfav').prop("checked"))
			tIsFav = $('#fltr-tvshow-isfav').prop("checked");

		if($('#fltr-tvshow-rating').val() != null && $('#fltr-tvshow-rating').val() != '' && $('#fltr-tvshow-rating').val() != '0')
			tRating = $('#fltr-tvshow-rating').val();

		if($('#fltr-tvshow-iscomplete').prop("checked") != null && $('#fltr-tvshow-iscomplete').prop("checked"))
			tIsComplete = $('#fltr-tvshow-iscomplete').prop("checked");

		currentPage = 0;
		ipc.send("getTvShows", tTitle, tYear, tIsFav, tRating, tIsComplete, currentPage);		
	});

	$('#btn_previous').off('click').on('click', function (event){
		
		if(currentPage === 0) return;

		var tTitle = null, tYear = null, tIsFav = null, tRating = null, tIsComplete = null;

		if($('#fltr-tvshow-title').val() != null && $('#fltr-tvshow-title').val() != '' && $('#fltr-tvshow-title').val() != ' ')
			tTitle = $('#fltr-tvshow-title').val();

		if($('#fltr-tvshow-year').val() != null && $('#fltr-tvshow-year').val() != '' && $('#fltr-tvshow-year').val() != ' ' && $('#fltr-tvshow-year').val() != '0')
			tYear = $('#fltr-tvshow-year').val();

		if($('#fltr-tvshow-isfav').prop("checked") != null && $('#fltr-tvshow-isfav').prop("checked"))
			tIsFav = $('#fltr-tvshow-isfav').prop("checked");

		if($('#fltr-tvshow-rating').val() != null && $('#fltr-tvshow-rating').val() != '' && $('#fltr-tvshow-rating').val() != '0')
			tRating = $('#fltr-tvshow-rating').val();

		if($('#fltr-tvshow-iscomplete').prop("checked") != null && $('#fltr-tvshow-iscomplete').prop("checked"))
			tIsComplete = $('#fltr-tvshow-iscomplete').prop("checked");

		currentPage -= 1;
		ipc.send("getTvShows", tTitle, tYear, tIsFav, tRating, tIsComplete, currentPage);	
	});

	$('#btn_next').off('click').on('click', function (event){
		
		if(currentPage >= maxPage) return;

		var tTitle = null, tYear = null, tIsFav = null, tRating = null, tIsComplete = null;

		if($('#fltr-tvshow-title').val() != null && $('#fltr-tvshow-title').val() != '' && $('#fltr-tvshow-title').val() != ' ')
			tTitle = $('#fltr-tvshow-title').val();

		if($('#fltr-tvshow-year').val() != null && $('#fltr-tvshow-year').val() != '' && $('#fltr-tvshow-year').val() != ' ' && $('#fltr-tvshow-year').val() != '0')
			tYear = $('#fltr-tvshow-year').val();

		if($('#fltr-tvshow-isfav').prop("checked") != null && $('#fltr-tvshow-isfav').prop("checked"))
			tIsFav = $('#fltr-tvshow-isfav').prop("checked");

		if($('#fltr-tvshow-rating').val() != null && $('#fltr-tvshow-rating').val() != '' && $('#fltr-tvshow-rating').val() != '0')
			tRating = $('#fltr-tvshow-rating').val();

		if($('#fltr-tvshow-iscomplete').prop("checked") != null && $('#fltr-tvshow-iscomplete').prop("checked"))
			tIsComplete = $('#fltr-tvshow-iscomplete').prop("checked");

		currentPage += 1;
		ipc.send("getTvShows", tTitle, tYear, tIsFav, tRating, tIsComplete, currentPage);		
	});

	//Reload tvshows list after delete one
	ipc.on("reload-tvshows-list", function (event, deletedTvShow) {	
		let tTitle = null, tYear = null, tIsFav = null, tRating = null, tIsComplete = null;

		if($('#fltr-tvshow-title').val() != null && $('#fltr-tvshow-title').val() != '' && $('#fltr-tvshow-title').val() != ' ')
			tTitle = $('#fltr-tvshow-title').val();

		if($('#fltr-tvshow-year').val() != null && $('#fltr-tvshow-year').val() != '' && $('#fltr-tvshow-year').val() != ' ' && $('#fltr-tvshow-year').val() != '0')
			tYear = $('#fltr-tvshow-year').val();

		if($('#fltr-tvshow-isfav').prop("checked") != null && $('#fltr-tvshow-isfav').prop("checked"))
			tIsFav = $('#fltr-tvshow-isfav').prop("checked");

		if($('#fltr-tvshow-rating').val() != null && $('#fltr-tvshow-rating').val() != '' && $('#fltr-tvshow-rating').val() != '0')
			tRating = $('#fltr-tvshow-rating').val();

		if($('#fltr-tvshow-iscomplete').prop("checked") != null && $('#fltr-tvshow-iscomplete').prop("checked"))
			tIsComplete = $('#fltr-tvshow-iscomplete').prop("checked");

		//RELOAD
		ipc.send("getTvShows", tTitle, tYear, tIsFav, tRating, tIsComplete, currentPage);		

		if(deletedTvShow != undefined && deletedTvShow != null && deletedTvShow != ""){
			setTimeout(() => { showToastMessage('Frame Junkie', deletedTvShow + ' deleted successfully!'); }, 400);
		}		
	});
}

async function openTvShowDetails(tvshowID){
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
			icon: __dirname + '../../../Content/Icons/action-movie.ico'
		}
	);	

	//@electron/remote for multiple windows
	//@electron/remote is disabled for this WebContents
	const remote = require('@electron/remote');
	remote.require("@electron/remote/main").enable(popupWindow.webContents);

    popupWindow.loadFile(`${__dirname}../../../Views/TvShows/tvshow-detail.html`);

	popupWindow.webContents.once('dom-ready', () => {
		popupWindow.webContents.send('message-tvshow-id', tvshowID);			
	});	
	
	//when window looses focus, close
	/*popupWindow.on('blur', () => {
		// Do your required stuff, when the window loose the focus
		popupWindow.close();
	});*/

	popupWindow.on('closed', () => {
        popupWindow = null; //to garbage collector
    });		
}

module.exports = { loadTvShows }