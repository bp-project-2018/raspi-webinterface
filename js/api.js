var Api = {

	token: null,
	timeout: 30000,
	endpoint: '',

	setToken: function(token) {
		Api.token = token
	},

	request: function(method, url, data) {
		console.log(Api.endpoint + url)
		return new Promise((resolve, reject) => {
			var responseHandler = (res) => {
				if (res.err) reject(res.err)
				else resolve(res)
			}
			$.ajax({
				url: Api.endpoint + url,
				type: method,
				data: JSON.stringify(data),
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				headers: { 'Authorization': Api.token },
				success: responseHandler,
				error: reject,
				timeout: Api.timeout
			});
		})
	},

	get: function(route, data) {
		return Api.request('GET', route, data)
	},

	post: function(route, data) {
		return Api.request('POST', route, data)
	},

	getStatus: function () {
		return Api.get('/api/status')
	},

	requestToken: function () {
		return Api.get('/api/register', {})
	},

	getDevices: function () {
		return Api.get('/api/getDevices', {})
	},

	queryData: function (deviceId, measurementId, beginDate, endDate, resolutionSeconds) {
		return Api.post('/api/queryData', { deviceID: deviceId, sensorID: measurementId, beginUnix: Math.floor(beginDate.getTime()/1000), endUnix: Math.floor(endDate.getTime()/1000), resolutionSeconds: Math.floor(resolutionSeconds) })
	},

	queryDataRelative: function (deviceId, measurementId, beginRelativeSeconds, endRelativeSeconds, resolutionSeconds) {
		return Api.post('/api/queryDataRelative', { deviceID: deviceId, sensorID: measurementId, beginRelativeSeconds: Math.floor(beginRelativeSeconds), endRelativeSeconds: Math.floor(endRelativeSeconds), resolutionSeconds: Math.floor(resolutionSeconds) })
	}

}
