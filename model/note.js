/**
 * =================
 * SCHEMA - Note
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a sticky note.
 */
module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var NoteSchema = new Schema({
		id		: {type: String, unique: true},			// Unique ID
		state  		: {type : Number, default : 1},			// State of the note (1 = 'ok', 2 = 'dragged', 0 = 'deleted')
		type  		: {type : String, default : '', trim : true},	// Type of the note ('info', 'warning', ...)
		text  		: {type : String, default : '', trim : true},	// Content of the note
		x   		: {type : Number, default : 0},			// X Position
		y		: {type : Number, default : 0},			// Y Position
		timestampLastOp	: {type : Date, default : Date.now}		// Timestamp of its last update
	});

	this.model = mongoose.model('Note', NoteSchema);

	return this;
}
