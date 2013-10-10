/**
 * =================
 * SCHEMA - Snapshot
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a version of the shared file at a certain moment.
 */
module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var SnapshotSchema = new Schema({
		_id			: Schema.Types.ObjectId,
		blob  		: Buffer,
		idLastOp   	: {type : String, default : '', trim : true},
		timestamp	: {type : Date, default : Date.now}
	})

	this.model = mongoose.model('Snapshot', SnapshotSchema);

	return this;
}
