var	express = require("express"),
	mongoose = require('mongoose'),
	http = require('http'),
	fs = require("fs"),
	engine = require('ejs-locals'),
	connect = require('connect'),
	io = require('socket.io'),
	sessionSockets = require('session.socket.io'),
	config = require("./config");

var logger = require("./logger");

// Catch for all exception
process.on('uncaughtException', function (error) {
   logger.error(error.stack);
});

var securityActivated = config.getProperty("security.auth");
logger.warn("Security activated : " + securityActivated);

var sslActivated = config.getProperty("security.ssl");
logger.warn("SSL activated : " + sslActivated);


/* ------------------------
 * DB connection
 * ------------------------
 */
mongoose.connect('mongodb://localhost/docpal', function(err) {
  if (err) { logger.error(err); }
});

var modelOperation = require("./model/operation")(mongoose).model;
var modelUser = require("./model/user")(mongoose).model;
var modelNote = require("./model/note")(mongoose).model;
var modelSnapshot = require("./model/snapshot")(mongoose).model;

var	services = require("./services")(mongoose, modelUser, modelOperation, modelNote, modelSnapshot),
	views = require("./views"),
	authModule = require("./auth")(modelUser);

/* ------------------------
 * REST Server config
 * ------------------------
 */
var rest;
if(sslActivated) {
	rest = express({
		key: fs.readFileSync('security/server.key'),
		cert: fs.readFileSync('security/server.crt')
	});
} else {
	rest = express();
}
rest.configure(function() {
	rest.use(express.bodyParser()); // retrieves automatically req bodies
	rest.use(rest.router); // manually defines the routes
});

// Service:
serviceHandler = {};
serviceHandler["/doc"] = services.rest.getLastSnapshot;
serviceHandler["/createUser"] = services.rest.createUser;
//serviceHandler["/xxx"] = services.xxx;

for (var url in serviceHandler) {
	rest.post(url, serviceHandler[url]);
}

logger.warn("REST routes activated.");
var serverRest = http.createServer(rest);
serverRest.listen(config.getProperty("rest.port"));
logger.warn("REST server is listening.");


/* ------------------------
 * HTML Server config
 * ------------------------
 */
var html;
if(sslActivated) {
	html = express({
		key: fs.readFileSync('security/server.key'),
		cert: fs.readFileSync('security/server.crt')
	});
} else {
	html = express();
}

// Session config:
var	cookieParser = express.cookieParser(config.getProperty("session.secret")),
	sessionStore = new connect.middleware.session.MemoryStore();

html.configure(function() {
	// use ejs-locals for all ejs templates:
	html.engine('ejs', engine);
	html.use(express.bodyParser());
	html.use(express.static(__dirname + '/public'));
	html.set('views', __dirname + '/views');
	html.set('view engine', 'ejs');
	
	// Stuff needed for sessions
	html.use(cookieParser);
	html.use(express.session({ store: sessionStore }));
});

// Different views of the HTML server :
viewHandler = {};
viewHandler["/(index)?"] = views.index;
viewHandler["/login"] = views.login;
viewHandler["/signin"] = views.signin;
viewHandler["/help"] = views.help;
//viewHandler["/doc"] = views.doc;
//viewHandler["/xxx"] = views.xxx;

// Need to be put before * otherwise the star rule catches all the
// requests !
html.post("/auth", authModule.auth);
html.get("/logout", authModule.logout);

viewHandler["*"] = views.notfound;

// handler, user, password
authModule.init(viewHandler);

for (var url in viewHandler) {
	(securityActivated) ? html.get(url, authModule.checkAuth(url))
						: html.get(url, viewHandler[url]);
}

logger.warn("HTML Server routes activated.");
var serverHtml = http.createServer(html);
serverHtml.listen(config.getProperty("http.port"));

logger.warn("HTML Server is listening.");


/* ---------------------
 * JUPITER SERVER, using Socket.io:
 * ---------------------
 */
var JupiterNode = require('./lib/module.jupiterNode.class')(services.local),
	ioServer = io.listen(serverHtml),
	sessionIO = new sessionSockets(ioServer, sessionStore, cookieParser),
	clientsArray = [];

services.local.readAllActiveNotes(function(err, notes) { // First we retrieve potential data from the DB
	if (err) { logger.info('<MongoDB> No data retrieve from previous instances: '+ err); }
	var data = {};
	if (notes) {
		logger.info('<MongoDB> Notes retrieved. Number = '+notes.length);
		notes.forEach(function(note) {
				data[note.id] = {
				x: note.x,
				y: note.y,
				text: note.text,
				type: note.type,
				state: note.state
			};
		});
	}

	var jupiterServerNode = new JupiterNode(0, data, function sendOp(idSocket, msg, idSender) {
			ioServer.sockets.sockets[idSocket].emit('op', {sender: idSender, msg: msg});
	});

	sessionIO.on('connection', function (err, socket, session) { // On connection of a client:
		if (!session || !session.auth) { // If the user isn't authentified:
			socket.disconnect('unauthorized');
		}
		else {
			logger.info('<Websocket> Client ' + session.username + ' (socket # '+socket.id+') - Connection.');
			jupiterServerNode.addClient(socket.id);

			socket.emit('data', { data: jupiterServerNode.data }); // Sending her/him the current data

			socket.on('op', function (msg) { // When receiving an operation from a client
				logger.info('<Websocket> Client ' + session.username + ' (socket # '+socket.id + ') - Operation Msg: { type: ' + msg.op + ', param: ' + JSON.stringify(msg.param) + ' }');
				msg = jupiterServerNode.receive(socket, msg); // Applying it locally
				
			});

			socket.on('disconnect', function() {// On disconnection of a client:
				logger.info('<Websocket> Client ' + session.username + ' (socket # '+socket.id + ') - Disconnection.');
				socket.broadcast.emit('bye', {id: socket.id});
				jupiterServerNode.removeClient(socket.id);
				delete clientsArray[socket.id];
			});
			
			// For the new client, we send an array with all the other connected clients:
			var clientsObjArray = [];
			for (var id in clientsArray) { clientsObjArray.push({id:id, username: clientsArray[id] }) }
			socket.emit('hi', clientsObjArray);
			clientsArray[socket.id] = session.username;
			
			// For the others clients, we introduce the newcomer:
			socket.broadcast.emit('hi', [{id: socket.id, username: session.username}]);
		}
	});
});

function clone(obj) {
	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		var copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = clone(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		var copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		}
		return copy;
	}

	throw new Error("Unable to copy obj! Its type isn't supported.");
}



