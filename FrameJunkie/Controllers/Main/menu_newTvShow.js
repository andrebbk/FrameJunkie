const { pathToFileURL } = require('node:url');
const { showToastMessage, closeToastMessage } = require('../../index.js'); 
const { nanoid } = require("nanoid");
const fs = require('fs').promises;

const logger = require('@electron/remote').require('./logger');

let knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./Northwind.sl3"
    },
    useNullAsDefault: true
});

let hasNewTvShowCover = false, newTvShowCover = "";

//INIT
function loadNewTvShow() {   
    //Load Filters
	$('#tvshow-year').html('');

	var crrYear = new Date().getFullYear();	
	for (let y = Number(crrYear); y > 1979; y--) {
		var optionHtml = '<option value="' + y + '">' + y + '</option>';
		$('#tvshow-year').append(optionHtml);
	}

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
	$('#tvshow-seasons').numberstyle();
    $('#tvshow-episodes').numberstyle();

	$('#tvshow-year').val(Number(crrYear)); //init TvShow Year

    //BUTTONS SECTION
    $('#btnSelectCover').on('click', function(){
        $('#tvshow-cover-upload').trigger("click"); //.click() call is deprecated
    });    

    $('#tvshow-cover-upload').on('change', function(event){
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

    $('#btnRefreshTvShowCover').on('click', function(){
        var output = document.getElementById('tvshow-cover-output');
        output.src = pathToFileURL(`${__dirname}../../../Content/Images/No-Image-Placeholder.png`);

        document.querySelector('.refresh-tvshow-cover').classList.toggle('change');

        hasNewTvShowCover = false;
        newTvShowCover = "";
    });    

    //add star events
    const stars = document.querySelectorAll('.star');
    stars.forEach(el => el.addEventListener('click', event => {
        var btnRefresh = document.getElementById('btnRefreshTvShowRating');
                
        if(!document.getElementById('btnRefreshTvShowRating').classList.contains("change"))
        { document.querySelector('.refresh-tvshow-rating').classList.toggle('change'); }      
    }));

    $('#btnRefreshTvShowRating').on('click', function(){
        var starElements = document.getElementsByClassName("star");
        if(starElements != null && starElements.length > 0){

            $.each(starElements, function(idx, value){
                value.checked = false;
            });
        }

        document.querySelector('.refresh-tvshow-rating').classList.toggle('change');
    });  

    $('#btnClearNewTvShow').on('click', function(){
        clearNewTvShowForm();
        showToastMessage("Frame Junkie", "New tv show form cleared with success!");
    });

    $('#btnSaveNewTvShow').on('click', function(){
        //validate form data
        var validationResult = validateNewTvShow();
        if(validationResult.IsValid){
            
            //new tvshow data
            let tvShowTitle = $('#tvshow-title').val(),
            tvShowYear = $('#tvshow-year').val(),
            isFavTvShow = $('#tvshow-isfav').prop("checked"),
            tvShowSeasons = $('#tvshow-seasons').val(),
            tvShowEpisodes = $('#tvshow-episodes').val(),
            isComplete = $('#tvshow-iscomplete').prop("checked"),
            tvShowRating = 0,
            tvShowObservations = $('#tvshow-observations-id').val(),
            tvShowCover = newTvShowCover;

            //tvshow rating data
            document.querySelectorAll(".star").forEach((ele) => {
                if(ele.checked){
                    tvShowRating = ele.getAttribute('data-starvalue');
                    return;
                }
            });

            validateAndSaveTvShow(tvShowTitle, tvShowYear, isFavTvShow, tvShowSeasons, tvShowEpisodes, isComplete, tvShowRating, tvShowObservations, tvShowCover);            
        }else{
            showToastMessage("Frame Junkie", validationResult.ErrorMessage);
        }
        
    });
}

//FUNCTIONS
function clearNewTvShowForm(){
    //TvShow Title
    $('#tvshow-title').val('');

    //TvShow Year
    var crrYear = new Date().getFullYear();	
    $('#tvshow-year').val(Number(crrYear)); 

    //Is Favorite
    $('#tvshow-isfav').prop("checked", false);

    //Seasons
    $('#tvshow-seasons').val(0);

    //Episodes
    $('#tvshow-episodes').val(0);

    //Is Complete
    $('#tvshow-iscomplete').prop("checked", false);

    //TvShow Rating
    var starElements = document.getElementsByClassName("star");
    if(starElements != null && starElements.length > 0){

        $.each(starElements, function(idx, value){
            value.checked = false;
        });
    }

    if(document.getElementById('btnRefreshTvShowRating').classList.contains("change"))
    { document.querySelector('.refresh-tvshow-rating').classList.toggle('change'); } 

    //TvShow Observations
    $('#tvshow-observations-id').val('');

    //TvShow Cover
    $('#tvshow-cover-upload').val('');
    var output = document.getElementById('tvshow-cover-output');
    output.src = pathToFileURL(`${__dirname}../../../Content/Images/No-Image-Placeholder.png`);

    if(document.getElementById('btnRefreshTvShowCover').classList.contains("change"))
    { document.querySelector('.refresh-tvshow-cover').classList.toggle('change'); }    
}

function validateNewTvShow(){
    let resultOuput = { IsValid: true, ErrorMessage: "" };
    var crrYear = new Date().getFullYear();

    //TvShow Title
    if($('#tvshow-title').val() == null || $('#tvshow-title').val() == '' || $('#tvshow-title').val() == ' '){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv show title is empty!";
    }

    //TvShow Year
    else if($('#tvshow-year').val() == null || ($('#tvshow-year').val() != null && ($('#tvshow-year').val() > Number(crrYear) || $('#tvshow-year').val() < 1980))){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv show year is not valid!";
    }

    //TvShow Seasons
    else if($('#tvshow-seasons').val() == null || $('#tvshow-seasons').val() == '' || $('#tvshow-seasons').val() == ' ' || $('#tvshow-seasons').val() < 1){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv show seasons not set!";
    }

    //TvShow Episodes
    else if($('#tvshow-episodes').val() == null || $('#tvshow-episodes').val() == '' || $('#tvshow-episodes').val() == ' ' || $('#tvshow-episodes').val() < 1){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv show epidoses not set!";
    }

    //TvShow Cover
    else if(!hasNewTvShowCover)
    {
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Tv Show cover wasn't defined!";
    }

    //TvShow Rating
    else {
        let hasRating = false;
        var starElements = document.getElementsByClassName("star");
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

async function validateAndSaveTvShow(tvShowTitle, tvShowYear, isFavTvShow, tvShowSeasons, tvShowEpisodes, isComplete, tvShowRating, tvShowObservations, tvShowCover) {
    let queryStrTile = '%' + tvShowTitle + '%';

    let result = knex('TvShows')
    .whereLike('TvShowTitle', queryStrTile)
    .where('TvShowYear', tvShowYear)
    .where('Deleted', 0)
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

    if(tvShowsCoversPath != null && tvShowsCoversPath != ""){
        result.then(function (rows){          
            if(rows != null && rows.TvShowId > 0)
                showToastMessage("Frame Junkie", "This tv show already exists!");
            else{
                //Save new tv show
                saveTvShow(tvShowsCoversPath, tvShowTitle, tvShowYear, isFavTvShow, tvShowSeasons, tvShowEpisodes, isComplete, tvShowRating, tvShowObservations, tvShowCover);
                
            }            
        });
    }
    else{
        showToastMessage("Frame Junkie", "Tv shows covers path config doens't exist!");
    }
}

async function saveTvShow(tvShowsCoversPath, tvShowTitle, tvShowYear, isFavTvShow, tvShowSeasons, tvShowEpisodes, isComplete, tvShowRating, tvShowObservations, tvShowCover) {
    
    let tvShowData = { 
        TvShowTitle: tvShowTitle, 
        TvShowYear: tvShowYear,
        TvShowSeasons: tvShowSeasons,
        TvShowEpisodes: tvShowEpisodes,
        NrViews: 1, 
        IsFavorite: isFavTvShow, 
        TvShowRating: tvShowRating, 
        IsFinished: isComplete,
        Observations: tvShowObservations,
        CreateDate: new Date().toISOString(),
        Deleted: 0
    };

    //insert new tvshow and keep db id
    const [idNewTvShow] = await knex('TvShows').insert(tvShowData)
    .catch(function(error) {
        logger.error(error);
        console.error(error);
    });

    if(idNewTvShow != null && idNewTvShow > 0){        
        var tvShowViewData = {
            tvShowId: idNewTvShow,
            CreateDate: new Date().toISOString()
        };

        //insert new tvshow view
        await knex('TvShowView').insert(tvShowViewData)
        .catch(function(error) {
            logger.error(error);
            console.error(error);
        });

        //save new tvshow cover
        let newCover = saveTvShowCover(tvShowsCoversPath, tvShowTitle, tvShowCover);
        if(newCover != null){
            var tvshowCoverData = {
                TvShowId: idNewTvShow,
                CoverName: newCover.newCoverName,
                CoverPath: newCover.newPath,
                CreateDate: new Date().toISOString(),
                Deleted: 0
            };

            //insert new tvshow cover
            await knex('TvShowCovers').insert(tvshowCoverData)
            .catch(function(error) {
                logger.error(error);
                console.error(error);
            });
        }

        //clear form
        clearNewTvShowForm();       
    }  

    showToastMessage("Frame Junkie", "New tv show saved!");
}

let saveTvShowCover = (tvShowsCoversPath, tvShowTitle, newTvShowCover) => {

    if(tvShowsCoversPath == null || tvShowTitle == null || tvShowTitle == '' || tvShowTitle == ' ' || newTvShowCover == null)
        return null;

    //get new tv show cover file extension
    let coverExtension = "";
    let fileName = newTvShowCover.split('/');
    if(fileName != null && fileName.length > 0){    
        let fileExtension = fileName[fileName.length - 1].split('.');
        if(fileExtension != null && fileExtension.length > 0){
            coverExtension = fileExtension[fileExtension.length - 1];
        }
    }

    //remove spaces and special chars from tvshow title
    //generate small guid with nanoid package
    //create new tvshow cover name with file extension
    let newCoverName = tvShowTitle.replace(/[^A-Z0-9]+/ig, "") + '_' + nanoid(7) + '.' + coverExtension;
   
    //TODO: Get config path for covers folder
    //let path = "C:\\Users\\AndrePC\\Downloads\\TesteFrameJunkie";
    let newPath = tvShowsCoversPath.concat(newCoverName);

    //oldPath = newTvShowCover
    renameFile(newTvShowCover, newPath);

    return { newCoverName, newPath };
}

async function renameFile(oldPath, newPath) {
    try 
    {
        //ERROR EXDEV: cross-device link not permitted
        //This error occurs because you are moving a file from one drive to another one.
        //On most platforms, this can’t be done using a simple rename operation.
        //await fs.rename(oldPath, newPath);

        await fs.copyFile(oldPath, newPath);

        await fs.unlink(oldPath, (err) => {
            if (err) {
              console.error(err);
            } else {
              console.log('File is deleted.');
            }
        });     
        
    } catch (error) 
    {
        logger.error(error);
        console.error(error);
    }
}

module.exports = { loadNewTvShow }