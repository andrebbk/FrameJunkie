

$('#btnHome').on('click', function (event){
    console.log('Home button clicked');

    hideMenu();
});

$('#btnMovies').on('click', function (event){
    console.log('Movies button clicked');

    hideMenu();
});

$('#btnNewMovie').on('click', function (event){
    console.log('NewMovie button clicked');

    hideMenu();
});

$('#btnTvShows').on('click', function (event){
    console.log('TvShows button clicked');

    hideMenu();
});

$('#btnNewTvShow').on('click', function (event){
    console.log('NewTvShow button clicked');

    hideMenu();
});

$('#btnSettings').on('click', function (event){
    console.log('Settings button clicked');
    alert('settings');

    hideMenu();
});


function hideMenu(){
    $('#navcheck').click();
}