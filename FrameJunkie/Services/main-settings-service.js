const logger = require('@electron/remote').require('./logger');
const fs = require('fs')
const path = require('path');

const { MediaTypeValues }  = require('@electron/remote').require('./enums');

let knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./Northwind.sl3"
    },
    useNullAsDefault: true
});


async function updateMainConfiguration(mediaTypeId, directoryPath){
    let output = false;
    logger.info("Main Settings Service - UpdateMainConfiguration: ENTER");

    try
    {
        if(mediaTypeId === MediaTypeValues.Movies.value){
            let updatedMoviesPathConfig = await knex('Configurations')
                .where({ Key: "MOVIES_COVERS_PATH" })
                .update({ 
                    Value: directoryPath
                }, ['Key', 'Value'])
                .then(function(resp) {                    
                    output = true;
                    return resp;
                }).catch(err => {
                    logger.error(err);
                    console.log(err);
                });
            
            //If config doens't exist, create a new one
            if(updatedMoviesPathConfig.length < 1){
                let configData = { 
                    Key: 'MOVIES_COVERS_PATH', 
                    Value: directoryPath,
                    CreateDate: new Date().toISOString(),
                    Deleted: 0
                };

                const [idConfig] = await knex('Configurations').insert(configData)
                .catch(function(error) {
                    logger.error(error);
                    console.error(error);
                });
            }
        }
        else if(mediaTypeId === MediaTypeValues.TvShows.value){
            let updatedTvShowsPathConfig = await knex('Configurations')
                .where({ Key: "TV_SHOWS_COVERS_PATH"})
                .update({ 
                    Value: directoryPath
                }, ['Key', 'Value'])
                .then(function(resp) {                    
                    output = true;
                    return resp;
                }).catch(err => {
                    logger.error(err);
                    console.log(err);
                });

            //If config doens't exist, create a new one
            if(updatedTvShowsPathConfig.length < 1){
                let configData = { 
                    Key: 'TV_SHOWS_COVERS_PATH', 
                    Value: directoryPath,
                    CreateDate: new Date().toISOString(),
                    Deleted: 0
                };

                const [idConfig] = await knex('Configurations').insert(configData)
                .catch(function(error) {
                    logger.error(error);
                    console.error(error);
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

module.exports = { updateMainConfiguration };