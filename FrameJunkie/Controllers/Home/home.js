const electron = require("electron");
const ipc = electron.ipcRenderer;

var xValues = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var barColors = ["silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver"];

var moviesViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tvshowsViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

//MOVIES - CHART
ipc.send("getMoviesViewsCount");
ipc.on("resultSent_mvc", function (event, result) {
	for(var i = 0; i < result.length; i++){
		moviesViews[result[i].month] = result[i].monthNumber;
	}

	create_MoviesViews_Graph();
});	

//TVSHOWS - CHART
ipc.send("getTvShowsViewsCount");
ipc.on("resultSent_tsvc", function (event, result) {
	for(var i = 0; i < result.length; i++){
		tvshowsViews[result[i].month] = result[i].monthNumber;
	}

	create_TvShowsViews_Graph();
});	

function create_MoviesViews_Graph(){
	new Chart("chart_moviesViews", {
		type: "bar",
		data: {
		labels: xValues,
		datasets: [{
			backgroundColor: barColors,
			data: moviesViews
		}]
		},
		options: {
		legend: {display: false},
		title: {
			display: false,
			text: "Movies Views"
		},
		labels: {
			fontColor: "white",
			fontSize: 18
		},
		scales: {
			yAxes: [{
				ticks: {
					fontColor: "white",
					//fontSize: 18,
					//stepSize: 1,
					//beginAtZero: true
				}
			}],
			xAxes: [{
				ticks: {
					fontColor: "white",
					//fontSize: 14,
					//stepSize: 1,
					//beginAtZero: true
				}
			}]
		}
		}
	});
}

function create_TvShowsViews_Graph(){
	new Chart("chart_tvshowsViews", {
		type: "bar",
		data: {
			labels: xValues,
			datasets: [{
			backgroundColor: barColors,
			data: tvshowsViews
			}]
		},
		options: {
			legend: {display: false},
			title: {
			display: false,
			text: "Movies Views"
			},
			labels: {
				fontColor: "white",
				fontSize: 18
			},
			scales: {
				yAxes: [{
					ticks: {
						fontColor: "white",
						//fontSize: 18,
						//stepSize: 1,
						//beginAtZero: true
					}
				}],
				xAxes: [{
					ticks: {
						fontColor: "white",
						//fontSize: 14,
						//stepSize: 1,
						//beginAtZero: true
					}
				}]
			}
		}
	});
}
