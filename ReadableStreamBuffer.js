var stream = require('stream');
var util = require('util');

module.exports.ReadableStreamBuffer = function (fileBuffer) {

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
    
util.inherits(module.exports.ReadableStreamBuffer, stream.Stream);
