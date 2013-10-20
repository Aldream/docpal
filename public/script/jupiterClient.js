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

palsList[user] = {clientsNum : 1, color: randomColor(), opTracker: null}; // Adding the user her/himself to the list.

var	$notesDiv = $('<div id="notes"></div>'),											// Container for the notes
	$palsUl = $('<ul id="pals"><li class="you" id="pal-'+user+'" style="color:'+palsList[user].color+';" title="Nothing done since your connection">'+user+'</li></ul>');	// List of connected pals

// TO DO: Improve zIndex update

socket.on('hi', function(palsInfo) { // When new clients join
	for (var i = 0; i < palsInfo.length; i++) {
		var palInfo = palsInfo[i];
		console.log('<WebSocket> Client joined:' + JSON.stringify(palInfo));
		otherclientsList[palInfo.id] = palInfo.username;
		
		if (palsList[palInfo.username]) { // This pal already had at least 1 connection:
			palsList[palInfo.username].clientsNum++;
			if (palsList[palInfo.username].clientsNum == 2) { // This pal had previously only 1 connection:
				$('#pal-'+palInfo.username).append('<span class="nodeNum">2</span>');
			}
			else { // This pal had already more than 1 connection
				$('#pal-'+palInfo.username+ ' .nodeNum').text(palsList[palInfo.username].clientsNum);
			}
		}
		else { // New pal:
			palsList[palInfo.username] = {clientsNum : 1, color: randomColor(), opTracker: null};
			$palsUl.append('<li id="pal-'+palInfo.username+'" style="color:'+palsList[palInfo.username].color+';" title="Nothing done since your connection">'+palInfo.username+'</li>');
		}
	}

});

socket.on('bye', function(palInfo) { // When a client leaves
	var username = otherclientsList[palInfo.id];
	console.log('<WebSocket> Client left:' + JSON.stringify(palInfo) + ' (username: ' + username + ')');
	delete otherclientsList[palInfo.id];
	
	if (palsList[username].clientsNum > 1) { // This pal still has other client nodes connected
		palsList[username].clientsNum--;
		if (palsList[username].clientsNum == 1) { // This pal now has only 1 node
			$('#pal-'+username+ ' .nodeNum').remove();
		}
		else {
			$('#pal-'+username+ ' .nodeNum').text(palsList[username].clientsNum);
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
			var opUser = otherclientsList[opMsg.sender];
			console.log('<WebSocket> Distant Operation received from '+opUser+'(# '+opMsg.sender+'): { type: ' + opMsg.msg.op +', param: '+ JSON.stringify(opMsg.msg.param) +' }');
			opMsg.msg = jupiterClient.receive(opMsg.msg);
			var txtOp = '';
			// Applying the operations to the GUI:
			if (opMsg.msg.op == 'nAdd') {
				jupiterClient.notesNum++;
				addNote(opMsg.msg.param.id, opMsg.msg.param, jupiterClient.notesNum);
				txtOp = 'just created the note';
			}
			else if (opMsg.msg.op == 'cIns' || opMsg.msg.op == 'cDel' || opMsg.msg.op == 'sIns' || opMsg.msg.op == 'sDel') {
				if (jupiterClient.data[opMsg.msg.param.id].state == 10) { // Must first restore the note
					addNote(opMsg.msg.param.id, jupiterClient.data[opMsg.msg.param.id], jupiterClient.notesNum);
					jupiterClient.data[opMsg.msg.param.id].state = 1;
					jupiterClient.notesNum++;
				}
				updateNotesZIndex(opMsg.msg.param.id, jupiterClient.notesNum);
				var $textarea = $('#'+ opMsg.msg.param.id +' > textarea');
				var currentCaretPos = doGetCaretPosition($textarea[0]);
				$textarea.val(jupiterClient.data[opMsg.msg.param.id].text);
				setCaretPosition($textarea[0], currentCaretPos);
				txtOp = 'is editing the content of the note';
			}
			else if (opMsg.msg.op == 'nDrag') {
				if (jupiterClient.data[opMsg.msg.param.id].state == 20) { // Must first restore the note
					addNote(opMsg.msg.param.id, jupiterClient.data[opMsg.msg.param.id], jupiterClient.notesNum);
					jupiterClient.data[opMsg.msg.param.id].state = 2;
					jupiterClient.notesNum++;
				}
				updateNotesZIndex(opMsg.msg.param.id, jupiterClient.notesNum);
				$('#'+ opMsg.msg.param.id).css({
					'top': opMsg.msg.param.y,
					'left': opMsg.msg.param.x
				});
				txtOp = 'is dragging the note';
			}
			else if (opMsg.msg.op == 'nDel') {
				$('#'+ opMsg.msg.param.id).remove();
				txtOp = 'just deleted the note';
				jupiterClient.notesNum--;
			}
			
			if (opMsg.msg.param.id) {
				logPalsActivity(opUser, txtOp, opMsg.msg.param.id);
			}
			console.log('<Update> Distant Operation #' + jupiterClient.otherMessages + ' applied: { type: ' + opMsg.msg.op +', param: '+ JSON.stringify(opMsg.msg.param) +' }');
		});

		jupiterClient.data = data.data;
		var lastOpTimeArray = [];
		for (var id in jupiterClient.data) {
			lastOpTimeArray.push({id: id, t: jupiterClient.data[id].timestampLastOp});
		}
		lastOpTimeArray.sort(function(a,b){return a.t > b.t});
		for (var i = 0; i < lastOpTimeArray.length; i++) {
			var id = lastOpTimeArray[i].id;
			if (jupiterClient.data[id].state) { // Creating the GUI note only if the data note doesn't have the state "deleted"
				addNote(id,jupiterClient.data[id], i+1);
			}
		}
		jupiterClient.notesNum = lastOpTimeArray.length;

		var $btnAddNote = $('<button id="addNote" title="Create a note">+</button>');
		$btnAddNote.click(function(){
			console.log('<Input> Local Operation Detected: Creation of a new Note.');
			var noteData = {
				id: jupiterClient.id+(dateToString(new Date())),
				x: 0, y: 0,
				type: 'info',
				text: ''
			}
			jupiterClient.generate( {op: 'nAdd', param: noteData} ); // Generating the corresponding nAdd
			jupiterClient.notesNum++;
			addNote(noteData.id, noteData, jupiterClient.notesNum);
			logPalsActivity(user, 'just created the note', noteData.id);
		});
		
		// Client is connected to the server and ready - let's enable the edition:
		$('.header').append($btnAddNote);
		$('.header').append($palsUl);
		$('.header').append('<a id="logout" href="/logout" title="Log out">&times;</a>');
		$('#waitMsg').remove();
		$('#jupiterDoc').append($notesDiv);
		
		// TO DO: Tell the user (s)he can starts editing now.
		
	});
	
	
});

function logPalsActivity(opUser, txtOp, noteId) {
	$('#modif-'+opUser).remove();
	clearTimeout(palsList[opUser].opTimeout);
	
	$('#pal-'+opUser).attr('title', dateToPrettyString()+ ' - ' +txtOp + ' #'+noteId);
	$('#'+ noteId +' .modifiers').prepend('<span class="modifier" id="modif-'+opUser+'" style="color:'+palsList[opUser].color+';" title="'+opUser+' '+txtOp+'">●</span>');
	
	palsList[opUser].opTimeout = setTimeout(function(){ $('#modif-'+opUser).remove(); }, 3000);
}

function addNote(id, noteData, zIndex) {
	// Creating the corresponding DOM:
	var $notetext = $('<textarea>'+noteData.text+'</textarea>');
	$notetext.val(noteData.text);

	var $noteDelBtn = $('<a class="deleteNote">&times;</a>');


	var $newnote = $('<div class="note" id="'+ id +'" style="z-index:'+zIndex+';"><p class="modifiers"></p></div>');
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
		logPalsActivity(user, 'just deleted the note', cId);
		jupiterClient.notesNum--;
	});

	$newnote.bind('drag', function (ev, dd) {
		console.log('<Input> Local Operation Detected: Drag of Note #'+ $(this).attr('id') +'.');
		jupiterClient.generate( {op: 'nDrag', param: {id: $(this).attr('id'), x: dd.offsetX, y: dd.offsetY}} ); // Generating the corresponding nDrag operation.
		$(this).css({
			'top': dd.offsetY,
			'left': dd.offsetX
		});
		logPalsActivity(user, 'is dragging the note', $(this).attr('id'));
	});

	$newnote.bind('dragstart', function (ev, dd) {
		$(this).addClass('drag');
		updateNotesZIndex($(this).attr('id'), jupiterClient.notesNum);
	});

	$newnote.bind('dragend', function (ev, dd) {
		$(this).removeClass('drag');
		updateNotesZIndex($(this).attr('id'), jupiterClient.notesNum);
	});

	$notetext.input(function() {
		var cId = $(this).parent().attr('id');
		console.log('<Input> Local Operation Detected: Text Edit of Note #'+ cId +'.');
		var newData = $(this).val();
		updateNotesZIndex(cId, jupiterClient.notesNum);
		
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
		logPalsActivity(user, 'is editing the content of the note', cId);
	});

	$newnote.appendTo($notesDiv);
}

function dateToString(date) {
		
    	if (!date) date = new Date();
    	return padStr2(date.getFullYear()) +
		padStr2(1 + date.getMonth()) +
		padStr2(date.getDate()) +
		padStr2(date.getHours()) +
		padStr2(date.getMinutes()) +
		padStr2(date.getSeconds()) +
		padStr3(date.getMilliseconds());
}

function dateToPrettyString() {
    	var temp = new Date();
    	return padStr2(temp.getFullYear()) + '/' +
		padStr2(1 + temp.getMonth()) + '/' +
		padStr2(temp.getDate()) + ' ' +
		padStr2(temp.getHours()) + ':' +
		padStr2(temp.getMinutes()) + ':' +
		padStr2(temp.getSeconds());
}

function updateNotesZIndex(id, max) {
	var currentZind = parseInt($('#'+id).css('z-index'));
	$('.note').each(function() {
		var nZind =  parseInt($(this).css('z-index'));
		if (nZind > currentZind) { $(this).css('z-index', ''+(nZind-1)); }
	});
	$('#'+id).css('z-index', max);
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

function randomColor(){
//    var allowed = "0369cf".split( '' ), s = "#";
//    while ( s.length < 4 ) {
//       s += allowed.splice( Math.floor( ( Math.random() * allowed.length ) ), 1 );
//    }
//    return s;
    return 'hsl('+Math.floor(Math.random()*360)+','+(20 + Math.floor(Math.random()*80))+'%,'+ (20 + Math.floor(Math.random()*60))+'%)';
}
