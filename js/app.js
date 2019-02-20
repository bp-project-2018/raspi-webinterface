var Model = {
	token: '',
	devices: [],
	titles: {}
}

var ChartColors = [
	'rgb(255, 99, 132)',
	'rgb(255, 159, 64)',
	'rgb(255, 205, 86)',
	'rgb(75, 192, 192)',
	'rgb(54, 162, 235)',
	'rgb(153, 102, 255)'
]

function randomColor() {
	return ChartColors[Math.floor(Math.random() * ChartColors.length)]
}

function loadModel() {
	var json = localStorage.getItem('iot-bp-model')
	if (!json) return null
    window.Model = JSON.parse(json)
    Api.setToken(Model.token)
}

function saveModel() {
	var json = JSON.stringify(window.Model)
	localStorage.setItem('iot-bp-model', json)
}

function setApiToken(token) {
	Model.token = token
	Api.setToken(token)
	saveModel()
	$('#tokenSpan').html(Model.token || '???')
}

function getMeasurementTitle(device, sensor) {
	var titleId = `${device.id}$${sensor.id}`
	var stored = Model.titles[titleId]
	var suggested = `${device.id} ${sensor.type} ${sensor.id}`
	return stored || suggested
}

function setMeasurementTitle(device, sensor, title) {
	var titleId = `${device.id}$${sensor.id}`
	Model.titles[titleId] = title
	saveModel()
}

function displayDateRelativeToNow(date) {
	var now = new Date()
	var delta = Math.floor((now - date) / 1000)
	if (delta < 60) return `-${delta}s`
	if (delta < 3600) return `-${Math.floor(delta/60)}min`
	if (delta < 86400) return `-${Math.floor(delta/3600)}h`
	if (delta < 31536000) return `-${Math.floor(delta/86400)}d`
	return `-${Math.floor(delta/31536000*10)/10}y`
}

function ensureConnection(callback) {
    // TODO
    callback()
}

function displayChart(canvas, title, datapoints, unit, chartColor) {
	var config = {
		type: 'line',
		data: {
			datasets: [{
				data: datapoints,
				borderColor: chartColor,
				backgroundColor: 'rgba(0, 0, 0, 0)',
				fill: true,
			}]
		},
		options: {
			animation: false,
			spanGaps: true,
			elements: { point: { radius: 0 } },
			responsive: true,
			title: {
				display: true,
				text: title
			},
			legend: {
				display: false
			},
			tooltips: {
				enabled: false
			},
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						parser: 'YYYY-MM-DDTHH:mm:ssZ',
						unit: 'time'
					},
					ticks: {
						source: 'data',
						autoSkip: true,
						maxTicksLimit: 4,
						maxRotation: 0,
						callback: value => displayDateRelativeToNow(new Date(value))
					}
				}],
				yAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: unit
					},
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	}
	var oldChart = canvas.data('chart')
	if (oldChart) oldChart.destroy()
	var ctx = canvas.get(0).getContext('2d')
	var chart = new Chart(ctx, config)
	canvas.data('chart', chart)
	return chart
}

function loadCards() {
    var list = $('#main-cards').empty()
	Api.getDevices()
		.then(res => {
			Model.devices = res.devices
			for (var device of res.devices) {
				for (var sensor of device.sensors) {
					list.append(`<div class="card my-3 card-big">
                                    <div class="card-body" deviceId="${device.id}" sensorId="${sensor.id}" chartColor="${randomColor()}">
                                        <h4 class="card-title" contenteditable="true">${getMeasurementTitle(device, sensor)}</h4>
                                        <p class="card-text">Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
                                        <canvas></canvas>
                                    </div>
                                </div>`)
				}
            }
            updateAllCanvas()
		})
		.catch(err => {
			console.log(err)
        })
}

function updateAllCanvas() {
    $('canvas').each(function() {
        var canvas = $(this)
        var body = canvas.parent()
        var deviceId = body.attr('deviceId')
        var sensorId = body.attr('sensorId')
        var chartColor = body.attr('chartColor')
        var device = Model.devices.filter(x => x.id == deviceId)[0]
        var sensor = device.sensors.filter(x => x.id == sensorId)[0]
        var measurementTitle = getMeasurementTitle(device, sensor)
        var begin = new Date()
        begin.setHours(begin.getHours() - 1)
        var end = new Date()
        var resolutionSeconds = (end - begin) / 60000
        Api.queryData(device.id, sensor.id, begin, end, resolutionSeconds)
            .then(res => {
                var unit = sensor.unit
                var title = measurementTitle
                var normalized = res.datapoints.map(data => ({ x: data[0], y: data[1] }))
                displayChart(canvas, title, normalized, unit, chartColor)
            })
            .catch(err => {
                console.log(err)
            })
    })
}

function cardTitleUpdated() {
    var element = $(this)
    var title = element.text()
    var body = element.parent()
    var deviceId = body.attr('deviceId')
    var sensorId = body.attr('sensorId')
    var device = Model.devices.filter(x => x.id == deviceId)[0]
    var sensor = device.sensors.filter(x => x.id == sensorId)[0]
    setMeasurementTitle(device, sensor, title)
    updateAllCanvas()
}

function bindEvents() {
    $(document).on('blur', '.card-title', cardTitleUpdated);
}

$(function() {
    loadModel()
    ensureConnection(_ => {
        loadCards()
        bindEvents()
        setInterval(updateAllCanvas, 5000)
    })
})