var mongoose = require('mongoose');
var logger = require("./logger");

// Connecting to the DB:
mongoose.connect('mongodb://localhost/docpal', function(err) {
  if (err) { logger.error(err); }
});

var modelOperation = require("./model/operation")(mongoose).model;
//var modelUser = require("./model/user")(mongoose).model;
var modelNote = require("./model/note")(mongoose).model;
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
 * ------------------------------------------
 * NOTE - CRUD Services
 * ------------------------------------------
 */

/**
 * saveNote
 * ====
 * Save an note in the DB.
 * Parameters:
 *	- id (String): 			ID of the note
 *	- noteData (Object): 		Data of the note
 *	- cb (Function(Note, bool)):	Callback
 * Output: true if success, or false
 */
function saveNote(id, noteData, cb) {
	var note = new modelNote(noteData);
	modelNote.update({ id: noteData.id }, noteData, { upsert: true }, function (err, numberAffected, raw) {
		if (err) { logger.error(err); return cb(note, false); }
		else { logger.info('<MongoDB> Note #'+note.id+' saved: '+ raw); return cb(note, true); }
	});
}
function serviceSaveNote(req, resp) {
	logger.info("<Service> SaveNote.");
	
	var noteData = parseRequest(req, ['id', 'type', 'text', 'x', 'y', 'timestampLastOp', 'state']);
	writeHeaders(resp);
	saveNote(note, function(noteData, success) { resp.end(JSON.stringify({ success: success })); });
}

/**
 * updateNoteText
 * ====
 * Update the text field of a note.
 * Parameters:
 *	- id (String):		ID of the note to update
 *	- txt (String):		New content
 */
function updateNoteText(id, txt) {
	modelNote.update({ id: id }, {text: txt}, {multi: false}, function (err, numberAffected, raw) {
		if (err) { logger.error(err); }
		else { logger.info('<MongoDB> Note #'+id+' updated (text): '+ raw); }
	});
}

/**
 * readAllActiveNotes
 * ====
 * Returns all the active (state != 0 'deleted') notes.
 * Parameters:
 *	- cb (Function(error, results)):	Callback
 */
function readAllActiveNotes(cb) {
	modelNote.find().where('state').gt(0).exec(cb);
}

/**
 * updateNoteState
 * ====
 * Update the state field of a note.
 * Parameters:
 *	- id (String):		ID of the note to update
 *	- state (int):		New state
 */
function updateNoteState(id, state) {
	modelNote.update({ id: id }, {state: state}, {multi: false}, function (err, numberAffected, raw) {
		if (err) { logger.error(err); }
		else { logger.info('<MongoDB> Note #'+id+' updated (state): '+ raw); }
	});
}

/**
 * updateNoteDrag
 * ====
 * Update the position and state field of a note being dragged.
 * Parameters:
 *	- id (String):		ID of the note to update
 *	- x (int):		New X position
 *	- y (int):		New Y position
 */
function updateNoteDrag(id, x, y) {
	modelNote.update({ id: id }, {state: 2, x: x, y:y}, {multi: false}, function (err, numberAffected, raw) {
		if (err) { logger.error(err); }
		else { logger.info('<MongoDB> Note #'+id+' updated (state + x + y -> drag): '+ raw); }
	});
}



/*
 * ------------------------------------------
 * OPERATION - CRUD Services
 * ------------------------------------------
 */

/**
 * saveOperation
 * ====
 * Save an operation in the DB.
 * Parameters:
 *	- opData (Object):			Data of the operation
 *	- cb (Function(Operation, bool)):	Callback
 * Output: true if success, or false
 */
function saveOperation(opData, cb) {
	// TO DO : opData.idUser = new mongoose.Types.ObjectId(opData.idUser);
	opData.idUser = new mongoose.Types.ObjectId();
	var op = new modelOperation(opData);
	op.save(function (err) {
		if (err) { logger.error(err); return cb(op, false);}
		else { logger.info('<MongoDB> Operation from User #'+opData.idUser+' saved.'); return cb(op, true); }
	});
}
function serviceSaveOperation(req, resp) {
	logger.info("<Service> SaveOperation.");
	var opData = parseRequest(req, ['idUser', 'type', 'param', 'timestamp']);
	
	writeHeaders(resp);
	saveOperation(opData, function(note, success) { resp.end(JSON.stringify({ success: success })); });
}


/*
 * ------------------------------------------
 * SERVICE GetLastSnapshot
 * Gets the last version of the document.
 * ------------------------------------------
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

exports.rest = {};
exports.rest.saveOperation = serviceSaveOperation;
exports.rest.saveNote = serviceSaveNote;
exports.rest.getLastSnapshot = serviceGetLastSnapshot;

exports.local = {};
exports.local.saveOperation = saveOperation;
exports.local.readAllActiveNotes = readAllActiveNotes;
exports.local.updateNoteText = updateNoteText;
exports.local.updateNoteState = updateNoteState;
exports.local.updateNoteDrag = updateNoteDrag;
exports.local.saveNote = saveNote;

