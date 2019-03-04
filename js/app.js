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
	if (json) window.Model = JSON.parse(json)
   
    window.Model = window.Model || {}
    Model.token = Model.token || ''
    Model.devices = Model.devices || []
    Model.titles = Model.titles || {}
    Model.sorting = Model.sorting || {}
    Model.disabled = Model.disabled || {}

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
}

function getMeasurementTitle(device, sensor) {
	var titleId = `${device.id}/${sensor.id}`
	if (titleId in Model.titles) return Model.titles[titleId]
	else return `${device.id} ${sensor.type} ${sensor.id}`
}

function setMeasurementTitle(device, sensor, title) {
	var titleId = `${device.id}/${sensor.id}`
	Model.titles[titleId] = title
    $(`label[deviceId=${device.id}][sensorId=${sensor.id}] .titlespan`).html(title)
    saveModel()
}

function getMeasurementSorting(device, sensor) {
	var sortingId = `${device.id}/${sensor.id}`
	if (sortingId in Model.sorting) return Model.sorting[sortingId]
	else return -(new Date(sensor.discoveredAt).getTime())
}

function setMeasurementSorting(device, sensor, sorting) {
	var sortingId = `${device.id}/${sensor.id}`
	Model.sorting[sortingId] = sorting
    saveModel()
}

function displayDateRelativeToNow(date) {
	var now = new Date()
	var delta = Math.floor((now - date)/1000)
	if (delta < 60) return `-${delta}s`
	if (delta < 3600) return `-${Math.floor(delta/60)}min`
	if (delta < 86400) return `-${Math.floor(delta/3600)}h`
	if (delta < 31536000) return `-${Math.floor(delta/86400)}d`
	return `-${Math.floor(delta/31536000*10)/10}y`
}

function ensureConnection(successCallback) {
    Api.getStatus()
		.then(successCallback)
		.catch(err => {
            $('#authentication-modal').modal('show')
            Api.requestToken()
                .then(res => {
                    $('#authentication-modal').modal('hide')
                    setApiToken(res.token)
                    successCallback()
                })
                .catch(err => {
					err = err.statusText || err
                    $('#modal-message').html('Failed to request token from device: ' + err)
                })
		})
}

function displayChart(canvas, datapoints, unit, chartColor) {
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
			title: { display: false },
			legend: { display: false },
			tooltips: { enabled: false },
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
					ticks: { beginAtZero: true }
				}]
			}
		}
	}
	var old = canvas.data('chart')
	if (old) old.destroy()
	var ctx = canvas.get(0).getContext('2d')
	var chart = new Chart(ctx, config)
	canvas.data('chart', chart)
	return chart
}

function isSensorDisabled(device, sensor) {
    return Model.disabled[`${device.id}/${sensor.id}`] || false
}

function setSensorDisabled(device, sensor, disabled) {
    Model.disabled[`${device.id}/${sensor.id}`] = disabled
    var card = $(`.card[deviceId=${device.id}][sensorId=${sensor.id}]`)
    if (disabled) card.hide()
    else card.show()
    saveModel()
}

function loadCards() {
    Api.getDevices()
		.then(res => {
			Model.devices = res.devices
			renderSensors()
            saveModel()
		})
		.catch(err => {
			console.log(err)
        })
}

function renderSensors() {
	var cards = $('#main-cards').empty()
	var labels = $('#menu-list').empty()
	for (var device of Model.devices) {
		for (var sensor of device.sensors) {
			var title = getMeasurementTitle(device, sensor)
			var sorting = getMeasurementSorting(device, sensor)
			var disabled = isSensorDisabled(device, sensor)
			var card = $(`<div class="card my-3 card-big" deviceId="${device.id}" sensorId="${sensor.id}" chartColor="${randomColor()}" sorting="${sorting}">
							<div class="card-body">
								<h4 class="card-title" contenteditable="true">${title}</h4>
								<p class="card-text">Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
								<canvas></canvas>
							</div>
						</div>`)
			var label = $(`<label class="list-group-item list-group-item-action" deviceId="${device.id}" sensorId="${sensor.id}" sorting="${sorting}">
								<span class="custom-control custom-checkbox">
									<input type="checkbox" class="custom-control-input hidebox" ${disabled ? '' : 'checked'}>
									<span class="custom-control-label titlespan">${title}</span>
								</span>
							</label>`)
			labels.append(label)
			cards.append(card)
			if (disabled) card.hide()
		}
	}
	sortElements()
	updateAllCanvas()
}

function sortElements() {
	var comparator = function (a, b) {
		var x = parseInt($(a).attr('sorting'))
		var y = parseInt($(b).attr('sorting'))
		return (x < y) ? -1 : (x > y) ? 1 : 0
	}
	var labels = $('#menu-list')
	labels.append(labels.children().sort(comparator))
	var cards = $('#main-cards')
	cards.append(cards.children().sort(comparator))
}

function updateAllCanvas() {
    $('canvas').each(function(i, element) {
        var canvas = $(element)
        var card = canvas.parent().parent()
        var deviceId = card.attr('deviceId')
        var sensorId = card.attr('sensorId')
        var chartColor = card.attr('chartColor')
        var device = Model.devices.filter(x => x.id == deviceId)[0]
        var sensor = device.sensors.filter(x => x.id == sensorId)[0]
        var begin = new Date()
        begin.setHours(begin.getHours() - 1)
        var end = new Date()
        var resolutionSeconds = Math.floor((end - begin) / 60000)
        Api.queryData(device.id, sensor.id, begin, end, resolutionSeconds)
            .then(res => {
				res.datapoints = res.datapoints || []
                var normalized = res.datapoints.map(data => ({ x: data[0], y: data[1] }))
                displayChart(canvas, normalized, sensor.unit, chartColor)
            })
            .catch(err => {
                console.log(err)
            })
    })
}

function cardTitleUpdated() {
    var element = $(this)
    var title = element.text()
    var card = element.parent().parent()
    var deviceId = card.attr('deviceId')
    var sensorId = card.attr('sensorId')
    var device = Model.devices.filter(x => x.id == deviceId)[0]
    var sensor = device.sensors.filter(x => x.id == sensorId)[0]
    setMeasurementTitle(device, sensor, title)
}

function hideBoxChanged() {
    var element = $(this)
    var value = !element.is(':checked')
    var card = element.parent().parent()
    var deviceId = card.attr('deviceId')
    var sensorId = card.attr('sensorId')
    var device = Model.devices.filter(x => x.id == deviceId)[0]
    var sensor = device.sensors.filter(x => x.id == sensorId)[0]
    setSensorDisabled(device, sensor, value)
}

function onElementReSorted (event, ui) {
	ui.item.parent().children().each(function(i, element) {
		var label = $(element)
		var deviceId = label.attr('deviceId')
        var sensorId = label.attr('sensorId')
		var device = Model.devices.filter(x => x.id == deviceId)[0]
    	var sensor = device.sensors.filter(x => x.id == sensorId)[0]
		setMeasurementSorting(device, sensor, i)
		$(`div[deviceId=${device.id}][sensorId=${sensor.id}]`).attr('sorting', i)
		$(`label[deviceId=${device.id}][sensorId=${sensor.id}]`).attr('sorting', i)
	})
	sortElements()
}

function bindEvents() {
    $(document).on('blur', '.card-title', cardTitleUpdated);
    $(document).on('change', '.hidebox', hideBoxChanged)
}

$(function() {
	$('#menu-list').sortable({ update: onElementReSorted });
	//enabling drag 'n drop on the cards bricks the re-naming
	//$('#main-cards').sortable({ update: onElementReSorted });
	loadModel()
    ensureConnection(_ => {
        loadCards()
        bindEvents()
        setInterval(updateAllCanvas, 5000)
    })
})