var http = require('http');
var fs = require('fs');

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

// Chargement de socket.io
var io = require('socket.io').listen(server);

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    // Quand le serveur reçoit un signal de type "message" du client
    socket.on('message', function (message) {
        console.log(message);
    });
});


// controller.js
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost');

client.on('connect', () => {
  client.subscribe('#')
});

client.on('message', (topic, message) => {
    console.log("message recieved : " + message.toString());
    io.emit('message', {topic: topic, message:message.toString()});
});


server.listen(3000);
