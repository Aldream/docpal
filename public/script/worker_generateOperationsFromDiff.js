/**
 * =================
 * Worker - GenerationOperationsFromDiff
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * For two given versions of a text, finds the differences between (using Google's diff-match-patch lib) and generates from those diffs the Jupiter operations to execute.
 * Each Jupiter operations is posted as a message to the Master.
 */

importScripts('lib/diff_match_patch_20121119/diff_match_patch.js');   

var diffMatchPatchFunc = new diff_match_patch(); // Text-diff Processor
	
/* oEvent.data = {
 *		id: 	ID of the modified note
 *		oldTxt:	Previous version of the content of the note
 *		newTxt:	New version of the content
 * }
 */
onmessage = function (oEvent) {
	var diffs = diffMatchPatchFunc.diff_main(oEvent.data.oldTxt, oEvent.data.newTxt);
	var currentPosition = 0;
	for (var x = 0; x < diffs.length; x++) {
		var op = diffs[x][0]; // Operation (insert, delete, equal)
		var data = diffs[x][1]; // Text of change.
		switch (op) {
			case DIFF_INSERT:
				postMessage( {op: "sIns", param: {id: oEvent.data.id, pos: currentPosition, str: data, size: data.length}} ); // Generating the corresponding sIns operation.
				currentPosition += data.length; // Moving carret of the size of the string.

				break;
			case DIFF_DELETE:
				postMessage( {op: "sDel", param: {id: oEvent.data.id, pos: currentPosition, size: data.length}} ); // Generating the corresponding sDel operation.
				break;
			case DIFF_EQUAL:
				// We move the carret of data.length:
				currentPosition += data.length;
				// Do nothing
				break;
		}
	}
};
