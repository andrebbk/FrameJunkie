
var xValues = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var barColors = ["silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver","silver"];

var moviesViews = [55, 49, 44, 24, 15, 0, 0, 5, 30];

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

var tvshowsViews = [55, 49, 44, 24, 15, 0, 0, 5, 30];

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
