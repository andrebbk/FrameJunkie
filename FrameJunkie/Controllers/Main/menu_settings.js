const { showToastMessage, closeToastMessage } = require('../../index.js'); 
const logger = require('@electron/remote').require('./logger');
const fs = require('fs')
const path = require('path');
const  moment = require('moment');

const { dialog } = require('@electron/remote');

const { MediaTypeValues } = require('@electron/remote').require('./enums');
const { updateMainConfiguration } = require('../../Services/main-settings-service.js');

let currentLoadedOption = "1";
const area_MainConfig = '../../Views/SettingsPages/main-config.html';
const area_MoviesConfig = '../../Views/SettingsPages/movies-config.html';

let knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./Northwind.sl3"
    },
    useNullAsDefault: true
});

function loadSettings(){
    const configs = loadMainConfigurations();
    setTimeout(() => configs.loader()
        .then(result => {
            loadAndShowMainConfig(result);
        }), 1000);          
}

//DB
const loadMainConfigurations = () => {
    let config = null;
  
    const loader = () => {
      return new Promise(async (resolve, reject) => {

        //load movie covers config
        const mCoversConfig = await knex('Configurations')
        .where("Key", "MOVIES_COVERS_PATH")
        .where("Deleted", 0)
        .select("Value")
        .first()
        .catch(function(error) {
            logger.error(error);
            console.error(error);
        });

        //load tv shows covers config
        const tCoversConfig = await knex('Configurations')
        .where("Key", "TV_SHOWS_COVERS_PATH")
        .where("Deleted", 0)
        .select("Value")
        .first()
        .catch(function(error) {
            logger.error(error);
            console.error(error);
        });

        let resultOutput = { 
            movieCoversPath: mCoversConfig != null ? mCoversConfig.Value : "", 
            tvShowsCoversPath: tCoversConfig != null ? tCoversConfig.Value : ""
        };

        await resolve(resultOutput);  

      }).then(res => {      
        config = res;
        return config;
      })
      .catch((err) => {
        logger.error(error);
        console.error(err);
      });
    };
  
    return {
        loader: loader
    };
};

const loadData = () => {
    let config = null;
  
    const loader = () => {
      return new Promise(async (resolve, reject) => {

        //load data
        const movies = await knex('Movies')
        .where("Deleted", 0)
        .orderBy('CreateDate', 'desc')
        .select("*")
        .catch(function(error) {
            logger.error(error);
            console.error(error);
        });

        await resolve(movies);  

      }).then(res => {      
        config = res;
        return config;
      })
      .catch((err) => {
        logger.error(error);
        console.error(err);
      });
    };
  
    return {
        loader: loader
    };
};

//CONTROLS
function loadAndShowMainConfig(configData){
    fs.readFile(path.join(__dirname, area_MainConfig), (err, data) => {       
        if(err != null){
            logger.error(error);
            console.error(error);
        }
        else{
            document.getElementById('settings_body').innerHTML += data;

            initMainConfigurationArea(configData);
            
            //dropdown menu
            $('.dropdown ul li').on('click', function(e){ 
                e.preventDefault();
                loadSettingsFromMenu($(this).attr("data-option"));       
            });
        }
    });
}

const selectDirectory = async (mediaTypeId) => {
    let options = { properties: ["openDirectory"]};

    dialog.showOpenDialog(null, {properties: ['openDirectory']})
    .then(result => {

        if(result.filePaths != null && result.filePaths != undefined && result.filePaths.length > 0){

            //update config
            if(updateMainConfiguration(mediaTypeId, result.filePaths[0] + '\\')){
                if(mediaTypeId === MediaTypeValues.Movies.value){
                    document.getElementById("movie-c-path").value = result.filePaths[0] + '\\'; //update UI
                    showToastMessage("Frame Junkie", "Movies path configuration was updated!");
                }
                else if(mediaTypeId === MediaTypeValues.TvShows.value){
                    document.getElementById("tvshow-c-path").value = result.filePaths[0] + '\\'; //update UI
                    showToastMessage("Frame Junkie", "TvShows path configuration was updated!");
                }
            }
        }        

    }).catch(err => {
        console.log(err);
    });    
}

function resetContainer(){
    var loadingHtml = '<div id="loading_container" class="loading-container">' +
    '<img class="loading-img" src="./Content/Images/loading_animation.gif" width="60" height="60"></div>';

    document.getElementById('settings_body').innerHTML = loadingHtml;
}

function loadSettingsFromMenu(optionSelected){

    if(currentLoadedOption !== optionSelected){
        resetContainer();

        if(optionSelected === "1"){
            //load main settings           
            const configs = loadMainConfigurations();
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_MainConfig, result);
                }), 1000);
        }
        else if(optionSelected === "2"){
            //load movies settings    
            const configs = loadData();
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_MoviesConfig, result);
                }), 1000);  
        }
    }    

    //update current loaded option
    currentLoadedOption = optionSelected;

    //close dropdown menu
    $(".dropdown").removeAttr("open");
}


module.exports = { loadSettings }

//AREAS
function loadAndShowArea(areaPath, areaData){
    fs.readFile(path.join(__dirname, areaPath), (err, data) => {       
        if(err != null){
            logger.error(error);
            console.error(error);
        }
        else{
            document.getElementById('settings_body').innerHTML += data;

            if(currentLoadedOption === "1"){
                initMainConfigurationArea(areaData);
            }
            else if(currentLoadedOption === "2"){
                initMoviesConfigurationArea(areaData);
            }
            
        }
    });
}

function initMainConfigurationArea(configData){
    //set config data
    document.getElementById("movie-c-path").value = configData.movieCoversPath;
    document.getElementById("tvshow-c-path").value = configData.tvShowsCoversPath;

    document.getElementById('loading_container').remove();
    document.getElementById('main_config_container').style.visibility = "visible";

    $("#main_config_container").animate({"opacity": 1}, 600);

    $("#btnUpdateMoviesCoversPath").on('click', function(event){
        selectDirectory(MediaTypeValues.Movies.value);
    });

    $("#btnUpdateTvShowsCoversPath").on('click', function(event){
        selectDirectory(MediaTypeValues.TvShows.value);
    });    
}

function initMoviesConfigurationArea(areaData){   
    document.getElementById('loading_container').remove();
    document.getElementById('movies_config_container').style.visibility = "visible";

    $("#movies_config_container").animate({"opacity": 1}, 600);

    var DataTable = require( 'datatables.net' );
 
    let table = new DataTable('#settingsGrid', {
        bLengthChange: false,
        bFilter: false, 
        bInfo: true,
        ordering: true,
        searching: false,
        paging: true,
        processing : true,
        pageLength: 10,
        order: [0,'desc'],
        columns: getSettingsGridColumns(),
        data: areaData
    });
}

function getSettingsGridColumns(){
    let output = [];

    output.push({ name: "MovieId", data: 'MovieId', title: 'Id', visible: true, with:'20px' });
    output.push({ name: "MovieTitle", data: 'MovieTitle', title: 'Title', visible: true  });
    output.push({ name: "MovieYear", data: 'MovieYear', title: 'Year', visible: true  });
    output.push({ name: "NrViews", data: 'NrViews', title: 'Views', visible: true  });
    output.push({ name: "IsFavorite", data: 'IsFavorite', title: 'IsFavorite', visible: true  });
    output.push({ name: "MovieRating", data: 'MovieRating', title: 'Rating', visible: true  });
    output.push({ name: "CreateDate", data: 'CreateDate', title: 'Create Date', visible: true, render: createDateFormatter });
    output.push({ name: "Observations", data: 'Observations', title: 'Observations', visible: true, render: observationsFormatter  });

    return output;
}

function createDateFormatter(data, type, row, meta){   
    return moment(data).format("DD-MM-YYYY HH:mm:ss");
}

function observationsFormatter(data, type, row, meta){
    if(data != null && data != '' && data != ' '){
        if(data.length > 24){
            return data.substr(0, 20).concat(" ...");
        }
    }

    return data;
}