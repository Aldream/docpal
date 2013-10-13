/**
 * =================
 * SCHEMA - User
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines an user of the Jupiter System.
 */

module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var UserSchema = new Schema({
		_id			: Schema.Types.ObjectId,
		name  		: {type : String, default : 'Stranger', trim : true},
		password  	: type : String, default : '', trim : false}
	})

	this.model = mongoose.model('User', UserSchema);

	return this;
}
/*
//Ex:
var vuHieu = new User({ name: 'Vu-Hieu', password: 'hop' });
var bill = new User({ name: 'Bill', password: 'hop' });
vuHieu.save(function (err, fluffy) {
	// TODO handle the error
});
bill.save(function (err, fluffy) {
	// TODO handle the error
});


var credentials = {
	vuHieu: "hop",
	bill : "hop"
};
*/
/*
 * Stub which simulates the retrieval of credentials in a database.
 * Could be implemented, couldn't it ?
 */

function getCredentials() {
	logger.info("Gettings credentials...");
	var credentials = {};
	User.find(function (err, users) {
		// TODO handle err
		for (var u in users) {
			credentials[u] = u.password;
		}
	});
	return credentials;
}

exports.getCredentials = getCredentials;

