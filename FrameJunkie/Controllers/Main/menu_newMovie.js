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

let hasNewMovieCover = false, newMovieCover = "";

//INIT
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
        $('#movie-cover-upload').trigger("click"); //.click() call is deprecated
    });    

    $('#movie-cover-upload').on('change', function(event){
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

    $('#btnRefreshMovieCover').on('click', function(){
        var output = document.getElementById('movie-cover-output');
        output.src = pathToFileURL(`${__dirname}../../../Content/Images/No-Image-Placeholder.png`);

        document.querySelector('.refresh-movie-cover').classList.toggle('change');

        hasNewMovieCover = false;
        newMovieCover = "";
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
        clearNewMovieForm();
        showToastMessage("Frame Junkie", "New movie form cleared with success!");
    });

    $('#btnSaveNewMovie').on('click', function(){
        //validate form data
        var validationResult = validateNewMovie();
        if(validationResult.IsValid){
            
            //new movie data
            let movieTitle = $('#movie-title').val(),
            movieYear = $('#movie-year').val(),
            isFavMovie = $('#movie-isfav').prop("checked"),
            movieRating = 0,
            movieObservations = $('#movie-observations-id').val(),
            movieCover = newMovieCover;

            //movie rating data
            document.querySelectorAll(".star").forEach((ele) => {
                if(ele.checked){
                    movieRating = ele.getAttribute('data-starvalue');
                    return;
                }
            });

            validateAndSaveMovie(movieTitle, movieYear, isFavMovie, movieRating, movieObservations, movieCover);            
        }else{
            showToastMessage("Frame Junkie", validationResult.ErrorMessage);
        }
        
    });
}

//FUNCTIONS
function clearNewMovieForm(){
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
    $('#movie-cover-upload').val('');
    var output = document.getElementById('movie-cover-output');
    output.src = pathToFileURL(`${__dirname}../../../Content/Images/No-Image-Placeholder.png`);

    if(document.getElementById('btnRefreshMovieCover').classList.contains("change"))
    { document.querySelector('.refresh-movie-cover').classList.toggle('change'); }    
}

function validateNewMovie(){
    let resultOuput = { IsValid: true, ErrorMessage: "" };
    var crrYear = new Date().getFullYear();

    //Movie Title
    if($('#movie-title').val() == null || $('#movie-title').val() == '' || $('#movie-title').val() == ' '){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Movie title is empty!";
    }

    //Movie Year
    else if($('#movie-year').val() == null || ($('#movie-year').val() != null && ($('#movie-year').val() > Number(crrYear) || $('#movie-year').val() < 1980))){
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Movie year is not valid!";
    }

    //Movie Cover
    else if(!hasNewMovieCover)
    {
        resultOuput.IsValid = false;
        resultOuput.ErrorMessage = "Movie cover wasn't defined!";
    }

    //Movie Rating
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
            resultOuput.ErrorMessage = "Movie rating wasn't defined!";
        }
    }    

    return resultOuput;
}

async function validateAndSaveMovie(movieTitle, movieYear, isFavMovie, movieRating, movieObservations, movieCover) {
    let queryStrTile = '%' + movieTitle + '%';

    let result = knex('Movies')
    .whereLike('MovieTitle', queryStrTile)
    .where('MovieYear', movieYear)
    .where('Deleted', 0)
    .select('MovieId')
    .first();

    //Getting covers path
    let moviesCoversPath = await knex.select("Value").from("Configurations").where("Key", "MOVIES_COVERS_PATH").where("Deleted", 0).first()
    .then(function(config){
        if(config != null && config != undefined)
            return config.Value;
        else {
            return "";
        }           
    });

    if(moviesCoversPath != null && moviesCoversPath != ""){
        result.then(function (rows){          
            if(rows != null && rows.MovieId > 0)
                showToastMessage("Frame Junkie", "This movie already exists!");
            else{
                //Save new movie
                saveMovie(moviesCoversPath, movieTitle, movieYear, isFavMovie, movieRating, movieObservations, movieCover);
                
            }            
        });
    }
    else{
        showToastMessage("Frame Junkie", "Movies covers path config doens't exist!");
    }
}

async function saveMovie(moviesCoversPath, movieTitle, movieYear, isFavMovie, movieRating, movieObservations, movieCover) {
    
    let movieData = { 
        MovieTitle: movieTitle, 
        MovieYear: movieYear,
        NrViews: 1, 
        IsFavorite: isFavMovie, 
        MovieRating: movieRating, 
        Observations: movieObservations,
        CreateDate: new Date().toISOString(),
        Deleted: 0
    };

    //insert new movie and keep db id
    const [idNewMovie] = await knex('Movies').insert(movieData)
    .catch(function(error) {
        logger.error(error);
        console.error(error);
    });

    if(idNewMovie != null && idNewMovie > 0){        
        var movieViewData = {
            MovieId: idNewMovie,
            CreateDate: new Date().toISOString()
        };

        //insert new movie view
        await knex('MovieView').insert(movieViewData)
        .catch(function(error) {
            logger.error(error);
            console.error(error);
        });

        //save new movie cover
        let newCover = saveMovieCover(moviesCoversPath, movieTitle, movieCover);
        if(newCover != null){
            var movieCoverData = {
                MovieId: idNewMovie,
                CoverName: newCover.newCoverName,
                CoverPath: newCover.newPath,
                CreateDate: new Date().toISOString(),
                Deleted: 0
            };

            //insert new movie cover
            await knex('MovieCovers').insert(movieCoverData)
            .catch(function(error) {
                logger.error(error);
                console.error(error);
            });
        }

        //clear form
        clearNewMovieForm();       
    }  

    showToastMessage("Frame Junkie", "New movie saved!");
}

let saveMovieCover = (moviesCoversPath, movieTitle, newMovieCover) => {

    if(movieTitle == null || movieTitle == '' || movieTitle == ' ' || newMovieCover == null)
        return null;

    //get new movie cover file extension
    let coverExtension = "";
    let fileName = newMovieCover.split('/');
    if(fileName != null && fileName.length > 0){    
        let fileExtension = fileName[fileName.length - 1].split('.');
        if(fileExtension != null && fileExtension.length > 0){
            coverExtension = fileExtension[fileExtension.length - 1];
        }
    }

    //remove spaces and special chars from movie title
    //generate small guid with nanoid package
    //create new movie cover name with file extension
    let newCoverName = movieTitle.replace(/[^A-Z0-9]+/ig, "") + '_' + nanoid(7) + '.' + coverExtension;
   
    //TODO: Get config path for covers folder
    //let path = "C:\\Users\\AndrePC\\Downloads\\TesteFrameJunkie";
    let newPath = moviesCoversPath.concat(newCoverName);

    //oldPath = newMovieCover
    renameFile(newMovieCover, newPath);

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

module.exports = { loadNewMovie }