/*Declarations: Allow the use of Socket.IO and define chat state*/
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

/* Start Socket.IO server allowing it to piggback on existing http server */
exports.listen = function(server){
	io = socketio.listen(server);
	io.set('log level', 1);

	/* Define how each user connection is handled and assign
	 * user a guest name when the initially connect.
	 */
	io.sockets.on('connection',function(socket){
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

		/* Place user in lobby room when they connect*/
		joinRoom(socket,'Lobby');

		/* Handle user messages, name change attempts,
		 * and room creation/changes
		 */
		handleMessageBroadCasting(socket,nicknames);
		handleNameChangeAttempts(socket,nickNames,namesUsed);
		handleRoomJoining(socket);

		/* Provide user with list of occupied rooms on request */
		socket.on('rooms', function(){
			socket.emit('rooms', io.sockets.manager.rooms);
		});

		/* Define cleanup login for when a user disconnects. */
		handleClientDisconnection(socket, nicknames, namesUsed);
	});
};

/* assignGuestName: Handles naming of users. Initial conneciton puts new user in
 * the lobby. GuestName is incremented on each new guest and stored in the 
 * nickNames variable along with the internal socket id for reference. The guestName
 * is also added to namesUsed variable.
 */
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
 	var name = 'Guest' + guestNumber;
 	nickNames[socket.id] = name;
 	socket.emit('nameResult', {
 		sucess: true,
 		name: name
 	});
 	namesUsed.push(name);
 	return guestNumber + 1;
 }

 /* joinRoom: Hanldes logic related to a user joining a chat room.
  */
function joinRoom(socket, room){
	socket.join(room);
 	currentRoom[socket.id] = room;
 	socket.emit('joinResult', {room: room});
 	socket.broadcast.to(room).emit('message', {
 		text: nickNames[socket.id] + ' has joined ' + room + '.'
 	});

	var usersInRoom = io.sockets.clients(room);
 	if(usersInRoom.length > 1){
 		var usersInRoomSummary = 'Users currently in ' + room + ': ';
 		for(var index in usersInRoom){
 			var userSocketId = usersInRoom[index].id;
 			if(userSocketId != socket.id){
 				if(index > 0){
 					usersInRoomSummary += ', ';
 				}
 				usersInRoomSummary += nickNames[userSocketId];
 			}
 		}
 		usersInRoomSummary += '.';
 		socket.emit('message', {text: usersInRoomSummary});
	}
}

/* handleNameChangeAttempts: Handles user requests to change their name. Cant
 * begin with Guest and can't already be used.
 */
function handleNameChangeAttempts(socket, nickNames, namesUsed){
	socket.on('nameAttempt', function(name){
  		/* Dont allow names to begin with "Guest". */
  		if(name.indexOf('Guest') == 0){
  			socket.emit('nameResult', {
  				success: false,
  				message: 'Names cannot begin with "Guest".'
  			});
  		}else{
  			/* If name isnt already registered, register it. */
  			if(namesUsed.indexOf(name) == 1){
  				var previousName = nickNames[socket.id];
  				var previousNameIndex = namesUsed.indexOf(previousName);
  				namesUsed.push(name);
  				nickNames[socket.id] = name;
  				/* Remove previous name to make available for future clients. */
  				delete namesUsed[previousNameIndex];
  				socket.emit('nameResult', {
  					success: true,
  					name: name
  				});
  				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
  					text: previousName + ' is now known as ' + name + '.'
  				});
  			}else{
  				socket.emit('nameResult', {
  					success: false,
  					message: 'That name is already in use.'
  				});
  			}
  		}
  	});
}

/* handleMessageBroadcasting: user emits an event indeicating room where
 * the message is to be sent along with the text.
 */
function handleMessageBroadcasting(socket){
	socket.on('message',function(message){
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ': ' + message.text
		});
	});
}

/* handleRoomJoining: allows a user to join an existing room or create one if
 * doesn't exist.
 */
function handleRoomJoining(socket){
 	socket.on('join', function(room){
 		socket.leave(currentRoom[socket.id]);
 		joinRoom(socket,room.newRoom);

 	});
}

/* handleClientDisconnection: Remove users nickname from nickNames and namesUsed*/
function handleClientDisconnection(socket){
	socket.on('disconnect',function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}











