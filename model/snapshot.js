/**
 * =================
 * SCHEMA - Snapshot
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a version of the shared file at a certain moment.
 */

var SnapshotSchema = new Schema({
	_id			: Schema.Types.ObjectId,
	blob  		: Buffer,
	idLastOp   	: {type : String, default : '', trim : true},
	param  		: {type : Schema.ObjectId, ref : 'Operation'},
	timestamp	: {type : Date, default : Date.now}
})

mongoose.model('Snapshot', SnapshotSchema)
