$(function() {
	var token = localStorage.getItem('iot-bp-token')
	if (token) {
		Api.setToken(token)
		$('#tokenSpan').html(token + ' (from localstorage)')
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
	Api.setToken(false)
	localStorage.setItem('iot-bp-token', '')
	$('#tokenSpan').html('???')
})

$('#getToken').click(function() {
	Api.requestToken()
		.then(res => {
			var token = res.token
			Api.setToken(token)
			localStorage.setItem('iot-bp-token', token)
			$('#tokenSpan').html(token)
		})
		.catch(err => {
			$('#tokenSpan').html(err)
		})
})

$('#getDevices').click(function() {
	var list = $('#devicesList').empty()
	Api.getDevices()
		.then(res => {
			for (var device of res.devices) {
				list.append(`<li><b>${device.id}</b> with ${JSON.stringify(device.sensors)}</li>`)
			}
		})
		.catch(err => {
			list.append(`<li>Error: ${err}</li>`)
		})
})


$('#loadData').click(function() {
	var deviceId = $('#deviceId').val()
	var sensorId = $('#sensorId').val()
	var begin = Date.now()
	begin.setDate(begin.getDate() - 1)
	var end = Date.now()
	var resolutionSeconds = 60*60
	Api.queryData(deviceId, sensorId, begin, end, resolutionSeconds)
		.then(res => {
			// TODO!
			console.log(res)
			displayChart($('#canvas'), 'Demo Data', [{x:'2018-01-01 12:12:00', y:5},{x:'2018-01-02 12:12:00', y:1},{x:'2018-01-05 12:12:00', y:10}], '°C')
		})
		.catch(err => {
			console.log(err)
		})
})

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
