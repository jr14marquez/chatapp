var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};



/* Server: Create server and respond depending on request. */
var server = http.createServer(function(request, response){
	var filePath = false;

	if(request.url == '/'){ filePath = 'public/index.html'; }
	else { filePath = 'public' + request.url; }

	var absPath = './' + filePath;
	serveStatic(response,cache,absPath);
});

/*start the server and liston on TCP/IP port 3000*/
server.listen(3000, function(){
	console.log("Server listening on port 3000.");
});

/* chatServer: load functionality from custom Node module
 * that supplies login to handle Socket.IO-based server-side
 * chat functionality.
 */
var chatServer = require('./lib/chat_server');
chatServer.listen(server);

/* Handle 404 errors when requested file is not found on server.*/
function send404(response){
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found.');
	response.end();
}

/* Serve File data. First write appropriate http header then
 * send the contents of the file.
*/
function sendFile(response, filePath, fileContents){
	response.writeHead(
		200,
		{"Content-Type": mime.lookup(path.basename(filePath))}
	);
	response.end(fileContents);
}

/* serveStatic: Checks if file is cached in memory, and if it is serves file from
 * memory using sendFile. 
 * If not cached, check if the file exists and read file from disk, cache file,
 * and then serve up the file.
*/
function serveStatic(response, cache, absPath){
	if(cache[absPath]){
		sendFile(response, absPath, cache[absPath]);
	}else{
		fs.exists(absPath, function(exists){
			if(exists){

				fs.readFile(absPath, function(err, data){
					if(err){ 
						send404(response);
					}else{
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			}else{
				send404(response);
			}
		});
	}
}
