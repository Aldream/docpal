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
				if (pos !== null && c !== null && id !== null) {
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
				if (pos !== null && id !== null) {
					data[id].text = data[id].text.slice(0,pos) + data[id].text.slice(pos+1);
					if (data[id].state == 0) { // If the note was considered deleted, we "restore" it:
						data[id].state = 10; // 10 = "to be restored locally"
					}
				}
				return data;
			},
		
		// Text Operations (string-wise):
			/**
			 * sIns
			 * ====
			 * Inserts a given string at the chosen position.
			 * Parameters in param:
			 *	- pos (int): 	Position
			 *	- str (String):	String to add
			 *	- id (String):	ID of the note
			 * Output: /
			 */
			'sIns': function addString(data, param) {
				var	pos = JupiterOp.secureGetParam(param, 'pos'),
					str = JupiterOp.secureGetParam(param, 'str'),
					id = JupiterOp.secureGetParam(param, 'id');
				if (pos !== null && str !== null && id !== null) {
					data[id].text = data[id].text.slice(0,pos) + str + data[id].text.slice(pos);
					if (data[id].state == 0) { // If the note was considered deleted, we "restore" it:
						data[id].state = 10; // 10 = "to be restored locally"
					}
				}
				return data;
			},
			/**
			 * sDel
			 * ====
			 * Deletes ta given number of characters from the chosen position (shifting the following chars)
			 * Parameters in param:
			 *	- pos (int): 	Position of the deletion
			 *	- size (int): 	Number of characters to delete
			 *	- id (String):	ID of the note
			 * Output: /
			 */
			'sDel': function delString(data, param) {
				var	pos = JupiterOp.secureGetParam(param, 'pos'),
					size = JupiterOp.secureGetParam(param, 'size'),
					id = JupiterOp.secureGetParam(param, 'id');
				if (pos !== null && id !== null && size !== null) {
					data[id].text = data[id].text.slice(0,pos) + data[id].text.slice(pos+size);
					if (data[id].state == 0) { // If the note was considered deleted, we "restore" it:
						data[id].state = 10; // 10 = "to be restored locally"
					}
				}
				return data;
			},

		// Note Operations :
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

		var	txtOpInc = incoMsg.op == 'cDel' || incoMsg.op == 'cIns' || incoMsg.op == 'sDel' || incoMsg.op == 'sIns',
			txtOpLoc = localMsg.op == 'cDel' || localMsg.op == 'cIns' || localMsg.op == 'sDel' || localMsg.op == 'sIns';
		
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
		// sIns VS sIns
		if (localMsg.op == 'sIns' && incoMsg.op == 'sIns') {
			var	posLoc = JupiterOp.secureGetParam(localMsg.param, 'pos'),
				posInc = JupiterOp.secureGetParam(incoMsg.param, 'pos'),
				sizeLoc = JupiterOp.secureGetParam(localMsg.param, 'str').length,
				sizeInc = JupiterOp.secureGetParam(incoMsg.param, 'str').length;
			if (posLoc === null || posInc === null || sizeLoc === null || sizeInc === null) { return; }
			
			if (posLoc >= posInc) localMsg.param.pos += sizeInc; // we arbitrarily decide to place the char from the server first. 
			else incoMsg.param.pos += sizeLoc;
		}
		
		// sDel VS sDel
		else if (localMsg.op == 'sDel' && incoMsg.op == 'sDel') {
			var	posLoc = JupiterOp.secureGetParam(localMsg.param, 'pos'),
				posInc = JupiterOp.secureGetParam(incoMsg.param, 'pos'),
				sizeLoc = JupiterOp.secureGetParam(localMsg.param, 'size'),
				sizeInc = JupiterOp.secureGetParam(incoMsg.param, 'size');
			if (posLoc === null || posInc === null || sizeLoc === null || sizeInc === null) { return; }
			
			var	posEndLoc = posLoc + sizeLoc,
				posEndInc = posInc + sizeInc;
			if (posInc >= posEndLoc) incoMsg.param.pos -= sizeLoc; 
			else if (posLoc >= posEndInc) localMsg.param.pos -= sizeInc;
			else if (posInc >= posLoc) {
				if (posEndInc <= posEndLoc) { // Everything incoMsg was supposed to delete as already been by localMesg.
					localMsg.param.size = sizeLoc-sizeInc;
					if (localMsg.param.size == 0) { localMsg.op = 'noOp'; localMsg.param = null; }
					incoMsg.op = 'noOp';
					incoMsg.param = null;
				}
				else {	// Par of what incoMsg was supposed to delete as already been by localMesg.
					incoMsg.param.size = posEndInc - posEndLoc;
					incoMsg.param.pos = posLoc;
					localMsg.param.size = sizeLoc - (posEndLoc - posInc);
				}
			}
			else { // if (posInc < posLoc)
				if (posEndLoc <= posEndInc) {
					incoMsg.param.size = sizeInc-sizeLoc;
					if (localMsg.param.size == 0) { incoMsg.op = 'noOp'; incoMsg.param = null; }
					localMsg.op = 'noOp';
					localMsg.param = null;
				}
				else {
					localMsg.param.size = posEndLoc - posEndInc;
					localMsg.param.pos = posInc;
					incoMsg.param.size = sizeInc - (posEndInc - posLoc);
				}
			}	
		}
		
		// sDel VS sIns
		else if (localMsg.op == 'sDel' && incoMsg.op == 'sIns') {
			var	posLoc = JupiterOp.secureGetParam(localMsg.param, 'pos'),
				posInc = JupiterOp.secureGetParam(incoMsg.param, 'pos'),
				sizeLoc = JupiterOp.secureGetParam(localMsg.param, 'size'),
				sizeInc = JupiterOp.secureGetParam(incoMsg.param, 'str').length;
			if (posLoc === null || posInc === null || sizeLoc === null || sizeInc === null) { return; }
			
			var	posEndLoc = posLoc + sizeLoc,
				posEndInc = posInc + sizeInc;
			if (posInc <= posLoc) localMsg.param.pos += sizeInc; 
			else if (posInc >= posEndLoc) incoMsg.param.pos -= sizeLoc;	
			else { // The insertion is done inside the deleted text. So we still insert there, and cut the delete operation in two parts, for each side of the insertion.
					localMsg.pseudoOp = { oMes: localMsg.oMes, nMes: localMsg.nMes, op: 'sDel', param: {id: idLoc, pos: posEndInc, size: sizeLoc - (posInc - posLoc)} }; // We add a sDel operation to delete the right side.
					// ... and we use the current local sDel to delete the left side:
					localMsg.param.size = posInc - posLoc;
					incoMsg.param.pos = posLoc;
					localMsg.param.pos = posLoc;	
			}
		}
		
		// sIns VS sDel
		else if (localMsg.op == 'sIns' && incoMsg.op == 'sDel') {
			
			var	posLoc = JupiterOp.secureGetParam(localMsg.param, 'pos'),
				posInc = JupiterOp.secureGetParam(incoMsg.param, 'pos'),
				sizeLoc = JupiterOp.secureGetParam(localMsg.param, 'str').length,
				sizeInc = JupiterOp.secureGetParam(incoMsg.param, 'size');
			if (posLoc === null || posInc === null || sizeLoc === null || sizeInc === null) { return; }
			
			var	posEndLoc = posLoc + sizeLoc,
				posEndInc = posInc + sizeInc;
			if (posLoc <= posInc) incoMsg.param.pos += sizeLoc; 
			else if (posLoc >= posEndInc) localMsg.param.pos -= sizeInc;	
			else { // The insertion is done inside the deleted text. So we still insert there, and cut the delete operation in two parts, for each side of the insertion.
					incoMsg.pseudoOp = { oMes: incoMsg.oMes, nMes: incoMsg.nMes, op: 'sDel', param: {id: idInc, pos: posEndLoc, size: sizeInc - (posLoc - posInc)} }; // We add a sDel operation to delete the right side.
					// ... and we use the current local sDel to delete the left side:
					incoMsg.param.size = posLoc - posInc;
					localMsg.param.pos = posInc;
					incoMsg.param.pos = posInc;	
			}
		}

		// nDel VS (cDel | cIns | sDel | sIns)
		else if (localMsg.op == 'nDel' && txtOpInc) {
			// We don't apply the deletion of the note:
			localMsg.op = 'noOp';
			localMsg.param = null;
		}

		// (cDel | cIns | sDel | sIns) VS nDel
		else if (incoMsg.op == 'nDel' && txtOpLoc) {
			// We cancel the deletion of the note:
			incoMsg.op = 'noOp';
			incoMsg.param = null;
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

		// nAdd VS (cDel | cIns | sDel | sIns)
		else if (localMsg.op == 'nAdd' && txtOpInc) {
			// The note must be already created to edit its content...
			localMsg.op = 'noOp';
			localMsg.param = null;
		}


		// (cDel | cIns | sDel | sIns) VS nAdd
		else if (incoMsg.op == 'nAdd' && txtOpLoc) {
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

		// nDrag VS (cDel | cIns | sDel | sIns)
		else if (localMsg.op == 'nDrag' && txtOpInc) {
			// No collision
		}


		// (cDel | cIns | sDel | sIns) VS nDrag
		else if (incoMsg.op == 'nDrag' && txtOpLoc) {
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
		if (params == null || typeof params !== 'object' || typeof params[name] === 'undefined') {
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
