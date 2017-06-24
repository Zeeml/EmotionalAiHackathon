var http = require('http');
var fs = require('fs');
var azure = require('azure-storage');
var stream = require('stream');
var util = require('util');

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
var blobSvc = azure.createBlobService('hackathonai', 'zVt25VwRZ8P2CAhHkm3zCqKZkIn+5IswDzTv5Sm1voI07jObNisdGSn+xsM0e58B+o3LalZHmtkYsAp4JfE50A==', 'https://hackathonai.blob.core.windows.net/' );

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    // Quand le serveur reçoit un signal de type "message" du client
    socket.on('message', function (message) {
          //on stock l'image dans MQTT
          var matches = message.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          var response = new Buffer(matches[2], 'base64');
          var length = Buffer.byteLength(matches[2], 'utf8');
          var id =  (new Date()).getTime();

          client.publish('barbabot/image', JSON.stringify({id: id, image: message}));
          blobSvc.createBlockBlobFromStream('adil', id + '.png', new ReadableStreamBuffer(response), length, function(error, result, response){
              console.log(error);
              if(!error){
                // file uploaded
              }
          });
    });
});

var ReadableStreamBuffer = function (fileBuffer) {

        var that = this;
        stream.Stream.call(this);
        this.readable = true;
        this.writable = false;

        var frequency = 50;
        var chunkSize = 1024;
        var size = fileBuffer.length;
        var position = 0;

        var buffer = new Buffer(fileBuffer.length);
        fileBuffer.copy(buffer);

        var sendData = function () {
            if (size === 0) {
                that.emit("end");
                return;
            }

            var amount = Math.min(chunkSize, size);
            var chunk = null;
            chunk = new Buffer(amount);
            buffer.copy(chunk, 0, position, position + amount);
            position += amount;
            size -= amount;

            that.emit("data", chunk);
        };

        this.size = function () {
            return size;
        };

        this.maxSize = function () {
            return buffer.length;
        };

        this.pause = function () {
            if (sendData) {
                clearInterval(sendData.interval);
                delete sendData.interval;
            }
        };

        this.resume = function () {
            if (sendData && !sendData.interval) {
                sendData.interval = setInterval(sendData, frequency);
            }
        };

        this.destroy = function () {
            that.emit("end");
            clearTimeout(sendData.interval);
            sendData = null;
            that.readable = false;
            that.emit("close");
        };

        this.setEncoding = function (_encoding) {
        };

        this.resume();
    };
util.inherits(ReadableStreamBuffer, stream.Stream);

server.listen(3000);
