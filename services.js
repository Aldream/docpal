var modelsensors = require("./model/sensors");
// Models:
//var modelXXX = require("./model/xxx");

var logger = require("./logger");

function error(code, resp) {
	var result = {};
	result.error = {};
	result.error.code = code;

	switch(code) {
		case 0:
			result.error.msg = "Couldn't parse the JSON";
			break;
		case 1:
			result.error.msg = "Unsupported HTTP/1.1 method for this service";
			break;
		default:
			esult.error.msg = "Unknow error";
}

logger.error("Error function with message : " + result.error.msg);
var jsonResult = JSON.stringify(result);
	resp.end(jsonResult);
}

// Adds the header indicating all went sucessfully.
function writeHeaders(resp) {
	resp.header("Access-Control-Allow-Origin","*");
}

function parseRequest(req, names) {
	request = {}
	for (var n in names) {
		request[names[n]] = req.param(names[n], null);
	}
	return request;
}


