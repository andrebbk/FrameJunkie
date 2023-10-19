
//HOME
$('#content-main-app').load('./Views/Home/home.html');

$('#btnHome').on('click', function (event){
    $('#content-main-app').load('./Views/Home/home.html');
    hideMenu();
});

$('#btnMovies').on('click', function (event){
    $('#content-main-app').load('./Views/Movies/movies.html');
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