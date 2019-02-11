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
	var ctx = document.getElementById('canvas').getContext('2d');
	var datapoints = [0, 20, 20, 60, 60, 120, 7, 180, 120, 125, 105, 110, 170];
	var config = {
		type: 'line',
		data: {
			labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
			datasets: [{
				label: 'Demo',
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
				text: 'Data'
			},
			tooltips: {
				mode: 'index'
			},
			scales: {
				xAxes: [{
					display: true,
					scaleLabel: {
						display: true
					}
				}],
				yAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Value'
					},
					ticks: {
						suggestedMin: -10,
						suggestedMax: 200,
					}
				}]
			}
		}
	};
	window.myLine = new Chart(ctx, config);
});

