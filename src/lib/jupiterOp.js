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
				//return data;
			},
		
		// Text Operations (char-wise):
			/**
			 * cIns
			 * ====
			 * Inserts a given character at the chosen position.
			 * Parameters in param:
			 *	- pos (int): 	Position
			 *	- char (Char):	Character to add
			 * Output: /
			 */
			'cIns': function addChar(data, param) {
				var	pos = secureGetParam(param, 'pos'),
					c = secureGetParam(param, 'char');
				if (pos !== null && c !== null) {
					data = data.slice(0,pos) + c + data.slice(pos);
				}
				//return data;
			},
			/**
			 * cDel
			 * ====
			 * Deletes the character at the chosen position (shifting the following chars)
			 * Parameters in param:
			 *	- pos (int): 	Position of the deletion
			 * Output: /
			 */
			'cDel' function delChar(data, param) {
				var	pos = secureGetParam(param, 'pos');
				if (pos !== null) {
					data = data.slice(0,pos) + data.slice(pos+1);
				}
				//return data;
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
		// cIns VS cIns
		if (localMsg.op == 'cIns' && incoMsg.op == 'cIns') {
			var	posLoc = secureGetParam(localMsg.param, 'pos'),
				posInc = secureGetParam(incoMsg.param, 'pos');
			if (posLoc === null || posInc === null) { return; }
			
			if (posLoc >= posInc) localMsg.param.pos++; // we arbitrarily decide to place the char from the server first. 
			else incoMsg.param.pos++;
		}
		
		// cDel VS cDel
		else if (localMsg.op == 'cDel' && incoMsg.op == 'cDel') {
			var	posLoc = secureGetParam(localMsg.param, 'pos'),
				posInc = secureGetParam(incoMsg.param, 'pos');
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
			var	posLoc = secureGetParam(localMsg.param, 'pos'),
				posInc = secureGetParam(incoMsg.param, 'pos');
			if (posLoc === null || posInc === null) { return; }
			
			if (posLoc >= posInc) localMsg.param.pos++; 
			else incoMsg.param.pos--;	
		}
		
		// cIns VS cDel
		else if (localMsg.op == 'cIns' && incoMsg.op == 'cDel') {
			var	posLoc = secureGetParam(localMsg.param, 'pos'),
				posInc = secureGetParam(incoMsg.param, 'pos');
			if (posLoc === null || posInc === null) { return; }
			
			if (posLoc > posInc) incoMsg.param.pos++; 
			else localMsg.param.pos--;	
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
		if (typeof params !== 'Object' || params[name] === undefined) {
			// TODO: Handle the error / Report it
			alert('Uncorrect Operation!');
			return null;
		}
		else {
			return params[name];
		}
		
		
	}
};