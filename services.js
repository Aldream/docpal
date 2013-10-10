var mongoose = require('mongoose');
var logger = require("./logger");

var modelOperation = require("./model/operation")(mongoose).model;
//var modelUser = require("./model/user")(mongoose).model;
var modelSnapshot = require("./model/snapshot")(mongoose).model;


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
		case 2:
			result.error.msg = "DB error";
			break;
		default:
			result.error.msg = "Unknow error";
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

/*
* SERVICE GetLastSnapshot
* Gets the last version of the document.
*/
function serviceGetLastSnapshot(req, resp) {
	logger.info("Service Get Last Snapshot.");
	writeHeaders(resp);

	var querySnap = modelSnapshot.findOne().sort({timestamp: -1}); // Find the most recent snapshot
	querySnap.exec(function (err, snapshot) {
		if (err) { error(2, resp); return; }
		
		var queryOp = modelOperation.findOne({ '_id': snapshot.idLastOp }); // Find the last operation applied to this version
		queryOp.exec(function (err, operation) {
			if (err) { error(2, resp); return; }
			var strResult = JSON.stringify({		
				blob  		: snapshot.blob,
				lastOp   	: {
					idUser  	: operation.idUser,
					type   		: operation.type,
					param  		: operation.param,
					timestamp	: operation.timestamp
				},
				timestamp	: snapshot.timestamp
			});
			resp.end(strResult);
		});
	});
}

exports.last_snapshot = serviceGetLastSnapshot;

