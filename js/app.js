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
	'rgb(153, 102, 255)',
	'rgb(201, 203, 207)'
]

function randomColor() {
	return ChartColors[Math.floor(Math.random() * ChartColors.length)]
}

function loadModel() {
	var json = localStorage.getItem('iot-bp-model')
	if (!json) return null
	window.Model = JSON.parse(json)
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
	var suggested = `${device.id} ${sensor.type}-${sensor.id}`
	return stored || suggested
}

function setMeasurementTitle(device, sensor, title) {
	var titleId = `${device.id}$${sensor.id}`
	Model.titles[titleId] = title
	saveModel()
}

$(function() {
	loadModel()
	if (Model.token) {
		Api.setToken(Model.token)
		$('#tokenSpan').html(Model.token + ' (from localstorage)')
	}
})

$('#getStatus').click(function() {
	Api.getStatus()
		.then(res => {
			$('#statusSpan').html("Okay")
		})
		.catch(err => {
			$('#statusSpan').html(err)
		})
})

$('#clearToken').click(function() {
	setApiToken('')
})

$('#getToken').click(function() {
	Api.requestToken()
		.then(res => {
			setApiToken(res.token)
		})
		.catch(err => {
			$('#tokenSpan').html(err)
		})
})

$('#getDevices').click(function() {
	var list = $('#devicesList').empty()
	Api.getDevices()
		.then(res => {
			Model.devices = res.devices
			for (var device of res.devices) {
				var sensorList = $('<ul></ul>')
				for (var sensor of device.sensors) {
					sensorList.append(`<li>${getMeasurementTitle(device, sensor)}</li>`).click(_ => loadData(device, sensor))
				}
				var item = $(`<li><b>${device.id}</b> with ${JSON.stringify(device.sensors.length)} sensors</li>`)
				item.append(sensorList)
				list.append(item)
			}
		})
		.catch(err => {
			list.append(`<li>Error: ${err}</li>`)
		})
})

function loadData(device, sensor) {
	var measurementTitle = getMeasurementTitle(device, sensor)
	var begin = new Date()
	begin.setHours(begin.getHours() - 1)
	var end = new Date()
	var resolutionSeconds = 1
	Api.queryData(device.id, sensor.id, begin, end, resolutionSeconds)
		.then(res => {
			var canvas = $('#canvas')
			var unit = sensor.unit
			var title = measurementTitle
			var normalized = res.datapoints.map(data => ({ x: data[0], y: data[1] }))
			displayChart(canvas, title, normalized, unit)
		})
		.catch(err => {
			console.log(err)
		})
}

function displayChart(canvas, title, datapoints, unit) {
	var config = {
		type: 'line',
		data: {
			datasets: [{
				data: datapoints,
				borderColor: randomColor(),
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
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						parser: 'YYYY-MM-DDTHH:mm:ssZ',
						unit: 'time',
						displayFormats: {
							time: 'MM-DD HH:mm:ss'
						}
					},
					ticks: {
						source: 'data',
						autoSkip: true,
						maxTicksLimit: 5
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
	var ctx = canvas.get(0).getContext('2d')
	var chart = new Chart(ctx, config)
	return chart
}
