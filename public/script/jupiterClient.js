
JupiterNode.prototype.send = function(msg) { console.log(msg); };

var jupiterClient = new JupiterNode(/*TO DO: generate unique ID */ 0, '');
var $docTextarea = $('<textarea id="doc" cols="120" rows="30"></textarea>');
var diffMatchPatchFunc = new diff_match_patch();

//jupiterClient.socket = io.connect();
//
//jupiterClient.socket.on('connect', function () {
//
//	jupiterClient.socket.on('data', function(data) { // When receiving a version of the shared doc:
//		// TO DO: Check for uncommited modifications before.
//		$docTextarea = jupiterClient.data = data;
//		
//		jupiterClient.socket.on('op', function(opMsg) { // When receiving an operation from the server:
//			jupiterClient.receive(opMsg);
//			$docTextarea = jupiterClient.data;
//		});
		
		// On local changes:
		$docTextarea.input(function() {
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
		$('#jupiterDoc').html('<label for="doc">Document</label>');
		$('#jupiterDoc').append($docTextarea);
		
//		// TO DO: Tell the user (s)he can starts editing now.
//		
//	});
//	
//	
//});
