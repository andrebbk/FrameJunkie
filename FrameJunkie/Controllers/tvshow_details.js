const electron = require("electron");
const ipc = electron.ipcRenderer;
const { pathToFileURL } = require('node:url');
const { nanoid } = require("nanoid");
const fs = require('fs').promises;
const path = require('path'); 
const logger = require('@electron/remote').require('./logger');
const { pathEqual } = require('path-equal');

//Toast Notifications
const toast = document.querySelector("#tvshow_detail_container .toastt"), 
    closeIcon = document.querySelector("#tvshow_detail_container .close-toastt"), 
    progress = document.querySelector("#tvshow_detail_container .progress-toastt");

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

let loadedTvShowId = 0;
let loadedTvShowNrViews = 0;
let hasNewTvShowCover = false, newTvShowCover = "";
let isToEdit = false;

ipc.on('message-tvshow-id', (event, tvshowId) => {
    loadedTvShowId = tvshowId;

    setTimeout(async () => {         
        await loadTvShowDetails();

        //Show data container
        if(document.querySelector('#tvshow-details-container #tvshowdetails_partial #loading_container') != undefined)
            document.querySelector('#tvshow-details-container #tvshowdetails_partial #loading_container').remove();

        document.querySelector('#tvshow-details-container #tvshowdetails_partial #md-container').style.visibility = "visible";    
        $("#tvshow-details-container #tvshowdetails_partial #md-container").animate({"opacity": 1}, 600);

        $("#tvshow-details-container .details-buttons-container").animate({"opacity": 1}, 600);
    }, 1000);       
});

ipc.on('result-edited-tvshow', (event, tvshowId) => {
    loadedTvShowId = tvshowId;
    isToEdit = false;

    setTimeout(async () => {         
        await loadTvShowDetails();

        //Show data container
        if(document.querySelector('#tvshow-details-container #tvshowdetails_partial #loading_container') != undefined)
            document.querySelector('#tvshow-details-container #tvshowdetails_partial #loading_container').remove();

        document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.visibility = "collapse";   
        document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.height = 0;   
        document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.opacity = 0; 

        document.querySelector('#tvshow-details-container #tvshowdetails_partial #md-container').style.visibility = "visible";    
        $("#tvshow-details-container #tvshowdetails_partial #md-container").animate({"opacity": 1}, 600);

        showEditButtons(isToEdit);
        $("#tvshow-details-container .details-buttons-container").animate({"opacity": 1}, 600);

        await setTimeout(500);
        showToastMessage("Frame Junkie", "Tv Show successfully edited!");         
    }, 1000);       
});

ipc.on('result-update-tvshow-nrviews', (event, updateThisTvShowId) => {    
    loadedTvShowId = updateThisTvShowId;

    setTimeout(async () => {         
        await loadTvShowDetails();

        //Show data container
        if(document.querySelector('#tvshow-details-container #tvshowdetails_partial #loading_container') != undefined)
        { document.querySelector('#tvshow-details-container #tvshowdetails_partial #loading_container').remove(); }

        document.querySelector('#tvshow-details-container #tvshowdetails_partial #md-container').style.visibility = "visible";    
        $("#tvshow-details-container #tvshowdetails_partial #md-container").animate({"opacity": 1}, 600);

        $("#tvshow-details-container .details-buttons-container").animate({"opacity": 1}, 600);

        await setTimeout(500);
        showToastMessage("Frame Junkie", "Tv Show view added!");      
    }, 1000);       
});

ipc.on('delete-tvshow', async (event) => {    
    //delete db tv show
    await deleteTvShow();

    //reload tv show list
    await ipc.send('reload-tvshows-menu', loadedTvShowId);

    //close current tv show detail window
    let popupWindow = require('@electron/remote').getCurrentWindow();
    popupWindow.close();
});

async function loadTvShowDetails(){
    let tvShowDB = knex('TvShows')
    .where('TvShowId', loadedTvShowId)
    .select('*')
    .first();

    tvShowDB.then(function (tvShowData){          
        if(tvShowData != null && tvShowData.TvShowId > 0){
            $('#tvshow-details-title', '#tvshow_detail_container').text(tvShowData.TvShowTitle);
            $('#tvshow-details-year', '#tvshow_detail_container').text(tvShowData.TvShowYear);

            let tvShowSeasonsText = tvShowData.TvShowSeasons + (tvShowData.TvShowSeasons === 1 ? " SEASON" : " SEASONS");
            $('#tvshow-details-seasons', '#tvshow_detail_container').text(tvShowSeasonsText);

            let tvShowEpisodesText = tvShowData.TvShowEpisodes + (tvShowData.TvShowEpisodes === 1 ? " EPISODE" : " EPISODES");
            $('#tvshow-details-episodes', '#tvshow_detail_container').text(tvShowEpisodesText);

            loadedTvShowNrViews = tvShowData.NrViews;
            let tvShowViewsText = tvShowData.NrViews + (tvShowData.NrViews === 1 ? " VIEW" : " VIEWS");
            $('#tvshow-details-views', '#tvshow_detail_container').text(tvShowViewsText);            

            if(tvShowData.IsFavorite)
                document.querySelector('#tvshow_detail_container #tvshow-details-fav').style.visibility = "visible";
            else
                document.querySelector('#tvshow_detail_container #tvshow-details-fav').style.visibility = "hidden";

            let starElements = document.querySelectorAll('#md-container input[type=radio].star');
            if(starElements != null && starElements.length > 0){
                $.each(starElements, function(idx, value){
                    value.checked = false;

                    if(value.dataset.starvalue == tvShowData.TvShowRating) value.checked = true;
                });
            }

            if(tvShowData.Observations != null && tvShowData.Observations != "" && tvShowData.Observations != " " && tvShowData.Observations.length > 1){
                $('#tvshow-details-observations', '#tvshow_detail_container').text(tvShowData.Observations);
            }else{
                $('#tvshow-details-observations', '#tvshow_detail_container').text("No observations added for this tv show");                
            }

            let tvShowCoverDB = knex('TvShowCovers')
            .where('TvShowId', loadedTvShowId)
            .where('Deleted', 0)
            .select('*')
            .first();
            
            tvShowCoverDB.then(function (tvShowCoverData){      
                if(tvShowCoverData != null && tvShowCoverData.TvShowId > 0){
                    var tvShowCoverElm = document.querySelector('#tvshow_detail_container #tvshow-cover-details');
                    if(tvShowCoverElm != null){
                        tvShowCoverElm.src = pathToFileURL(tvShowCoverData.CoverPath);
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

$('#btn_exit_tvshow_details').off('click').on('click', function(event){   
    let popupWindow = require('@electron/remote').getCurrentWindow();
    popupWindow.close();
});


//ADD TV SHOW VIEW
$('#btnAddTvShowView', '#tvshow_detail_container').off('click').on('click', function(event){       
    addNewTvShowView();
});

function addNewTvShowView(){
    let output = true;

    try
    {
        ipc.send('update-tvshow-nrviews', loadedTvShowId, loadedTvShowNrViews);
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
        
    $("#tvshowdetails_partial", "#tvshow-details-container").prepend($(loadingHTML).fadeIn('slow'));
}


//EDIT TVSHOW
$('#btnEditTvShow', '#tvshow_detail_container').off('click').on('click', async function(event){

    if(isToEdit){
        var validationResult = validateTvShowToEdit();
        if(validationResult.IsValid){

            //TvShow data to edit
            let tvShowDataToEdit = {
                tvShowId: loadedTvShowId,
                tvShowTitle: $('#tvshow-edit-title', '#me-container').val(),
                tvShowYear: $('#tvshow-edit-year', '#me-container').val(),
                tvShowSeasons: $('#tvshow-edit-seasons', '#me-container').val(),
                tvShowEpisodes: $('#tvshow-edit-episodes', '#me-container').val(),
                isFavTvShow: $('#switch_IsFav').prop("checked"),
                isCompleteTvShow: $('#switch_IsComplete').prop("checked"),
                tvShowRating: 0,
                tvShowNrViews: $('#tvshow-edit-views', '#me-container').val(),
                tvShowObservations: $('#tvshow-edit-observations', '#me-container').val(),
                updateCover: false,
                tvShowCover: ""
            };

            //TvShow rating data
            document.querySelectorAll("#me-container input[type=radio].star").forEach((elemStar) => {
                if(elemStar.checked){
                    tvShowDataToEdit.tvShowRating = elemStar.getAttribute('data-starvalue');
                    return;
                }
            });

            //TvShow cover changed?
            if(hasNewTvShowCover && newTvShowCover != undefined && newTvShowCover != ""){
                tvShowDataToEdit.updateCover = true;
                tvShowDataToEdit.tvShowCover = newTvShowCover;
            }

            await validateDBAndSaveTvShow(tvShowDataToEdit); 
        }
        else{
            showToastMessage("Frame Junkie", validationResult.ErrorMessage);
        } 
    } 
    else{

        //LOAD TVSHOW TO EDIT        
        $("#tvshow-details-container .details-buttons-container").animate({"opacity": 0 }, 0);
        document.querySelector('#tvshow-details-container #tvshowdetails_partial #md-container').style.visibility = "collapse";    
        document.querySelector('#tvshow-details-container #tvshowdetails_partial #md-container').style.height = 0;    
        $("#tvshow-details-container #tvshowdetails_partial #md-container").animate({"opacity": 0 }, 0);
    
        //Show loading
        addAndShowLoading();
    
        loadEditTvShow();
        
        setTimeout(async () => {
            await loadTvShowToEdit();
            //Show data container
            document.querySelector('#tvshow-details-container #tvshowdetails_partial #loading_container').remove();
    
            document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.visibility = "visible";   
            document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.height = 530;   
            $("#tvshow-details-container #tvshowdetails_partial #me-container").animate({"opacity": 1 }, 600);
    
            $('#tvshow-edit-title', '#me-container').trigger('focus');
    
            showEditButtons(true);
            isToEdit = true;
            hasNewTvShowCover = true;
        }, 500);
    }    
});

function loadEditTvShow() {   

    //Load Filters
	$('#tvshow-edit-year', '#me-container').html('');

	var crrYear = new Date().getFullYear();	
	for (let y = Number(crrYear); y > 1979; y--) {
		var optionHtml = '<option value="' + y + '">' + y + '</option>';
		$('#tvshow-edit-year', '#me-container').append(optionHtml);
	}

	$('#tvshow-edit-year').val(Number(crrYear)); //init Tv Show Year     

    //BUTTONS SECTION
    $('#btnSelectCover', '.details-buttons-container').off('click').on('click', function(){
        $('#tvshow-cover-upload', '#me-container').trigger("click"); //.click() call is deprecated
    });  

    $('#tvshow-cover-upload', '#me-container').on('change', function(event){
        var reader = new FileReader();
        reader.onload = function(){
            if(event.target.files[0] != null && event.target.files[0] != undefined){
                var output = document.getElementById('tvshow-cover-output');
                //output.style.backgroundImage = "Url('" + pathToFileURL(event.target.files[0].path) + "')";

                output.src = pathToFileURL(event.target.files[0].path);

                //show refresh button
                var btnRefresh = document.getElementById('btnRefreshTvShowCover');
                if(!document.getElementById('btnRefreshTvShowCover').classList.contains("change"))
                { document.querySelector('.refresh-tvshow-cover').classList.toggle('change'); }      
                
                hasNewTvShowCover = true;
                newTvShowCover = event.target.files[0].path;
            }          
        };

        if(event.target.files[0] != null && event.target.files[0] != undefined)
            reader.readAsDataURL(event.target.files[0]);
    });    

    $('#btnRefreshTvShowCover', '#me-container').on('click', function(){
        var output = document.getElementById('tvshow-cover-output');
        output.src = pathToFileURL("./Content/Images/No-Image-Placeholder.png");

        document.querySelector('.refresh-tvshow-cover').classList.toggle('change');

        hasNewTvShowCover = false;
        newTvShowCover = "";
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
	$('#tvshow-edit-views').numberstyle();
	$('#tvshow-edit-seasons').numberstyle();
    $('#tvshow-edit-episodes').numberstyle();

    //add star events
    const stars = document.querySelectorAll('#me-container .star');
    stars.forEach(el => el.addEventListener('click', event => {
        var btnRefresh = document.getElementById('btnRefreshTvShowRating');
                
        if(!document.getElementById('btnRefreshTvShowRating').classList.contains("change"))
        { document.querySelector('#me-container .refresh-tvshow-rating').classList.toggle('change'); }      
    }));

    //Edit a tvshow means rating and cover fields have always a content value
    if(!document.getElementById('btnRefreshTvShowCover').classList.contains("change"))
    { document.querySelector('.refresh-tvshow-cover').classList.toggle('change'); }      
                
    if(!document.getElementById('btnRefreshTvShowRating').classList.contains("change"))
    { document.querySelector('#me-container .refresh-tvshow-rating').classList.toggle('change'); } 

    $('#btnRefreshTvShowRating', '#me-container').on('click', function(){
        var starElements = document.getElementsByClassName("star");
        if(starElements != null && starElements.length > 0){

            $.each(starElements, function(idx, value){
                value.checked = false;
            });
        }

        document.querySelector('#me-container .refresh-tvshow-rating').classList.toggle('change');
    });     
}

async function loadTvShowToEdit(){
    let tvShowToEditDB = knex('TvShows')
    .where('TvShowId', loadedTvShowId)
    .select('*')
    .first();

    tvShowToEditDB.then(function (tvShowData){          
        if(tvShowData != null && tvShowData.TvShowId > 0){

            //TvShow Data
            $('#tvshow-edit-title', '#me-container').val(tvShowData.TvShowTitle);
            $('#tvshow-edit-year', '#me-container').val(Number(tvShowData.TvShowYear));
            $('#tvshow-edit-seasons', '#me-container').val(tvShowData.TvShowSeasons);
            $('#tvshow-edit-episodes', '#me-container').val(tvShowData.TvShowEpisodes);
            $('#tvshow-edit-views', '#me-container').val(tvShowData.NrViews);
            $('#tvshow-edit-observations', '#me-container').text(tvShowData.Observations);
            
            //Is Favorite
            $('#switch_IsFav').prop("checked", tvShowData.IsFavorite);

            //Is Complete
            $('#switch_IsComplete').prop("checked", tvShowData.IsFinished);

            //TvShow Rating
            let starElements = document.querySelectorAll('#me-container input[type=radio].star');
            if(starElements != null && starElements.length > 0){
                $.each(starElements, function(idx, value){
                    value.checked = false;
                    if(value.dataset.starvalue == tvShowData.TvShowRating) value.checked = true;
                });
            }

            //TvShow Cover
            let tvShowCoverDB = knex('TvShowCovers')
            .where('TvShowId', loadedTvShowId)
            .where('Deleted', 0)
            .select('*')
            .first();
            
            tvShowCoverDB.then(function (tvShowCoverData){      
                if(tvShowCoverData != null && tvShowCoverData.TvShowId > 0){
                    var tvShowCoverElm = document.querySelector('#me-container #tvshow-cover-output');
                    if(tvShowCoverElm != null){
                        tvShowCoverElm.src = pathToFileURL(tvShowCoverData.CoverPath);
                    }
                }
            });
        }
    });
}

function validateTvShowToEdit(){
    let resultOuput = { IsValid: true, ErrorMessage: "" };
    var crrYear = new Date().getFullYear();

    //TvShow Title
    if($('#tvshow-edit-title', '#me-container').val() == null || $('#tvshow-edit-title', '#me-container').val() == '' || $('#tvshow-edit-title', '#me-container').val() == ' '){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv Show title is empty!";
    }

    //TvShow Year
    else if($('#tvshow-edit-year', '#me-container').val() == null || ($('#tvshow-edit-year', '#me-container').val() != null && ($('#tvshow-edit-year', '#me-container').val() > Number(crrYear) || $('#tvshow-edit-year', '#me-container').val() < 1980))){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv Show year is not valid!";
    }

    //TvShow Seasons
    else if($('#tvshow-edit-seasons').val() == null || $('#tvshow-edit-seasons').val() == '' || $('#tvshow-edit-seasons').val() == ' ' || $('#tvshow-edit-seasons').val() < 1){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv show seasons not set!";
    }

    //TvShow Episodes
    else if($('#tvshow-edit-episodes').val() == null || $('#tvshow-edit-episodes').val() == '' || $('#tvshow-edit-episodes').val() == ' ' || $('#tvshow-edit-episodes').val() < 1){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv show epidoses not set!";
    }

    //TvShow Cover
    else if(!hasNewTvShowCover)
    {
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv Show cover wasn't defined!";
    }

    //TvShow Views
    else if($('#tvshow-edit-views', '#me-container').val() == null || $('#tvshow-edit-views', '#me-container').val() == '' || $('#tvshow-edit-views', '#me-container').val() == ' ' || $('#tvshow-edit-views', '#me-container').val() == '0'){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv Show views are not valid!";
    }

    //TvShow Rating
    else {
        let hasRating = false;
        var starElements = document.querySelectorAll('#me-container input[type=radio].star');
        if(starElements != null && starElements.length > 0){
            $.each(starElements, function(idx, value){
                if(value.checked){
                    hasRating = true;
                    return;
                }
            });
        }

        if(!hasRating){
            resultOuput.IsValid = false;
            resultOuput.ErrorMessage = "Tv Show rating wasn't defined!";
        }
    }    

    return resultOuput;
}

async function validateDBAndSaveTvShow(tvShowDataToEdit) {
    let queryStrTile = '%' + tvShowDataToEdit.tvShowTitle + '%';

    let result = knex('TvShows')
    .whereNot('TvShowId', tvShowDataToEdit.tvShowId)
    .whereLike('TvShowTitle', queryStrTile)
    .where('TvShowYear', tvShowDataToEdit.tvShowYear)
    .select('TvShowId')
    .first();

    //Getting covers path
    let tvShowsCoversPath = await knex.select("Value").from("Configurations").where("Key", "TV_SHOWS_COVERS_PATH").where("Deleted", 0).first()
    .then(function(config){
        if(config != null && config != undefined)
            return config.Value;
        else {
            return "";
        }           
    });

    //Validation for the cover path config and for tv show in db
    if(tvShowsCoversPath != null && tvShowsCoversPath != ""){
        return await result.then(function (rows){          
            if(rows != null && rows.TvShowId > 0){            
                showToastMessage("Frame Junkie", "This tv show already exists!");
                return false;
            }                
            else{
                //LOAD TV SHOW TO EDIT        
                $("#tvshow-details-container .details-buttons-container").animate({"opacity": 0 }, 0);
                document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.visibility = "collapse";    
                document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.height = 0;    
                document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.opacity = 0;  
            
                //Show loading
                addAndShowLoading();

                ipc.send('edit-tvshow', tvShowsCoversPath, tvShowDataToEdit);
            }            
        });
    }
    else{
        showToastMessage("Frame Junkie", "Tv Shows covers path config doens't exist!");
        return false;        
    }
}


//BACK
$('#btnBack', '#tvshow_detail_container').off('click').on('click', function(event){
    $("#tvshow-details-container .details-buttons-container").animate({"opacity": 0 }, 0);
    document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.visibility = "collapse";    
    document.querySelector('#tvshow-details-container #tvshowdetails_partial #me-container').style.height = 0;    
    $("#tvshow-details-container #tvshowdetails_partial #me-container").animate({"opacity": 0 }, 0);

    //Show loading
    addAndShowLoading();

    setTimeout(async () => {         
        await loadTvShowDetails();

        //Show data container
        document.querySelector('#tvshow-details-container #tvshowdetails_partial #loading_container').remove();

        document.querySelector('#tvshow-details-container #tvshowdetails_partial #md-container').style.height = 530;  
        document.querySelector('#tvshow-details-container #tvshowdetails_partial #md-container').style.visibility = "visible";    
        $("#tvshow-details-container #tvshowdetails_partial #md-container").animate({"opacity": 1}, 600);

        showEditButtons(false);   
        isToEdit = false;
    }, 1000); 
});

function showEditButtons(showEditButtons){
    if(showEditButtons === true){
        document.querySelector("#tvshow-details-container #btnAddTvShowView").style.display = "none";  
        document.querySelector("#tvshow-details-container #btnBack").style.display = "";  
        document.querySelector("#tvshow-details-container #btnEditTvShow").style.display = "";  
        document.querySelector("#tvshow-details-container #btnDeleteTvShow").style.display = "none";  
        document.querySelector("#tvshow-details-container #btnSelectCover").style.display = "";  
    }
    else{
        document.querySelector("#tvshow-details-container #btnAddTvShowView").style.display = "";  
        document.querySelector("#tvshow-details-container #btnBack").style.display = "none";  
        document.querySelector("#tvshow-details-container #btnEditTvShow").style.display = "";  
        document.querySelector("#tvshow-details-container #btnDeleteTvShow").style.display = "";  
        document.querySelector("#tvshow-details-container #btnSelectCover").style.display = "none";  
    }

    $("#tvshow-details-container .details-buttons-container").animate({"opacity": 1 }, 200);
}


//DELETE
$('#btnDeleteTvShow', '#tvshow_detail_container').off('click').on('click', function(event){
    ipc.send('openConfirmDialog', 'Are you sure you would like to delete this tv show?', 'delete-tvshow');
});

async function deleteTvShow(){
    let output = true;

    try
    {
        //delete tv show
        let deletedTvShow = await knex('TvShows')
        .where({ TvShowId: loadedTvShowId})
        .update({ 
            Deleted: 1
        }, ['TvShowId', 'Deleted'])
        .then(function(resp) {                    
            output = true;
            return resp;
        }).catch(err => {
            logger.error(err);
            console.log(err);
        });

        if(deletedTvShow.length > 0) {

            //delete tv show cover            
            let deletedTvShowCover = await knex('TvShowCovers')
            .where({ TvShowId: loadedTvShowId})
            .update({ 
                Deleted: 1
            }, ['TvShowId', 'Deleted', 'CoverPath'])
            .then(function(resp) {                    
                output = true;
                return resp;
            }).catch(err => {
                logger.error(err);
                console.log(err);
            });       

            if(deletedTvShowCover.length > 0 && deletedTvShowCover[0].TvShowId > 0
                && deletedTvShowCover[0].CoverPath != undefined && deletedTvShowCover[0].CoverPath != "") {
                //remove tv show cover
                await fs.rm(deletedTvShowCover[0].CoverPath, {
                    force: true,
                });  
            }
        }
    }
    catch(error){
        logger.error(error);
        console.error(error);
        return false;
    }  

    return output;
}

