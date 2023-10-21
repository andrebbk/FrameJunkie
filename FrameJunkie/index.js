const path = require('path');

//Load partial views
$('#topbar').load(path.join(__dirname, '/Views/Main/top_bar.html'));
$('#main-container').load(path.join(__dirname, '/Views/Main/menu.html'));