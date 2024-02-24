const { showToastMessage, closeToastMessage } = require('../../index.js'); 
const logger = require('@electron/remote').require('./logger');
const fs = require('fs')
const path = require('path');
const { dialog } = require('@electron/remote');

const { MediaTypeValues }  = require('@electron/remote').require('./enums');

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

function loadAndShowMainConfig(configData){
    fs.readFile(path.join(__dirname, '../../Views/SettingsPages/main-config.html'), (err, data) => {       
        if(err != null){
            logger.error(error);
            console.error(error);
        }
        else{
            document.getElementById('settings_body').innerHTML += data;
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
    });
}

const selectDirectory = async (mediaTypeId) => {
    let options = { properties: ["openDirectory"]};

    dialog.showOpenDialog(null, {properties: ['openDirectory']})
    .then(result => {

        if(result.filePaths != null && result.filePaths != undefined && result.filePaths.length > 0){
            loadDirectory(mediaTypeId, result.filePaths[0] + '\\');
        }        

    }).catch(err => {
        console.log(err);
    });    
}

function loadDirectory(mediaTypeId, newDirectory){
    alert(mediaTypeId.toString() + newDirectory);
}

module.exports = { loadSettings }