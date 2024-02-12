const electron = require("electron");
const ipc = electron.ipcRenderer;

function loadDashBoardData(){
	//STATS
	ipc.send("getStats");
	ipc.on("resultSent_stats", function (event, result) {
		let h_m_total = document.getElementById("h_m_total");
		h_m_total.innerHTML = result[0].TotalMovies;

		let h_m_total_views = document.getElementById("h_m_total_views");
		h_m_total_views.innerHTML = result[0].Movies_TotalViews;

		let h_tv_total = document.getElementById("h_tv_total");
		h_tv_total.innerHTML = result[0].TotalTvShows;

		let h_tv_total_views = document.getElementById("h_tv_total_views");
		h_tv_total_views.innerHTML = result[0].TvShows_TotalViews;		
	});	

    let moviesViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let tvshowsViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    let monthsHTML = '<li>Janeiro</li>' +
    '<li>Fevereiro</li>' +		
    '<li>Março</li>' +		
    '<li>Abril</li>' +		
    '<li>Maio</li>' +		
    '<li>Junho</li>' +		
    '<li>Julho</li>' +		
    '<li>Agosto</li>' +		
    '<li>Setembro</li>' +		
    '<li>Outubro</li>' +		
    '<li>Novembro</li>' +		
    '<li>Dezembro</li>';

	//MOVIES Views
	ipc.send("getMoviesViewsCount");
	ipc.on("resultSent_mvc", function (event, result) {
		for(var i = 0; i < result.length; i++){
			moviesViews[result[i].month - 1] = result[i].monthNumber;
		}

		var ul_m = document.getElementById("movies_month_views");
        ul_m.innerHTML = monthsHTML;
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
        ul_tv.innerHTML = monthsHTML;
		for(var i = 0; i < tvshowsViews.length; i++){
			let newLi = document.createElement("li");
			newLi.appendChild(document.createTextNode(tvshowsViews[i].toString()));
			ul_tv.appendChild(newLi);
		}
	});	
}

module.exports = { loadDashBoardData }