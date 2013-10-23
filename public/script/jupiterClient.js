/**
 * =================
 * Script - JupiterClient
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Engine behind the Client's Jupiter API
 */
 
 $.fn.exists = function () { // Snippet to know if a Jquery selector returns something or not
    return this.length !== 0;
}

// ---------------------------
// VAR INIT
// ---------------------------

// Socket.io Connection:
var socket = io.connect();

// We define the way to communicate for our Jupiter Node, ie through Socket.io:
JupiterNode.prototype.send = function(msg) {
	socket.emit('op', msg);
	console.log('<WebSocket> Local Operation sent: { type: ' + msg.op +', param: '+ JSON.stringify(msg.param) +' }');
};

var	jupiterClient = new JupiterNode(/*TO DO: generate unique ID */ 0, ''),				// Jupiter Node
	otherclientsList = [],																// List of connected clients
	palsList = [];																		// List of connected users (a user can run numerous client nodes)

palsList[user] = {clientsNum : 1, color: randomColor(), opTracker: null}; // Adding the user her/himself to the list.

var	$notesDiv = $('<div id="notes"></div>'),											// Container for the notes
	$palsUl = $('<ul id="pals"><li class="you" id="pal-'+user+'" style="color:'+palsList[user].color+';" title="Nothing done since your connection">'+user+'</li></ul>');	// List of connected pals

// Worker to deal with findind the Jupiter Operations to get a new text from an old one:
var workerOperationsFromDiff = new Worker('script/worker_generateOperationsFromDiff.js');
workerOperationsFromDiff.onmessage = function (oEvent) {
	console.log('<Webworker> Message : '+ JSON.stringify(oEvent.data));
	jupiterClient.generate(oEvent.data);
};


// ---------------------------
// SOCKET.IO COMMUNICATION
// ---------------------------

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
		
socket.on('connect', function () { // When this node is connected to the Jupiter System
	console.log('<WebSocket> Connected.');

	socket.on('data', function(data) { // When receiving a version of the shared doc:
		// TO DO: Check for uncommited modifications before.
		console.log('<WebSocket> Server\'s Data received.');
		
		
		socket.on('op', function(opMsg) { // When receiving an operation from the server:
			var opUser = otherclientsList[opMsg.sender];
			console.log('<WebSocket> Distant Operation received from '+opUser+'(# '+opMsg.sender+'): { type: ' + opMsg.msg.op +', param: '+ JSON.stringify(opMsg.msg.param) +' }');
			
			// Giving the operation to the Jupiter Node to synchronize:
			opMsg.msg = jupiterClient.receive(opMsg.msg);
			var txtOp = '';
			
			// Applying the operations to the GUI:
			if (opMsg.msg.op == 'nAdd') { // Creating a new note
				jupiterClient.notesNum++;
				addNote(opMsg.msg.param.id, opMsg.msg.param, jupiterClient.notesNum);
				txtOp = 'just created the note';
			}
			else if (opMsg.msg.op == 'cIns' || opMsg.msg.op == 'cDel' || opMsg.msg.op == 'sIns' || opMsg.msg.op == 'sDel') { // Editing the content of a note
				if (jupiterClient.data[opMsg.msg.param.id].state == 10) { // Must first restore the note
					addNote(opMsg.msg.param.id, jupiterClient.data[opMsg.msg.param.id], jupiterClient.notesNum);
					jupiterClient.data[opMsg.msg.param.id].state = 1;
					jupiterClient.notesNum++;
				}
				updateNotesZIndex(opMsg.msg.param.id, jupiterClient.notesNum);
				var $textarea = $('#'+ opMsg.msg.param.id +' .insideNote > textarea');
				var currentCaretPos = doGetCaretPosition($textarea[0]);
				$textarea.val(jupiterClient.data[opMsg.msg.param.id].text);
				setCaretPosition($textarea[0], currentCaretPos);
				txtOp = 'is editing the content of the note';
			}
			else if (opMsg.msg.op == 'nDrag') { // Moving a note
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
			else if (opMsg.msg.op == 'nDel') { // Deleting a note
				$('#'+ opMsg.msg.param.id).remove();
				txtOp = 'just deleted the note';
				jupiterClient.notesNum--;
			}
			
			if (opMsg.msg.param.id) {
				logPalsActivity(opUser, txtOp, opMsg.msg.param.id); // Creating a small dot in the corner of the modified note to show that a distant user is playing with it.
			}
			console.log('<Update> Distant Operation #' + jupiterClient.otherMessages + ' applied: { type: ' + opMsg.msg.op +', param: '+ JSON.stringify(opMsg.msg.param) +' }');
		});

		// Feeding this Node with the initial data from the Jupiter Server:
		jupiterClient.data = data.data;
		// Small hack to add the notes in the chronological order of their last operation on, to stack them (zIndex) in the correct order:
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

		// The Node is ready. Display the edition interface:
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
		$('.header').append('<a id="logout" href="/logout" title="Log out">&times;</a>');
		$('.header').append($palsUl);
		$('#waitMsg').remove();
		$('#jupiterDoc').append($notesDiv);
		
		// TO DO: Tell the user (s)he can starts editing now.
		
	});
	
	
});

/**
 * logPalsActivity
 * ====
 * Display a small dot in the corner of a modified note. The dot has the color of the modifier.
 * Parameters:
 *	- opUser (string):	Name of the user who generated the operation
 *	- txtOp (string):	Text defining the operation, to display when overing the dot
 *	- noteId (string):	ID of the modified note
 * Output: /
 */
function logPalsActivity(opUser, txtOp, noteId) {
	$('#modif-'+opUser).remove();
	clearTimeout(palsList[opUser].opTimeout);
	
	$('#pal-'+opUser).attr('title', dateToPrettyString()+ ' - ' +txtOp + ' #'+noteId);
	$('#'+ noteId +' .modifiers').prepend('<span class="modifier" id="modif-'+opUser+'" style="color:'+palsList[opUser].color+';" title="'+opUser+' '+txtOp+'">●</span>');
	
	palsList[opUser].opTimeout = setTimeout(function(){ $('#modif-'+opUser).remove(); }, 3000);
}



// ---------------------------
// GUI Functions
// ---------------------------

/**
 * addNote
 * ====
 * Display a new note.
 * Parameters:
 *	- id (string):			ID of the new note
 *	- noteData (JSON Obj):	Data of the new note
 *	- zIndex (int):			z-Index of the note
 * Output: /
 */
function addNote(id, noteData, zIndex) {
	// Creating the corresponding DOM:
	var	$notetext = $('<textarea>'+noteData.text+'</textarea>'),
		$noteDelBtn = $('<a class="deleteNote">&times;</a>'),
		$newnote = $('<div class="note" id="'+ id +'" style="z-index:'+zIndex+';"></div>'),
		$modifiers = $('<p class="modifiers"></p>'),
		$insideNote = $('<div class="insideNote"></div>');
	
	$notetext.val(noteData.text);
	$modifiers.appendTo($insideNote);
	$noteDelBtn.appendTo($insideNote);
	$notetext.appendTo($insideNote);
	$insideNote.appendTo($newnote);
	$newnote.css({
		'position': 'absolute',
		'top': noteData.y,
		'left': noteData.x
	});

	// Handling the events:
	$noteDelBtn.click(function() {
		var cId = $(this).parent().parent().attr('id');
		console.log('<Input> Local Operation Detected: Deletion of Note #'+ cId +'.');
		jupiterClient.generate( {op: 'nDel', param: {id: cId}} ); // Generating the corresponding nDel operation.
		$(this).parent().parent().remove();
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
		var cId = $(this).parent().parent().attr('id');
		console.log('<Input> Local Operation Detected: Text Edit of Note #'+ cId +'.');
		updateNotesZIndex(cId, jupiterClient.notesNum);
		workerOperationsFromDiff.postMessage({newTxt: $(this).val(), oldTxt: jupiterClient.data[cId].text, id: cId});
		
		logPalsActivity(user, 'is editing the content of the note', cId);
	});

	$newnote.appendTo($notesDiv);
}

/**
 * updateNotesZIndex
 * ====
 * Modify the z-index of a given note so it gets on top, and decrement the z-index of all notes previously on top of it.
 * Parameters:
 *	- id (string):			ID of the note
 *	- max (int):			New max z-index
 * Output: /
 */
function updateNotesZIndex(id, max) {
	var currentZind = parseInt($('#'+id).css('z-index'));
	$('.note').each(function() {
		var nZind =  parseInt($(this).css('z-index'));
		if (nZind > currentZind) { $(this).css('z-index', ''+(nZind-1)); }
	});
	$('#'+id).css('z-index', max);
}

/**
 * doGetCaretPosition
 * ====
 * Returns the position of the caret in an text element
 * Parameters:
 *	- ctrl (DOM El):		DOM element
 * Output: Int
 */
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

/**
 * setCaretPosition
 * ====
 * Edits the position of the caret in an text element
 * Parameters:
 *	- ctrl (DOM El):		DOM element
 *	- pos (int):			New position
 * Output: /
 */
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


// ---------------------------
// UTILITY Functions
// ---------------------------


/**
 * dateToString
 * ====
 * Returns a unique string for a given date
 * Parameters:
 *	- date (Date):			Date
 * Output: String
 */
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

/**
 * dateToPrettyString
 * ====
 * Returns a readable string for a given date
 * Parameters:
 *	- temp (Date):			Date
 * Output: String
 */
function dateToPrettyString(temp) {
		
    	if (!temp) temp = new Date();
    	return padStr2(temp.getFullYear()) + '/' +
		padStr2(1 + temp.getMonth()) + '/' +
		padStr2(temp.getDate()) + ' ' +
		padStr2(temp.getHours()) + ':' +
		padStr2(temp.getMinutes()) + ':' +
		padStr2(temp.getSeconds());
}

function padStr2(i) {
    return (i < 10) ? "0" + i : "" + i;
}

function padStr3(i) {
    return (i < 10) ? "00" + i : (i < 100) ? "0" + i : i;
}

function randomColor(){
    return 'hsl('+Math.floor(Math.random()*360)+','+(20 + Math.floor(Math.random()*80))+'%,'+ (20 + Math.floor(Math.random()*60))+'%)';
}
