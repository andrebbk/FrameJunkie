const electron = require("electron");
const ipc = electron.ipcRenderer;

var moviesViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tvshowsViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

loadDashBoardGraphs();

function loadDashBoardGraphs(){
	//MOVIES Views
	ipc.send("getMoviesViewsCount");
	ipc.on("resultSent_mvc", function (event, result) {
		for(var i = 0; i < result.length; i++){
			moviesViews[result[i].month - 1] = result[i].monthNumber;
		}

		var ul_m = document.getElementById("movies_month_views");
		for(var i = 0; i < moviesViews.length; i++){
			let newLi = document.createElement("li");
			newLi.appendChild(document.createTextNode(moviesViews[i].toString()));
			ul_m.appendChild(newLi);
		}
	});	

	//TVSHOWS - CHART
	ipc.send("getTvShowsViewsCount");
	ipc.on("resultSent_tsvc", function (event, result) {
		for(var i = 0; i < result.length; i++){
			tvshowsViews[result[i].month - 1] = result[i].monthNumber;
		}

		var ul_tv = document.getElementById("tvshows_month_views");
		for(var i = 0; i < tvshowsViews.length; i++){
			let newLi = document.createElement("li");
			newLi.appendChild(document.createTextNode(tvshowsViews[i].toString()));
			ul_tv.appendChild(newLi);
		}
	});	
}