
var socket = io.connect();
JupiterNode.prototype.send = function(msg) {
	socket.emit('op', msg);
	console.log('<WebSocket> Local Operation sent: { type: ' + msg.op +', param: '+ msg.param +' }');
};

var jupiterClient = new JupiterNode(/*TO DO: generate unique ID */ 0, '');
var $docTextarea = $('<textarea id="doc" cols="120" rows="30"></textarea>');
var diffMatchPatchFunc = new diff_match_patch();

jupiterClient.socket = socket;

jupiterClient.socket.on('connect', function () {
	console.log('<WebSocket> Connected.');

	jupiterClient.socket.on('data', function(data) { // When receiving a version of the shared doc:
		// TO DO: Check for uncommited modifications before.
		console.log('<WebSocket> Server\'s Data received.');
		$docTextarea.val(jupiterClient.data = data.data);
		
		jupiterClient.socket.on('op', function(opMsg) { // When receiving an operation from the server:
			console.log('<WebSocket> Distant Operation received: { type: ' + opMsg.op +', param: '+ opMsg.param +' }');
			jupiterClient.receive(opMsg);
			$docTextarea.val(jupiterClient.data);
			console.log('<Update> Distant Operation #' + jupiterClient.otherMessages + ' applied: { type: ' + opMsg.op +', param: '+ opMsg.param +' }');
		});
		
		// On local changes:
		$docTextarea.input(function() {
			console.log('<Input> Local Change Detected.');
			var newData = $docTextarea.val();
			
			// Computing the differences (insertions / deletions) with the previous text:
			var diffs = diffMatchPatchFunc.diff_main(jupiterClient.data, newData);
			var	currentPosition = 0;
			for (var x = 0; x < diffs.length; x++) {
				var op = diffs[x][0]; // Operation (insert, delete, equal)
				var data = diffs[x][1]; // Text of change.
				//var text = data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '&para;<BR>');
				switch (op) {
					case DIFF_INSERT:
						for (var l = 0; l < data.length; l++) {
							jupiterClient.generate( {op: 'cIns', param: {pos: currentPosition, char: data[l]}} ); // Generating the corresponding cIns operation.
							currentPosition++; // Moving carret of 1 char.
						}
						break;
					case DIFF_DELETE:
						for (var l = 0; l < data.length; l++) {
							jupiterClient.generate( {op: 'cDel', param: {pos: currentPosition}} ); // Generating the corresponding cDel operation.
						}
						break;
					case DIFF_EQUAL:
						// We move the carret of data.length:
						currentPosition += data.length;
						// Do nothing
						break;
				}
			}
		});
		
		// Client is connected to the server and ready - let's enable the edition:
		$('#jupiterDoc').html($docTextarea);
		
		// TO DO: Tell the user (s)he can starts editing now.
		
	});
	
	
});
