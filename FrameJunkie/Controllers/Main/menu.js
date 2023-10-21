const electron = require("electron");
const ipc = electron.ipcRenderer;
const fs = require('fs')
const path = require('path');

let knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./Northwind.sl3"
    },
    useNullAsDefault: true
});

//INIT WITH HOME
/*fs.readFile('./Views/Home/home.html', (err, data) => {
    document.getElementById('content-main-app').innerHTML = data;
    loadDashBoardData();
});*/
fs.readFile(path.join(__dirname, '../../Views/Movies/movies.html'), (err, data) => {
	document.getElementById('content-main-app').innerHTML = data;
	loadMovies();
	if(err != null) alert(err);
});


 //BUTTONS
$('#btnHome').on('click', function (event){
    fs.readFile(path.join(__dirname, '../../Views/Home/home.html'), (err, data) => {
        document.getElementById('content-main-app').innerHTML = data;
        loadDashBoardData();
		if(err != null) alert(err);
     });

    hideMenu();
});

$('#btnMovies').on('click', function (event){
	fs.readFile(path.join(__dirname, '../../Views/Movies/movies.html'), (err, data) => {
		document.getElementById('content-main-app').innerHTML = data;
		loadMovies();
		if(err != null) alert(err);
    });

    hideMenu();
});

$('#btnNewMovie').on('click', function (event){
    $('#content-main-app').load(' ');
    hideMenu();
});

$('#btnTvShows').on('click', function (event){
    $('#content-main-app').load(' ');
    hideMenu();
});

$('#btnNewTvShow').on('click', function (event){
    $('#content-main-app').load(' ');
    hideMenu();
});

$('#btnSettings').on('click', function (event){
    $('#content-main-app').load(' ');
    hideMenu();
});

function hideMenu(){
    $('#navcheck').click();
}

//HOME
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

//MOVIES
function loadMovies(){
	//Get movies
	ipc.send("getMovies");
	ipc.on("resultSent_movies", function (event, result) {
		for(var i = 0; i < result.length; i++){
			let movieElm = '<div class="movie-card">' +
			`<div class="movie-header" style="background: url('file://` + result[i].CoverPath.trim() + `');  background-size: cover;">` +
			'<div class="header-icon-container">' +
			'</div>' +
			'</div>' +
			'<div class="movie-content">' +
			'<div class="movie-content-header">';

			if(result[i].IsFavorite === 1)
				movieElm += '<a href="#"><h3 class="movie-title">' + result[i].MovieTitle + '  &nbsp; &#9733;</h3></a>';
			else
				movieElm += '<a href="#"><h3 class="movie-title">' + result[i].MovieTitle + '</h3></a>';

			movieElm += '<h3 class="movie-year">' + result[i].MovieYear + '<span style="margin-left:200px;">' + result[i].MovieRating + '/10</span></h3>' +
			'</div></div></div>';

			$('#gridMovies').append($(movieElm));
		}
	});
}