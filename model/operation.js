/**
 * =================
 * SCHEMA - Operation
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a Jupiter operation affecting the system.
 */

var OperationSchema = new Schema({
	_id			: Schema.Types.ObjectId,
	idUser  	: {type : Schema.ObjectId, ref : 'User'},
	type   		: {type : String, default : '', trim : true},
	param  		: Schema.Types.Mixed,
	timestamp	: {type : Date, default : Date.now}
})

mongoose.model('Operation', OperationSchema)
