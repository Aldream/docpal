$.fn.exists = function () { // Snippet to know if a Jquery selector returns something or not
    return this.length !== 0;
}

var socket = io.connect();
JupiterNode.prototype.send = function(msg) {
	socket.emit('op', msg);
	console.log('<WebSocket> Local Operation sent: { type: ' + msg.op +', param: '+ JSON.stringify(msg.param) +' }');
};

var	jupiterClient = new JupiterNode(/*TO DO: generate unique ID */ 0, ''),				// Jupiter Node
	diffMatchPatchFunc = new diff_match_patch(),										// Text-diff Processor
	otherclientsList = [],																// List of connected clients
	palsList = [];																		// List of connected users (a user can run numerous client nodes)


var	$notesDiv = $('<div id="notes"></div>'),											// Container for the notes
	$palsUl = $('<ul id="pals"><li class="you" id="pal-'+user+'">'+user+'</li></ul>');	// List of connected pals
palsList[user] = 1; // Adding the user her/himself to the list.

socket.on('hi', function(palsInfo) { // When new clients join
	for (var i = 0; i < palsInfo.length; i++) {
		var palInfo = palsInfo[i];
		console.log('<WebSocket> Client joined:' + JSON.stringify(palInfo));
		otherclientsList[palInfo.id] = palInfo.username;
		
		if (palsList[palInfo.username]) { // This pal already had at least 1 connection:
			palsList[palInfo.username]++;
			if (palsList[palInfo.username] == 2) { // This pal had previously only 1 connection:
				$('#pal-'+palInfo.username).append('<span class="nodeNum">2</span>');
			}
			else { // This pal had already more than 1 connection
				$('#pal-'+palInfo.username+ ' .nodeNum').text(palsList[palInfo.username]);
			}
		}
		else { // New pal:
			palsList[palInfo.username] = 1;
			$palsUl.append('<li id="pal-'+palInfo.username+'">'+palInfo.username+'</li>');
		}
	}

});

socket.on('bye', function(palInfo) { // When a client leaves
	var username = otherclientsList[palInfo.id];
	console.log('<WebSocket> Client left:' + JSON.stringify(palInfo) + ' (username: ' + username + ')');
	delete otherclientsList[palInfo.id];
	
	if (palsList[username] > 1) { // This pal still has other client nodes connected
		palsList[username]--;
		if (palsList[username] == 1) { // This pal now has only 1 node
			$('#pal-'+username+ ' .nodeNum').remove();
		}
		else {
			$('#pal-'+username+ ' .nodeNum').text(palsList[username]);
		}
	}
	else { // Fully disconnected
		delete palsList[username];
		$('#pal-'+username).remove();
	}

});
		
socket.on('connect', function () {
	console.log('<WebSocket> Connected.');

	socket.on('data', function(data) { // When receiving a version of the shared doc:
		// TO DO: Check for uncommited modifications before.
		console.log('<WebSocket> Server\'s Data received.');
		
		
		socket.on('op', function(opMsg) { // When receiving an operation from the server:
			opMsg = opMsg.msg;
			console.log('<WebSocket> Distant Operation received: { type: ' + opMsg.op +', param: '+ JSON.stringify(opMsg.param) +' }');
			opMsg = jupiterClient.receive(opMsg);
			// Applying the operations to the GUI:
			if (opMsg.op == 'nAdd') {
				addNote(opMsg.param.id, opMsg.param);
			}
			else if (opMsg.op == 'cIns' || opMsg.op == 'cDel' || opMsg.op == 'sIns' || opMsg.op == 'sDel') {
				if (jupiterClient.data[opMsg.param.id].state == 10) { // Must first restore the note
					addNote(opMsg.param.id, jupiterClient.data[opMsg.param.id]);
					jupiterClient.data[opMsg.param.id].state = 1;
				}
				var $textarea = $('#'+ opMsg.param.id +' > textarea');
				var currentCaretPos = doGetCaretPosition($textarea[0]);
				$textarea.val(jupiterClient.data[opMsg.param.id].text);
				setCaretPosition($textarea[0], currentCaretPos);
			}
			else if (opMsg.op == 'nDrag') {
				if (jupiterClient.data[opMsg.param.id].state == 20) { // Must first restore the note
					addNote(opMsg.param.id, jupiterClient.data[opMsg.param.id]);
					jupiterClient.data[opMsg.param.id].state = 2;
				}
				$('#'+ opMsg.param.id).css({
					'top': opMsg.param.y,
					'left': opMsg.param.x
				});
			}
			else if (opMsg.op == 'nDel') {
				$('#'+ opMsg.param.id).remove();
			}
			console.log('<Update> Distant Operation #' + jupiterClient.otherMessages + ' applied: { type: ' + opMsg.op +', param: '+ JSON.stringify(opMsg.param) +' }');
		});

		jupiterClient.data = data.data
		for (var id in jupiterClient.data) {
			if (jupiterClient.data[id].state) { // Creating the GUI note only if the data note doesn't have the state "deleted"
				addNote(id,jupiterClient.data[id]);
			}
		}

		var $btnAddNote = $('<button id="addNote">Add Note</button>');
		$btnAddNote.click(function(){
			console.log('<Input> Local Operation Detected: Creation of a new Note.');
			var noteData = {
				id: jupiterClient.id+(dateToString(new Date())),
				x: 0, y: 0,
				type: 'info',
				text: ''
			}
			jupiterClient.generate( {op: 'nAdd', param: noteData} ); // Generating the corresponding nAdd

			addNote(noteData.id, noteData) 
		});
		
		// Client is connected to the server and ready - let's enable the edition:
		$('#jupiterDoc').html($palsUl);
		$('#jupiterDoc').append($btnAddNote)
		$('#jupiterDoc').append($notesDiv);
		
		// TO DO: Tell the user (s)he can starts editing now.
		
	});
	
	
});

function addNote(id, noteData) {
	// Creating the corresponding DOM:
	var $notetext = $('<textarea>'+noteData.text+'</textarea>');
	$notetext.val(noteData.text);

	var $noteDelBtn = $('<a class="deleteNote">&times;</a>');


	var $newnote = $('<div class="note" id="'+ id +'"></div>');
	$noteDelBtn.appendTo($newnote);
	$notetext.appendTo($newnote);
	$newnote.css({
		'position': 'absolute',
		'top': noteData.y,
		'left': noteData.x
	});

	// Handling the events:
	$noteDelBtn.click(function() {
		var cId = $(this).parent().attr('id');
		console.log('<Input> Local Operation Detected: Deletion of Note #'+ cId +'.');
		jupiterClient.generate( {op: 'nDel', param: {id: cId}} ); // Generating the corresponding nDel operation.
		$(this).parent().remove();
	});

	$newnote.bind('drag', function (ev, dd) {
		console.log('<Input> Local Operation Detected: Drag of Note #'+ $(this).attr('id') +'.');
		jupiterClient.generate( {op: 'nDrag', param: {id: $(this).attr('id'), x: dd.offsetX, y: dd.offsetY}} ); // Generating the corresponding nDrag operation.
		$(this).css({
			'top': dd.offsetY,
			'left': dd.offsetX
		});
	});

	$notetext.input(function() {
		var cId = $(this).parent().attr('id');
		console.log('<Input> Local Operation Detected: Text Edit of Note #'+ cId +'.');
		var newData = $(this).val();
		
		// Computing the differences (insertions / deletions) with the previous text:
		var diffs = diffMatchPatchFunc.diff_main(jupiterClient.data[cId].text, newData);
		var currentPosition = 0;
		for (var x = 0; x < diffs.length; x++) {
			var op = diffs[x][0]; // Operation (insert, delete, equal)
			var data = diffs[x][1]; // Text of change.
			//var text = data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '&para;<BR>');
			switch (op) {
				case DIFF_INSERT:
					jupiterClient.generate( {op: 'sIns', param: {id: cId, pos: currentPosition, str: data, size: data.length}} ); // Generating the corresponding sIns operation.
					currentPosition += data.length; // Moving carret of the size of the string.

					break;
				case DIFF_DELETE:
					jupiterClient.generate( {op: 'sDel', param: {id: cId, pos: currentPosition, size: data.length}} ); // Generating the corresponding sDel operation.
					break;
				case DIFF_EQUAL:
					// We move the carret of data.length:
					currentPosition += data.length;
					// Do nothing
					break;
			}
		}
	});

	$newnote.appendTo($notesDiv);
}

function dateToString() {
    	var temp = new Date();
    	return padStr2(temp.getFullYear()) +
		padStr2(1 + temp.getMonth()) +
		padStr2(temp.getDate()) +
		padStr2(temp.getHours()) +
		padStr2(temp.getMinutes()) +
		padStr2(temp.getSeconds()) +
		padStr3(temp.getMilliseconds());
}

function padStr2(i) {
    return (i < 10) ? "0" + i : "" + i;
}
function padStr3(i) {
    return (i < 10) ? "00" + i : (i < 100) ? "0" + i : i;
}

function doGetCaretPosition (ctrl) {
	var CaretPos = 0;	// IE Support
	if (document.selection && navigator.appVersion.indexOf("MSIE 10") == -1) {
	ctrl.focus ();
		var Sel = document.selection.createRange ();
		Sel.moveStart ('character', -ctrl.value.length);
		CaretPos = Sel.text.length;
	}
	// Firefox support
	else if (ctrl.selectionStart || ctrl.selectionStart == '0')
		CaretPos = ctrl.selectionStart;
	return (CaretPos);
}
function setCaretPosition(ctrl, pos){
	if(ctrl.setSelectionRange)
	{
		ctrl.focus();
		ctrl.setSelectionRange(pos,pos);
	}
	else if (ctrl.createTextRange) {
		var range = ctrl.createTextRange();
		range.collapse(true);
		range.moveEnd('character', pos);
		range.moveStart('character', pos);
		range.select();
	}
}
