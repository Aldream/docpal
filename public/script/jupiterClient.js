var socket = io.connect();
JupiterNode.prototype.send = function(msg) {
	socket.emit('op', msg);
	console.log('<WebSocket> Local Operation sent: { type: ' + msg.op +', param: '+ msg.param +' }');
};

var jupiterClient = new JupiterNode(/*TO DO: generate unique ID */ 0, '');
var diffMatchPatchFunc = new diff_match_patch();

jupiterClient.socket = socket;
var $notesDiv = $('<div id="notes"></div>');

jupiterClient.socket.on('connect', function () {
	console.log('<WebSocket> Connected.');

	jupiterClient.socket.on('data', function(data) { // When receiving a version of the shared doc:
		// TO DO: Check for uncommited modifications before.
		console.log('<WebSocket> Server\'s Data received.');
		
		
		jupiterClient.socket.on('op', function(opMsg) { // When receiving an operation from the server:
			console.log('<WebSocket> Distant Operation received: { type: ' + opMsg.op +', param: '+ opMsg.param +' }');
			opMsg = jupiterClient.receive(opMsg);
			// Applying the operations to the GUI:
			if (opMsg.op == 'nAdd') {
				addNote(opMsg.param.id, opMsg.param);
			}
			else if (opMsg.op == 'cIns' || opMsg.op == 'cDel') {
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
			console.log('<Update> Distant Operation #' + jupiterClient.otherMessages + ' applied: { type: ' + opMsg.op +', param: '+ opMsg.param +' }');
		});

		jupiterClient.data = data.data
		for (var id in jupiterClient.data) {
			addNote(id,jupiterClient.data[id]);
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
		$('#jupiterDoc').html($btnAddNote)
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
					for (var l = 0; l < data.length; l++) {
						jupiterClient.generate( {op: 'cIns', param: {id: cId, pos: currentPosition, char: data[l]}} ); // Generating the corresponding cIns operation.
						currentPosition++; // Moving carret of 1 char.
					}
					break;
				case DIFF_DELETE:
					for (var l = 0; l < data.length; l++) {
						jupiterClient.generate( {op: 'cDel', param: {id: cId, pos: currentPosition}} ); // Generating the corresponding cDel operation.
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
