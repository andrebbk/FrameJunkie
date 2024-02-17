const path = require('path');

//Load partial views
$('#topbar').load(path.join(__dirname, '/Views/Main/top_bar.html'));
$('#main-container').load(path.join(__dirname, '/Views/Main/menu.html'));

//Toast Notifications
const toast = document.querySelector(".toastt"), 
    closeIcon = document.querySelector(".close-toastt"), 
    progress = document.querySelector(".progress-toastt");

let timer1, timer2;

function showToastMessage(title, msg) {   
    if(toast.classList.contains("active") || progress.classList.contains("active")){
        clearTimeout(timer1);
        clearTimeout(timer2);
        
        toast.classList.remove("active");
        progress.classList.remove("active");
        progress.style.right = getComputedStyle(progress).right;
    }

    //set message info
    document.getElementById("toastt-title").textContent = title;
    document.getElementById("toastt-msg").textContent = msg;

    //show toast warning
    toast.classList.add("active");
    progress.classList.add("active");
  
    timer1 = setTimeout(() => {
      toast.classList.remove("active");
    }, 5000); //1s = 1000 milliseconds
  
    timer2 = setTimeout(() => {
      progress.classList.remove("active");
    }, 5300);
}

closeIcon.addEventListener("click", () => {
  toast.classList.remove("active");

  setTimeout(() => {
    progress.classList.remove("active");
  }, 300);

  clearTimeout(timer1);
  clearTimeout(timer2);
});


function closeToastMessage(){
    toast.classList.remove("active");
      
    setTimeout(() => {
        progress.classList.remove("active");
    }, 300);
    
    clearTimeout(timer1);
    clearTimeout(timer2);
}

module.exports = { showToastMessage, closeToastMessage }