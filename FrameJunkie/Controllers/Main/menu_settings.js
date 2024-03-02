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
const area_SettingsDataConfig = '../../Views/SettingsPages/settings-data-config.html';

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

const loadData = (tableName, optionSelected) => {
    let config = null;
  
    const loader = () => {
      return new Promise(async (resolve, reject) => {
      
        if(optionSelected === "4"){
            //Load movie views
            const settingsData = await knex('MovieView')
            .join('Movies', 'MovieView.MovieId', '=', 'Movies.MovieId')
            .orderBy('MovieView.CreateDate', 'desc')
            .select('MovieView.Id', 'MovieView.MovieId', 'Movies.MovieTitle', 'MovieView.CreateDate')
            .catch(function(error) {
                logger.error(error);
                console.error(error);
            });

            await resolve(settingsData);              
        }
        else if(optionSelected === "7"){
            //Load tvshow views
            const settingsData = await knex('TvShowView')
            .join('TvShows', 'TvShowView.TvShowId', '=', 'TvShows.TvShowId')
            .orderBy('TvShowView.CreateDate', 'desc')
            .select('TvShowView.Id', 'TvShowView.TvShowId', 'TvShows.TvShowTitle', 'TvShowView.CreateDate')
            .catch(function(error) {
                logger.error(error);
                console.error(error);
            });

            await resolve(settingsData);    
        } 
        else{
            //load data
            const settingsData = await knex(tableName).where("Deleted", 0)
            .orderBy('CreateDate', 'desc')
            .select("*")
            .catch(function(error) {
                logger.error(error);
                console.error(error);
            });

            await resolve(settingsData);  
        }        

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

        //update current loaded option
        currentLoadedOption = optionSelected;

        if(optionSelected === "1"){
            //load main settings           
            const configs = loadMainConfigurations();
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_MainConfig, result);
                }), 1000);
        }
        else if(optionSelected === "2"){
            //load settings data
            const configs = loadData('Movies', optionSelected);
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_SettingsDataConfig, result);
                }), 1000);  
        }
        else if(optionSelected === "3"){
            //load settings data
            const configs = loadData('MovieCovers', optionSelected);
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_SettingsDataConfig, result);
                }), 1000);  
        }
        else if(optionSelected === "4"){
            //load settings data
            const configs = loadData('MovieView', optionSelected);
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_SettingsDataConfig, result);
                }), 1000);  
        }
        else if(optionSelected === "5"){
            //load settings data
            const configs = loadData('TvShows', optionSelected);
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_SettingsDataConfig, result);
                }), 1000);  
        }
        else if(optionSelected === "6"){
            //load settings data
            const configs = loadData('TvShowCovers', optionSelected);
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_SettingsDataConfig, result);
                }), 1000);  
        }
        else if(optionSelected === "7"){
            //load settings data
            const configs = loadData('TvShowView', optionSelected);
            setTimeout(() => configs.loader()
                .then(result => {
                    loadAndShowArea(area_SettingsDataConfig, result);
                }), 1000);  
        }
    }        

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
            else {
                initSettingsDataConfigurationArea(areaData);
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

function initSettingsDataConfigurationArea(areaData){   

    if(currentLoadedOption === "2"){
        document.getElementById('settings_data_header').innerHTML = "Movies";
    }   
    else if(currentLoadedOption === "3"){
        document.getElementById('settings_data_header').innerHTML = "Movies Covers";
    }   
    else if(currentLoadedOption === "4"){
        document.getElementById('settings_data_header').innerHTML = "Movies Views";
    }   
    else if(currentLoadedOption === "5"){
        document.getElementById('settings_data_header').innerHTML = "Tv Shows";
    }  
    else if(currentLoadedOption === "6"){
        document.getElementById('settings_data_header').innerHTML = "Tv Shows Covers";
    }    
    else if(currentLoadedOption === "7"){
        document.getElementById('settings_data_header').innerHTML = "Tv Shows Views";
    }              

    var DataTable = require('datatables.net');

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

    //Show data container
    document.getElementById('loading_container').remove();
    document.getElementById('settings_data_config_container').style.visibility = "visible";

    $("#settings_data_config_container").animate({"opacity": 1}, 600);

    //add tooltip to cover name
    $('#settingsGrid').on('mouseover','tbody tr', function (e) {
        var t = table.row( this ).data();

        if(t.CoverName != null && t.CoverName != undefined){
            this.title = t.CoverName;
        }        
    } );  
}

//DATATABLES
function getSettingsGridColumns(){
    let output = [];

    if(currentLoadedOption === "2") {
        output.push({ name: "MovieId", data: 'MovieId', title: 'Id', visible: true, width:'5%' });
        output.push({ name: "MovieTitle", data: 'MovieTitle', title: 'Title', visible: true  });
        output.push({ name: "MovieYear", data: 'MovieYear', title: 'Year', visible: true  });
        output.push({ name: "NrViews", data: 'NrViews', title: 'Views', visible: true  });
        output.push({ name: "IsFavorite", data: 'IsFavorite', title: 'IsFavorite', visible: true  });
        output.push({ name: "MovieRating", data: 'MovieRating', title: 'Rating', visible: true  });
        output.push({ name: "CreateDate", data: 'CreateDate', title: 'Create Date', visible: true, render: createDateFormatter });
        output.push({ name: "Observations", data: 'Observations', title: 'Observations', visible: true, render: observationsFormatter  });
    }   
    else if(currentLoadedOption === "3") {
        output.push({ name: "MovieCoverId", data: 'MovieCoverId', title: 'Id', visible: true, width:'5%' });
        output.push({ name: "MovieId", data: 'MovieId', title: 'Movie Id', visible: true, width:'8%'  });
        output.push({ name: "CoverName", data: 'CoverName', title: 'Cover Name', visible: true, width:'15%', render: coverNameFormatter });
        output.push({ name: "CoverPath", data: 'CoverPath', title: 'Cover Path', visible: true  });
        output.push({ name: "CreateDate", data: 'CreateDate', title: 'Create Date', visible: true, render: createDateFormatter });
    }
    else if(currentLoadedOption === "4") {
        output.push({ name: "Id", data: 'Id', title: 'Id', visible: true, width:'0.5%' });
        output.push({ name: "MovieId", data: 'MovieId', title: 'Movie Id', visible: true, width:'3%'  });
        output.push({ name: "MovieTitle", data: 'MovieTitle', title: 'Title', visible: true, width:'40%' });
        output.push({ name: "CreateDate", data: 'CreateDate', title: 'Create Date', visible: true, render: createDateFormatter, width:'10%' });
    }
    else if(currentLoadedOption === "5") {
        output.push({ name: "TvShowId", data: 'TvShowId', title: 'Id', visible: true, width:'5%' });
        output.push({ name: "TvShowTitle", data: 'TvShowTitle', title: 'Title', visible: true  });
        output.push({ name: "TvShowYear", data: 'TvShowYear', title: 'Year', visible: true  });
        output.push({ name: "TvShowSeasons", data: 'TvShowSeasons', title: 'Seasons', visible: true  });
        output.push({ name: "TvShowEpisodes", data: 'TvShowEpisodes', title: 'Episodes', visible: true  });
        output.push({ name: "NrViews", data: 'NrViews', title: 'Views', visible: true  });
        output.push({ name: "IsFavorite", data: 'IsFavorite', title: 'IsFavorite', visible: true  });
        output.push({ name: "TvShowRating", data: 'TvShowRating', title: 'Rating', visible: true  });
        output.push({ name: "IsFinished", data: 'IsFinished', title: 'IsFinished', visible: true  });
        output.push({ name: "CreateDate", data: 'CreateDate', title: 'Create Date', visible: true, render: createDateFormatter });
        output.push({ name: "Observations", data: 'Observations', title: 'Observations', visible: true, render: observationsFormatter  });
    }     
    else if(currentLoadedOption === "6") {
        output.push({ name: "TvShowCoverId", data: 'TvShowCoverId', title: 'Id', visible: true, width:'5%' });
        output.push({ name: "TvShowId", data: 'TvShowId', title: 'TvShow Id', visible: true, width:'8%'  });
        output.push({ name: "CoverName", data: 'CoverName', title: 'Cover Name', visible: true, width:'15%', render: coverNameFormatter });
        output.push({ name: "CoverPath", data: 'CoverPath', title: 'Cover Path', visible: true  });
        output.push({ name: "CreateDate", data: 'CreateDate', title: 'Create Date', visible: true, render: createDateFormatter });
    }  
    else if(currentLoadedOption === "7") {
        output.push({ name: "Id", data: 'Id', title: 'Id', visible: true, width:'0.5%' });
        output.push({ name: "TvShowId", data: 'TvShowId', title: 'Tv Show Id', visible: true, width:'6%'  });
        output.push({ name: "TvShowTitle", data: 'TvShowTitle', title: 'Title', visible: true, width:'40%' });
        output.push({ name: "CreateDate", data: 'CreateDate', title: 'Create Date', visible: true, render: createDateFormatter, width:'10%' });
    }

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

function coverNameFormatter(data, type, row, meta){
    if(data != null && data != '' && data != ' '){
        if(data.length > 33){
            return data.substr(0, 30).concat(" ...");
        }
    }

    return data;
}