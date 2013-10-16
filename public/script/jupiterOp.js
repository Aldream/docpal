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
					if (data[id].state == 0) { // If the note was considered deleted, we "restore" it:
						data[id].state = 10; // 10 = "to be restored locally"
					}
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
					if (data[id].state == 0) { // If the note was considered deleted, we "restore" it:
						data[id].state = 10; // 10 = "to be restored locally"
					}
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
						type: type,
						state: 1
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
					data[id].state = 0;
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
					if (data[id].state == 0) { // If the note was considered deleted, we "restore" it:
						data[id].state = 20; // 20 = "to be restored locally and being dragged"
					}
					else { data[id].state = 2; }
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
			// We don't apply the deletion of the note:
			localMsg.op = 'noOp';
			localMsg.param = null;
		}

		// (cDel | cIns) VS nDel
		else if (incoMsg.op == 'nDel' && (localMsg.op == 'cDel' || localMsg.op == 'cIns')) {
			// We cancel the deletion of the note:
			incoMsg.op = 'noOp';
		}

		// nDel VS nDel
		else if (localMsg.op == 'nDel' && incoMsg.op == 'nDel') {
			// Nothing else to do...
			localMsg.op = incoMsg.op = 'noOp';
			localMsg.param = incoMsg.param = null;
		}

		// nDel VS nAdd
		else if (localMsg.op == 'nDel' && incoMsg.op == 'nAdd') {
			// Since the note must have been added to be deleted, we keep it deleted:
			incoMsg.op = 'noOp';
			incoMsg.param = null;
		}

		// nDel VS nDrag
		else if (localMsg.op == 'nDel' && incoMsg.op == 'nDrag') {
			// We cancel the deletion of the note:
			localMsg.op = 'noOp';
			localMsg.param = null;
		}

		// nAdd VS (cDel | cIns)
		else if (localMsg.op == 'nAdd' && (incoMsg.op == 'cDel' || incoMsg.op == 'cIns')) {
			// The note must be already created to edit its content...
			localMsg.op = 'noOp';
			localMsg.param = null;
		}


		// (cDel | cIns) VS nAdd
		else if (incoMsg.op == 'nAdd' && (localMsg.op == 'cDel' || localMsg.op == 'cIns')) {
			// The note must be already created to edit its content...
			incoMsg.op = 'noOp';
			incoMsg.param = null;
		}

		// nAdd VS nAdd
		else if (localMsg.op == 'nAdd' && incoMsg.op == 'nAdd') {
			// Nothing else to do...
			localMsg.op = incoMsg.op = 'noOp';
			localMsg.param = incoMsg.param = null;
		}

		// nAdd VS nDel
		else if (localMsg.op == 'nAdd' && incoMsg.op == 'nDel') {
			// Since the note must have been added to be deleted, we keep it deleted:
			localMsg.op = 'noOp';
			localMsg.param = null;
		}

		// nAdd VS nDrag
		else if (localMsg.op == 'nAdd' && incoMsg.op == 'nDrag') {
			// The note must be already created to edit its position...
			localMsg.op = 'noOp';
			localMsg.param = null;
		}

		// nDrag VS (cDel | cIns)
		else if (localMsg.op == 'nDrag' && (incoMsg.op == 'cDel' || incoMsg.op == 'cIns')) {
			// No collision
		}


		// (cDel | cIns) VS nDrag
		else if (incoMsg.op == 'nDrag' && (localMsg.op == 'cDel' || localMsg.op == 'cIns')) {
			// No collision
		}

		// nDrag VS nAdd
		else if (localMsg.op == 'nDrag' && incoMsg.op == 'nAdd') {
			// The note must be already created to edit its position...
			incoMsg.op = 'noOp';
			incoMsg.param = null;
		}

		// nDrag VS nDel
		else if (localMsg.op == 'nDrag' && incoMsg.op == 'nDel') {
			// We cancel the deletion of the note:
			incoMsg.op = 'noOp';
			incoMsg.param = null;
		}

		// nDrag VS nDrag
		else if (localMsg.op == 'nDrag' && incoMsg.op == 'nDrag') {
			// TO DO
		}
		
	},

	/**
	 * finalize
	 * ====
	 * Some effects from operations can stay pending until confirmation those operations have been acknowledged by everyone.
	 * This method is called for acknowledged operations to finalize them.
	 * Parameters:
	 *	- data (JSON obj): 	Original data
	 *	- msg (JSON obj): 	Message defining the operation
	 * Output: Updated data
	 */	
	finalize: function(data, msg) {
		if (msg.op == 'nDel') {
			var	id = JupiterOp.secureGetParam(msg.param, 'id');
			if (id !== null) {
				delete data[id];
			}
		}
		return data;
	},

	/**
	 * secureGetParam
	 * ====
	 * Checks the parameters object to get the wanted value.
	 * If this parameter isn't find, an error is thrown.
	 * Parameters:
	 *	- params (JSON obj): 	Parameters object
	 *	- name (string):	Name of the wanted parameter
	 * Output: Value of the parameter if found
	 */	
	secureGetParam: function(params, name) {
		if (params == null || typeof params !== 'object' || params[name] === undefined) {
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
