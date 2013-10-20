var config = {
	"logger" : {
		"level" : "debug",
		"printDate" : false
	},
	"security" : {
		"ssl" : false,
		"auth" : true
	},
	"rest" : {
		"url" : "localhost",
		"port" : 1337
	},
	"http" : {
		"port" : 8080
	},
	"db": {
		"uri" :	"mongodb://heroku_app18689960:q5q2klk0eeonlv3bpdsd8bm02a@ds051758-a0.mongolab.com:51758,ds051758-a1.mongolab.com:51758/heroku_app18689960"
				// 'mongodb://localhost/docpal'
	},
	"session" : {
		"secret" : "One does not simply walk into this website."
	}
};

/* Object getProperty(String name)
* Get the property of an object by specifying the path (like
* "logger.level")
*/
function getProperty(name) {
	var path = name.split('.');
	var obj = config;
	for(var i in path) {
		var elem = path[i];
		if(!obj[elem]) return undefined;
			obj=obj[elem];
	}
	return obj;
}

exports.getProperty = getProperty;
