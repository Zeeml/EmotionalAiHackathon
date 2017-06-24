var http = require('http');
var fs = require('fs');
var config = require('./config');
var googleHandler = new (require('./GoogleHandler.js'))();
var microsoftHanbdler = new (require('./microsoftHanbdler'))(config);

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

// Lancement de MQTT
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost', {clean: true});

client.on('connect', function () {
  client.subscribe('#')
})

// Chargement de socket.io
var io = require('socket.io').listen(server);

var start = process.hrtime();

var elapsed_time = function(note){
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
    start = process.hrtime(); // reset the timer
}

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    // Quand le serveur reçoit un signal de type "message" du client
    var id = 1;
    socket.on('message', function (message) {
          id = message.id;
          image = message.image;
          //on stock l'image dans MQTT
          client.publish(config.MqttImageBase64Channel, JSON.stringify({id: id, image: image}));
           elapsed_time("sent to azure storage");
          microsoftHanbdler.send(id, image, function(error, result, response) {
            if(!error){
                client.publish(config.MqttImageUrlChannel, JSON.stringify({id: id, url:'https://hackathonai.blob.core.windows.net/adil/' + id + '.png'}));
            } else {
                console.log(error);
            }
            elapsed_time("Storage done");

          });
    });

    client.on('message', (topic, message) => {
        if (topic == config.MqttImageUrlChannel) {
            message = JSON.parse(message.toString());
            /*googleHandler.analyze(message.url, function(results) {
                const faces = results[0];
                console.log('Faces:');
                faces.forEach((face, i) => {
                  console.log(face);
                });

            });*/
            microsoftHanbdler.analyze(message.url, function(err, res, body) {
                  if (typeof body == 'object' && typeof body.error == "undefined" && body.length > 0) {
                    body.forEach(function(data) {
                      socket.emit('score', {id: message.id, response: data})

                    });
                  } else {
                    socket.emit('score', 'empty')
                  }
            })

        }
    });

});

console.log("http server started");
server.listen(3000);
