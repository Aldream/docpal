/**
 * =================
 * SCHEMA - Operation
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a Jupiter operation affecting the system.
 */
module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var OperationSchema = new Schema({
		_id		: Schema.Types.ObjectId,			// Unique ID
		idUser  	: {type : Schema.ObjectId, ref : 'User'},	// ID of the user who generated this operation
		type   		: {type : String, default : '', trim : true},	// Type of operation ('cIns', 'nAdd', ...)
		param  		: Schema.Types.Mixed,				// Parameters of the operation
		timestamp	: {type : Date, default : Date.now}		// Timestamp when the operation was generated
	})

	this.model = mongoose.model('Operation', OperationSchema);

	return this;
}
