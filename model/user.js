var logger = require("../logger");

var credentials = {
	vuHieu: "hop",
	bill : "hop"
};

/*
 * Stub which simulates the retrieval of credentials in a database.
 * Could be implemented, couldn't it ?
 */
function getCredentials() {
	logger.info("Gettings credentials...");
	return credentials;
}

exports.getCredentials = getCredentials;

