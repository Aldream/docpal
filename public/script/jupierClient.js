/*
Connexion au serveur
Recup doc
Copier dans textarea
Ecouter messages du serveur et appliquer
Ecouter modif du texte et envoyer au serveur
*/

var jupiterClient = new JupiterNode(id, null);
var $docTextarea = $('#doc');

$docTextarea = $('#doc')

jupiterClient.socket = io.connect();

jupiterClient.socket.on('connect', function () {

	jupiterClient.socket.on('data', function(data) { // When receiving a version of the shared doc:
		// TO DO: Check for uncommited modifications before.
		$docTextarea = jupiterClient.data = data;
	});
	
    jupiterClient.socket.on('op', function(opMsg) { // When receiving an operation from the server:
		jupiterClient.receive(opMsg);
		$docTextarea = jupiterClient.data;
	});
});
