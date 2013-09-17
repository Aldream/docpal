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
		// Text Operations (char-wise):
			/**
			 * cAdd
			 * ====
			 * Adds a given character at the chosen position.
			 * Parameters in param:
			 *	- pos (int): 	Position
			 *	- char (Char):	Character to add
			 * Output: /
			 */
			'cAdd': function addChar(data, param) { },
			/**
			 * cDel
			 * ====
			 * Deletes the character at the chosen position (shifting the following chars)
			 * Parameters in param:
			 *	- pos (int): 	Position of the deletion
			 * Output: /
			 */
			'cDel' function delChar(data, param) { }
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
	 *	- localOp (JSON obj): 	Local message
	 *	- incoOp (JSON obj):	Incoming message
	 * Output: Couple of modified messages, leading to the same final state.
	 */	
	xform : function(localOp, incoOp) {
	
	}
};