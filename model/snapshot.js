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

	/**
	 * setPreOpCondition
	 * ====
	 * Set the function defining the condition to make a snapshot before a given operation.
	 * Parameters:
	 *	- func (Function(Operation):bool):	Function defining the condition
	 * Output: /
	 */
	SnapshotSchema.statics.setPreOpCondition = function (func) {
		SnapshotSchema.statics.preOpCondition = func;
	})
	SnapshotSchema.preOpCondition = function(op) {
		// Default condition: No snapshot before applying an operation.
		return false;
	}

	/**
	 * setPostOpCondition
	 * ====
	 * Set the function defining the condition to make a snapshot after a given operation.
	 * Parameters:
	 *	- func (Function(Operation):bool):	Function defining the condition
	 * Output: /
	 */
	SnapshotSchema.statics.setPostOpCondition = function (func) {
		SnapshotSchema.statics.postOpCondition = func;
	})
	SnapshotSchema.postOpCondition = function(op) {
		// Default condition: make a snapshot every 10 applied operations.
		return !((++SnapshotSchema.statics.postOpCondition.counter)%10);
	}
	SnapshotSchema.statics.preOpCondition.counter = 0;

	/**
	 * makeSnapshotBefore
	 * ====
	 * Makes a snapshot before an incoming operation if the condition is met.
	 *	- op (Operation):	Operation to be applied
	 * Output: /
	 */
	SnapshotSchema.methods.makeSnapshotBefore = function (op) {
		if (SnapshotSchema.statics.preOpCondition(op)) {
			this.save(function (err, hop) {
				  if (err) {
					// TO DO
				  }
			});
		}
	})

	/**
	 * makeSnapshotAfter
	 * ====
	 * Makes a snapshot after an applied operation if the condition is met.
	 *	- op (Operation):	Operation applied
	 * Output: /
	 */
	SnapshotSchema.statics.makeSnapshotAfter = function (op) {
		if (SnapshotSchema.statics.postOpCondition(op)) {
			this.save(function (err, hop) {
				  if (err) {
					// TO DO
				  }
			});
		}
	})

	this.model = mongoose.model('Snapshot', SnapshotSchema);

	return this;
}
