function displayChart(canvas, title, datapoints, unit) {
    var config = {
        type: 'line',
        data: {
            datasets: [{
                data: datapoints,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: title
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        parser: 'YYYY-MM-DD HH:mm:ss',
                        unit: 'time',
                        displayFormats: {
                            time: 'YYYY-MM-DD'
                        }
                    },
                    ticks: {
                        source: 'data',
                        autoSkip: true,
                        maxTicksLimit: 2
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: unit
                    },
                }]
            }
        }
    }
    var ctx = canvas.get(0).getContext('2d')
    var chart = new Chart(ctx, config)
    return chart
}


$(function(){
    displayChart($('#canvas'), 'Demo Data', [{x:'2018-01-01 12:12:00', y:5},{x:'2018-01-02 12:12:00', y:1},{x:'2018-01-05 12:12:00', y:10}], '°C')
})