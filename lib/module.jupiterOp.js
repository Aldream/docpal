/**
 * =================
 * OBJECT - JupiterOp
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines the operations handled by the system, and manages their application and potential conflicts.
 */

var JupiterOp = {

	/**
	 * Table identifying the various operation handled by the system
	 */
	operationsTable: {
		// Null Operation (No-change)
			/**
			 * noOp
			 * ====
			 * Does nothing (when the incoming change has already be done locally for instance)
			 * Parameters in param: /
			 * Output: /
			 */
			'noOp': function doNothing(data, param) {
				return data;
			},
		
		// Text Operations (char-wise):
			/**
			 * cIns
			 * ====
			 * Inserts a given character at the chosen position.
			 * Parameters in param:
			 *	- pos (int): 	Position
			 *	- char (Char):	Character to add
			 *	- id (String):	ID of the note
			 * Output: /
			 */
			'cIns': function addChar(data, param) {
				var	pos = JupiterOp.secureGetParam(param, 'pos'),
					c = JupiterOp.secureGetParam(param, 'char'),
					id = JupiterOp.secureGetParam(param, 'id');
				if (pos !== null && c !== null) {
					data[id].text = data[id].text.slice(0,pos) + c + data[id].text.slice(pos);
				}
				return data;
			},
			/**
			 * cDel
			 * ====
			 * Deletes the character at the chosen position (shifting the following chars)
			 * Parameters in param:
			 *	- pos (int): 	Position of the deletion
			 *	- id (String):	ID of the note
			 * Output: /
			 */
			'cDel': function delChar(data, param) {
				var	pos = JupiterOp.secureGetParam(param, 'pos'),
					id = JupiterOp.secureGetParam(param, 'id');
				if (pos !== null) {
					data[id].text = data[id].text.slice(0,pos) + data[id].text.slice(pos+1);
				}
				return data;
			},

		// Note Operations (char-wise):
			/**
			 * nAdd
			 * ====
			 * Inserts a note.
			 * Parameters in param:
			 *	- x (int): 		X-Position
			 *	- y (int): 		Y-Position
			 *	- text (String): 	Content
			 *	- type (String):	Type of note
			 *	- id (String):		Unique ID
			 * Output: /
			 */
			'nAdd': function addNote(data, param) {
				var	x = JupiterOp.secureGetParam(param, 'x'),
					y = JupiterOp.secureGetParam(param, 'y'),
					text = JupiterOp.secureGetParam(param, 'text'),
					type = JupiterOp.secureGetParam(param, 'type'),
					id = JupiterOp.secureGetParam(param, 'id');
				if (x !== null && y !== null && text !== null && type !== null && id !== null) {
					data[id] = {
						x: x,
						y: y,
						text: text,
						type: type
					};
;
				}
				return data;
			},
			/**
			 * nDel
			 * ====
			 * Deletes the note
			 * Parameters in param:
			 *	- id (String):	Unique ID
			 * Output: /
			 */
			'nDel': function delNote(data, param) {
				var	id = JupiterOp.secureGetParam(param, 'id');
				if (id !== null) {
					delete data[id];
				}
				return data;
			},
			/**
			 * nDrag
			 * ====
			 * Drags/Moves the note
			 * Parameters in param:
			 *	- id (String):	Unique ID
			 *	- x (int): 		X-Position
			 *	- y (int): 		Y-Position
			 * Output: /
			 */
			'nDrag': function dragNote(data, param) {
				var	x = JupiterOp.secureGetParam(param, 'x'),
					y = JupiterOp.secureGetParam(param, 'y'),
					id = JupiterOp.secureGetParam(param, 'id');
				if (x !== null && y !== null && id !== null) {
					data[id].x = x;
					data[id].y = y;
				}
				return data;
			}
	},

	/**
	 * apply
	 * ====
	 * Applies the operation defined by the given message
	 * Parameters:
	 *	- data (string): 	Data to modify
	 *	- msg (JSON obj):	Message containing the operation to apply
	 * Output: Modified data
	 */
	apply : function(data, msg) {
		return this.operationsTable[msg.op](data, msg.param);
	},

	/**
	 * xform
	 * ====
	 * Resolves the conflicts between messages generated from the same starting state.
	 * Returns the transformed messages allowing the two parties to reach the same final state.
	 * Parameters:
	 *	- localMsg (JSON obj): 	Local message
	 *	- incoMsg (JSON obj):	Incoming message
	 * Output: / (Input operations are directly modified)
	 */	
	xform : function(localMsg, incoMsg) {
		// If on different notes, then no collision:
		var	idLoc = JupiterOp.secureGetParam(localMsg.param, 'id'),
			idInc = JupiterOp.secureGetParam(incoMsg.param, 'id');
		if (idLoc === null || idInc === null || idLoc != idInc) { return; }

		// cIns VS cIns
		if (localMsg.op == 'cIns' && incoMsg.op == 'cIns') {
			var	posLoc = JupiterOp.secureGetParam(localMsg.param, 'pos'),
				posInc = JupiterOp.secureGetParam(incoMsg.param, 'pos');
			if (posLoc === null || posInc === null) { return; }
			
			if (posLoc >= posInc) localMsg.param.pos++; // we arbitrarily decide to place the char from the server first. 
			else incoMsg.param.pos++;
		}
		
		// cDel VS cDel
		else if (localMsg.op == 'cDel' && incoMsg.op == 'cDel') {
			var	posLoc = JupiterOp.secureGetParam(localMsg.param, 'pos'),
				posInc = JupiterOp.secureGetParam(incoMsg.param, 'pos');
			if (posLoc === null || posInc === null) { return; }
			
			if (posLoc > posInc) localMsg.param.pos--; 
			else if (posLoc < posInc) incoMsg.param.pos--;
			else {
				localMsg.op = incoMsg.op = 'noOp';
				localMsg.param = incoMsg.param = null;
			}	
		}
		
		// cDel VS cIns
		else if (localMsg.op == 'cDel' && incoMsg.op == 'cIns') {
			var	posLoc = JupiterOp.secureGetParam(localMsg.param, 'pos'),
				posInc = JupiterOp.secureGetParam(incoMsg.param, 'pos');
			if (posLoc === null || posInc === null) { return; }
			
			if (posLoc >= posInc) localMsg.param.pos++; 
			else incoMsg.param.pos--;	
		}
		
		// cIns VS cDel
		else if (localMsg.op == 'cIns' && incoMsg.op == 'cDel') {
			var	posLoc = JupiterOp.secureGetParam(localMsg.param, 'pos'),
				posInc = JupiterOp.secureGetParam(incoMsg.param, 'pos');
			if (posLoc === null || posInc === null) { return; }
			
			if (posLoc > posInc) localMsg.param.pos--; 
			else incoMsg.param.pos++;	
		}

		// nDel VS (cDel | cIns)
		else if (localMsg.op == 'nDel' && (incoMsg.op == 'cDel' || incoMsg.op == 'cIns')) {
			// We cancel the deletion of the note:
			localMsg.op = 'noOp';
			localMsg.param = null;
		}

		// (cDel | cIns) VS nDel
		else if (incoMsg.op == 'nDel' && (localMsg.op == 'cDel' || localMsg.op == 'cIns')) {
			// We cancel the deletion of the note:
			incoMsg.op = 'noOp';
			incoMsg.param = null;
		}
		
	},

	/**
	 * secureGetParam
	 * ====
	 * Checks the parameters object to get the wanted value.
	 * If this parameter isn't find, an error is thrown.
	 * Parameters:
	 *	- params (JSON obj): 	Parameters object
	 *	- name (string):		Name of the wanted parameter
	 * Output: Value of the parameter if found
	 */	
	secureGetParam: function(params, name) {
		if (typeof params !== 'object' || params[name] === undefined) {
			// TODO: Handle the error / Report it
			//alert('Uncorrect Operation!');
			console.log('Uncorrect Operation!');
			return null;
		}
		else {
			return params[name];
		}
		
		
	}
};

exports.JupiterOp = JupiterOp;
