var http = require('http');
var fs = require('fs');

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});


// Lancement de MQTT
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost');

client.on('connect', function () {
  client.subscribe('#')
})

// Chargement de socket.io
var io = require('socket.io').listen(server);

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    // Quand le serveur reçoit un signal de type "message" du client
    socket.on('message', function (message) {
        //on stock l'image dans MQTT
        client.publish('barbabot/image', JSON.stringify({id: (new Date()).getTime(), image: message}));
    });
});

server.listen(3000);
