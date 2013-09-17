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
 * Generate
 * ====
 * Apply a local operation and send a message to inform the system in order to propagate it.
 * Parameters:
 *	- op (Operation):	Local operation to apply and send
 * Output: /
 */
JupiterNode.prototype.Generate = function(/* Operation */ op)
{

};

/**
 * Receive
 * ====
 * Apply an operation received from another node.
 * Potential conflicts with unacknowledged local operations are handled by applying the Transformation Rules.
 * Parameters:
 *	- op (Operation):	Operation from another node to apply on the local version.
 * Output: /
 */
JupiterNode.prototype.Receive = function(/* Operation */ op)
{
  // TODO
};