/**
 * =================
 * CLASS - JupiterNode
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines a general node (client or server) in the Jupiter system.
 * The node can generate local changes on the shared data and send messages to inform other nodes, and received  
 */

/**
 * JupiterNode (Constructor)
 * ====
 * Parameters:
 *	- id (int):			ID of the node in the system
 *	- data (string):	Copy of the shared data manipulated by the node
 * Output: Instance of JupiterNode
 */
function JupiterNode(id, data) {
	// Attributes:
	this.id = id;			// int 		- ID of the node in the system
	this.data = data;		// string 	- Data manipulated by the node
	this.nodeMessages = 0;	// int		- Number of messages generated
	this.otherMessages = 0;	// int		- Number of messages received
	this.outgoing = [];		// queue	- Queue of the local operations not yet acknowledged by the server
}

/**
 * generate
 * ====
 * Applies a local operation and send a message to inform the system in order to propagate it.
 * Parameters:
 *	- msg (JSON Object):	Local operation to apply and send
 * Output: /
 */
JupiterNode.prototype.generate = function(msg)
{
	// Applying the operation locally:
	this.data = JupiterOp.apply(this.data, msg);
	msg.nMes = this.nodeMessages;
	msg.oMes = this.otherMessages;

	// Sending the operation to inform the rest of the system:
	this.send(msg);
	
	// Adding it to the list of unacknowledged operations:
	this.outgoing.push(msg);
	this.nodeMessages++;
};

/**
 * receive
 * ====
 * Applies an operation received from another node.
 * Potential conflicts with unacknowledged local operations are handled by applying the Transformation Rules.
 * Parameters:
 *	- msg ({num: int, op: Operation}):	Message from another node to apply on the local version.
 * Output: /
 */
JupiterNode.prototype.receive = function(msg)
{
	// TODO: if (this.otherMessages != msg.num) throw ERROR
	
	// Discarding acknowledged messages:
	while (this.outgoing.length > 0 && this.outgoing[0].nMes < msg.oMes) {
		this.data = JupiterOp.finalize(this.data, this.outgoing[0]);
		this.outgoing.shift();
	}
	
	// Transforming the incoming operations and the one in the queue:
	for (var i=0; i < this.outgoing.length; i++) {
		JupiterOp.xform(msg, this.outgoing[i]);
	}
	
	// Applying the operation locally:
	this.data = JupiterOp.apply(this.data, msg);
	this.otherMessages++;

	return msg;
};

/**
 * send (ABSTRACT)
 * ====
 * Sends a message to inform of a local operation.
 * If the node is a client, the message is sent to the coordinating server.
 * If the node is the server, the message is sent to all the client nodes except for the one the operation comes from.
 * Parameters:
 *	- op (Operation):	Operation.
 * Output: /
 */
JupiterNode.prototype.send = null;
