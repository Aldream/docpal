var logger = require("./logger");

module.exports = function(mongoose, modelUser, modelOperation, modelNote, modelSnapshot) {

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
	 * USER - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createUser
	 * ====
	 * Create a user (only if her/his username is unique).
	 * Parameters:
	 *	- username (String): 		User name
	 *	- password (String): 		Password
	 *	- cb (Function(bool)):		Callback
	 */
	function createUser(username, password, cb) {
		modelUser.findOne({ username: username }, function(err, user) {
			if (err || user) return cb(false); // User already exists
			
			var user = new modelUser({username: username, password: password});
			user.save(function(err) {
				if (err) cb(false);
				else cb (true);
			});
		});
	}
	function serviceCreateUser(req, resp) {
		logger.info("<Service> CreateUser.");
		var userData = parseRequest(req, ['username', 'password']);
		
		writeHeaders(resp);
		createUser(userData.username, userData.password, function(success) { resp.end(JSON.stringify({ success: success })); });
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
		modelNote.update({ id: id }, noteData, { upsert: true }, function (err, numberAffected, raw) {
			if (err) { logger.error(err); return cb(note, false); }
			else { logger.info('<MongoDB> Note #'+id+' saved: '+ raw); return cb(note, true); }
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

	this.rest = {};
	this.rest.saveOperation = serviceSaveOperation;
	this.rest.saveNote = serviceSaveNote;
	this.rest.getLastSnapshot = serviceGetLastSnapshot;
	this.rest.createUser = serviceCreateUser;

	this.local = {};
	this.local.saveOperation = saveOperation;
	this.local.readAllActiveNotes = readAllActiveNotes;
	this.local.updateNoteText = updateNoteText;
	this.local.updateNoteState = updateNoteState;
	this.local.updateNoteDrag = updateNoteDrag;
	this.local.saveNote = saveNote;
	return this;
};
