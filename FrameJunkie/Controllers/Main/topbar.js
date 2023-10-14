const electron = require("electron");
const ipc = electron.ipcRenderer;

//BUTTONS
$('#btn_minimize').on('click', function(event){   
    ipc.send('minimize-app');
});

$('#btn_exit').on('click', function(event){   
    ipc.send('close-app');
});

