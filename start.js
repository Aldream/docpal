var express = require("express");
var http = require('http');
var fs = require("fs");
var engine = require('ejs-locals');

var config = require("./config");
var services = require("./services");
var views = require("./views");
var authModule = require("./auth").authModule;

var logger = require("./logger");

// Catch for all exception
process.on('uncaughtException', function (error) {
   logger.error(error.stack);
});

var securityActivated = config.getProperty("security.auth");
logger.warn("Security activated : " + securityActivated);

var sslActivated = config.getProperty("security.ssl");
logger.warn("SSL activated : " + sslActivated);

// REST Server config
var rest;
if(sslActivated) {
	rest = express.createServer({
		key: fs.readFileSync('security/server.key'),
		cert: fs.readFileSync('security/server.crt')
	});
} else {
	rest = express.createServer();
}
rest.configure(function() {
	rest.use(express.bodyParser()); // retrieves automatically req bodies
	rest.use(rest.router); // manually defines the routes
});

// Service:
serviceHandler = {};
serviceHandler["/doc"] = services.rest.getLastSnapshot;
//serviceHandler["/xxx"] = services.xxx;

for (var url in serviceHandler) {
	rest.post(url, serviceHandler[url]);
}

logger.warn("REST routes activated.");
rest.listen(1337);
logger.warn("REST server is listening.");

// HTML Server config
var html;
if(sslActivated) {
	html = express.createServer({
		key: fs.readFileSync('security/server.key'),
		cert: fs.readFileSync('security/server.crt')
	});
} else {
	html = express.createServer();
}


html.configure(function() {
	// use ejs-locals for all ejs templates:
	html.engine('ejs', engine);
	html.use(express.bodyParser());
	html.use(express.static(__dirname + '/public'));
	html.set('views', __dirname + '/views');
	html.set('view engine', 'ejs');
	
	// Stuff needed for sessions
	html.use(express.cookieParser());
	html.use(express.session(
		{ secret: "One does not simply walk into website." }));
});

// Different views of the HTML server :
viewHandler = {};
viewHandler["/(index)?"] = views.index;
viewHandler["/login"] = views.login;
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
serverHtml.listen(8080);

logger.warn("HTML Server is listening.");


/* ---------------------
 * JUPITER SERVER, using Socket.io:
 * ---------------------
 */



var JupiterNode = require('./lib/module.jupiterNode.class').JupiterNode;
var jupiterServerNode = new JupiterNode(0, {});
logger.debug(jupiterServerNode);
services.local.readAllActiveNotes(function(err, notes) { // First we retrieve potential data from the DB
	if (err) { logger.error('<MongoDB> No data retrieve from previous instances: '+ err); }
	if (notes) {
		notes.forEach(function(note) {
              		jupiterServerNode.data[note.id] = {
				x: note.x,
				y: note.y,
				text: note.text,
				type: note.type,
				state: note.state
			};
		});
         }
	
	var io = require('socket.io').listen(serverHtml);
	io.sockets.on('connection', function (socket) { // On connection of a client:

		logger.info('<Websocket> Client ' + socket.id + ' - Connection.');
		socket.emit('data', { data: jupiterServerNode.data }); // Sending her/him the current data

		socket.on('op', function (msg) { // When receiving an operation from a client
			logger.info('<Websocket> Client ' + socket.id + ' - Operation Msg: { type: ' + msg.op + ', param: ' + msg.param + ' }');
			msg = jupiterServerNode.receive(msg); // Applying it locally
			services.local.saveOperation({idUser : 'TO DO', type: msg.op, param: msg.param /*, timestamp: TO DO*/}, function(op, suc) {	
				if (suc) { // If the operation was safely saved:
					socket.broadcast.emit('op', msg); // Sending to all the other clients
				
					// Saving the effects of the operation in the DB:
					if (msg.op == 'cIns' || msg.op == 'cDel') { // Edition of the text of a note
						services.local.updateNoteText(msg.param.id, jupiterServerNode.data[msg.param.id].text);
					}
					else if (msg.op == 'nAdd') { // Creation of a note
						services.local.saveNote(msg.param, function(){});
					}
					else if (msg.op == 'nDel') { // Deletion of a note
						services.local.updateNoteState(msg.param.id, 0);
					}
					else if (msg.op == 'nDrag') { // Moving a note
						services.local.updateNoteDrag(msg.param.id, jupiterServerNode.data[msg.param.id].x, jupiterServerNode.data[msg.param.id].y);
					}
				}
			});
		});

		socket.on('disconnect', function() {// On disconnection of a client:
			logger.info('<Websocket> Client ' + socket.id + ' - Disconnection.');
		});
	});

});




