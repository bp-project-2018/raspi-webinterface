var Api = {

	token: null,
	timeout: 30000,
	enpoint: '',

	setToken: function(token) {
		Api.token = token
	},

	request: function(method, url, data) {
		return new Promise((resolve, reject) => {
			var responseHandler = (res) => {
				if (res.err) reject(res.err)
				else resolve(res)
			}
			$.ajax({
				url: Api.enpoint + url,
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
		return Api.get('/api/register', {}, callback)
	},

	getDevices: function () {
		return Api.get('/api/getDevices', {}, callback)
	},

	getData: function (deviceId, measurementId, beginDate, endDate, resolutionSeconds) {
		return Api.post('/api/getData', { DeviceID: deviceId, MeasurementID: measurementId, BeginDate: beginDate, EndDate: endDate, ResolutionSeconds: resolutionSeconds }, callback)
	},

	updateDeviceName: function (deviceId, newName) {
		return Api.post('/api/updateDeviceName', { DeviceID: deviceId, NewName: newName }, callback)
	}

}
