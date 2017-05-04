var socket = io.connect();

$(document).ready(function(){
	var chatApp = new Chat(socket);

	//Display results of name change
	socket.on('nameResult', function(result){
		var message;

		if(result.success){
			message = 'You are now known as ' + result.name + '.';
		}else{
			message = result.message;
		}
		$('#messages').append(divSystemContentElement(message));
	});

	//Display results of a room change
	socket.on('joinResult',function(result){
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room Changed.'));
	});

	//Display received messages
	socket.on('message',function(result){
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});

	//Display list of rooms available
	socket.on('rooms',function(result){
		$('#room-list').empty();

		for(var room in rooms){
			room = room.subString(1,room.length);
			if(room != ''){
				$('#room-list').append(divEscapedContentElement(room));
			}
		}
	});

	//Allow click of a room name to change to that room.
	socket.on('#room-list div').click(function(){
		chatApp.processCommand('/join ' + $(this).text());
		$('#send-message').focus();
	});

	//Request a list of rooms available intermittently
	setInterval(function(){
		socket.emit('rooms');
	},1000);

	$('#send-message').focus();

	//Allow submitting the form to send a chat message.
	$('#send-form').submit(function(){
		processUserInput(chatApp, socket);
		return false;
	});
});

/* divEscapedContentElement: used to escape raw text entered by
 * users so the cross site attacks dont happen.
 */
function divEscapedContentElement(message){
	return $('<div></div>').text(message);
}
/* divSystemContentElement: used to escape text sent from
 * the server.
 */
function divSystemContentElement(message){
	return $('<div></div>').html('<i>' + message + '</i>');
}

/* processUserInput: if text entered by user begins with a slash /
 * then it is processed as a command. If not then we broadcast the
 * message to the chat room.
 */
function processUserInput(chatApp, socket){
	var message = $('#send-message').val();
	var systemMessage;

	if(message.charAt(0) == '/'){
		systemMessage = chatApp.processCommand(message);
		if(systemMessage){
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	}else{
		chatApp.sendMessage($('#room').text(),message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}

	$('#send-message').val('';)
}

