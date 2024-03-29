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

            validateAndSaveTvShow(tvShowTitle, tvShowYear, isFavTvShow, tvShowRating, tvShowObservations, tvShowCover);            
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

async function validateAndSaveTvShow(tvShowTitle, tvShowYear, isFavTvShow, tvShowRating, tvShowObservations, tvShowCover) {
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
                saveTvShow(tvShowsCoversPath, tvShowTitle, tvShowYear, isFavTvShow, tvShowRating, tvShowObservations, tvShowCover);
                
            }            
        });
    }
    else{
        showToastMessage("Frame Junkie", "Tv shows covers path config doens't exist!");
    }
}

async function saveTvShow(tvShowsCoversPath, tvShowTitle, tvShowYear, isFavTvShow, tvShowRating, tvShowObservations, tvShowCover) {
    
    let tvShowData = { 
        TvShowTitle: tvShowTitle, 
        TvShowYear: tvShowYear,
        TvShowSeasons: 0,
        TvShowEpisodes: 0,
        NrViews: 1, 
        IsFavorite: isFavTvShow, 
        TvShowRating: tvShowRating, 
        IsFinished: 0,
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
        await fs.rename(oldPath, newPath);
        console.log('Rename complete!');
        
    } catch (err) 
    {
        logger.error(error);
        console.error(error);
    }
}

module.exports = { loadNewTvShow }