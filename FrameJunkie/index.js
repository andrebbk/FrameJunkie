const electron = require("electron");
const ipc = electron.ipcRenderer;

//Load partial views
$('#topbar').load('./Views/Main/top_bar.html');
$('#main-container').load('./Views/Main/menu.html');

document.addEventListener("DOMContentLoaded", function () {
    ipc.send("mainWindowLoaded");

    /*ipc.on("resultSent", function (event, result) {
        let resultEl = document.getElementById("result");
        console.log(result);

        for(var i = 0; i < result.length; i++){
            let htmlMovie = "<p> Movie: " + result[i].MovieTitle + "</p></br>";
            htmlMovie += '<img src="' + result[i].CoverPath + '" width="100" height="150"></br></br>';

            resultEl.innerHTML += htmlMovie;
        }

        let countEl = document.getElementById("count");
        countEl.innerHTML = "Movies: " + result.length.toString();
    });*/
});