const electron = require("electron");
const ipc = electron.ipcRenderer;
const Chart = require('chart.js');

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

	//MOVIES Views - CHART
	ipc.send("getMoviesViewsCount");
	ipc.on("resultSent_mvc", function (event, result) {	
		if(result != undefined && result.length > 0){
			for(var i = 0; i < result.length; i++){
				moviesViews[result[i].month - 1] = result[i].monthNumber;
			}
	
			var movieViewsGraphEle = document.getElementById('movie-views-chart').getContext('2d');
			initHomeGraph(movieViewsGraphEle, 'Movie Views', moviesViews);
		}		
		else{
			let noMovieViewsDataHtml = '<h1>No movie views submitted</h1>'
			$('#movie_views_container_graph').html(noMovieViewsDataHtml);
		}
	});	

	//TVSHOWS Views - CHART
	ipc.send("getTvShowsViewsCount");
	ipc.on("resultSent_tsvc", function (event, result) {
		if(result != undefined && result.length > 0){
			for(var i = 0; i < result.length; i++){
				tvshowsViews[result[i].month - 1] = result[i].monthNumber;
			}
	
			var tvShowViewsGraphEle = document.getElementById('tvshows-views-chart').getContext('2d');
			initHomeGraph(tvShowViewsGraphEle, 'Tv Show Views', tvshowsViews);
		}		
		else{
			let noTvShowViewsDataHtml = '<h1>No tv show views submitted</h1>'
			$('#tvshow_views_container_graph').html(noTvShowViewsDataHtml);
		}
	});	
}

function initHomeGraph(graphElement, datasetHoverLabel, graphData) {
	new Chart(graphElement, {
		type: 'bar',
		data: {
		labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],		
		datasets: [{
			label: datasetHoverLabel,
			backgroundColor: 'rgb(204,204,204)',
			borderColor: 'rgb(204,204,204)',
			data: graphData
        }]
    },
    // Configuration options go here
	options: {
		legend: { 
			display: false,
		},
		scales: {
			xAxes: [{
				gridLines: {
					display:false
				},
				ticks: {
					fontColor: "#CCC" // this here
				}
			}],
			yAxes: [{
				gridLines: {
					display:false
				},
				ticks: {
					fontColor: "#CCC", // this here
					suggestedMin: 0,    // minimum will be 0, unless there is a lower value.
                	beginAtZero: true,   // minimum value will be 0.
					// forces step size to be 1 unit
					stepSize: 1
				} 
			}]
		}
	}
	});
}

module.exports = { loadDashBoardData }