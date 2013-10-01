var config = require("./config");

// Models:
var modelxxx = require("./model/xxx");
var logger = require("./logger");

var rest = config.getProperty("security.ssl") ? "https://" : "http://";
rest += config.getProperty("rest.url");

/*
 * VIEW Index
 */
function viewIndex(req, res) {
	logger.debug("Viewing index.");
	var req = {};
	
    // Get rooms details
    modelrooms.getRooms(req, function(result) {
        var rooms=result.hits;
        res.render('index', {title: "Accueil", rest: rest, rooms: rooms});
	});
}



/*
 * VIEW Login
 */
function viewLogin(req, res) {
	next = req.param("next", null);
	logger.info("Viewing login page. Next is : " + next);
	res.render('login', {title: "Login", rest: rest, next: next, error: null});
}

function dateToString(date) {
	var s = "";
	s += date.getFullYear();
	s += "/";
	s += twoDigits(date.getMonth()+1);
	s += "/";
	s += twoDigits(date.getDate());
	s += " ";
	s += twoDigits(date.getHours());
	s += ":";
	s += twoDigits(date.getMinutes());
	s += ":";
	s += twoDigits(date.getSeconds());
	return s;
}

function twoDigits(nb) {
	var retour = nb < 10 ? "0" + nb : "" + nb;
	return retour;
}


function viewNotfound(req, res) {
	logger.warn("View not found : " + req.url);
	res.render('404', {title: "Page non trouvée", rest: rest});
}

function viewHelp(req, res) {
	logger.info("Viewing help page.");
	res.render('help', {title: "Aide", rest: rest});
}

exports.index = viewIndex;
exports.login = viewLogin;
exports.notfound = viewNotfound;
exports.help = viewHelp;
