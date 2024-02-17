const { showToastMessage, closeToastMessage } = require('../../index.js'); 
const logger = require('@electron/remote').require('./logger');
const fs = require('fs')
const path = require('path');

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
            document.getElementById("p1").textContent = configData.movieCoversPath;
            document.getElementById("p2").textContent = configData.tvShowsCoversPath;

            document.getElementById('loading_container').remove();
            document.getElementById('main_config_container').style.visibility = "visible";
        }
    });
}


  module.exports = { loadSettings }