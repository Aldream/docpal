/**
 * =================
 * SCHEMA - Operation
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a Jupiter operation affecting the system.
 */

var OperationSchema = new Schema({
	_id			: Schema.Types.ObjectId,						// Primary Key
	idUser  	: {type : Schema.ObjectId, ref : 'User'},		// Foreign key to the user responsible for the operation
	type   		: {type : String, default : '', trim : true},	// Type of operation
	param  		: Schema.Types.Mixed,							// Parameters of the operation
	timestamp	: {type : Date, default : Date.now}				// Date
})

mongoose.model('Operation', OperationSchema)
