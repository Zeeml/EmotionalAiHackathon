module.exports = function(config) {
   this.azure = require('azure-storage');
   this.request = require('request');


   this.blobSvc = this.azure.createBlobService(config.MicrosoftstorageAccount, config.MicrosoftStorageAccessKey, config.MicrosoftHost);


   this.send = function(id, image, callback) {
     var matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
     var response = new Buffer(matches[2], 'base64');
     var length = Buffer.byteLength(matches[2], 'utf8');
     var readableStreamBuffer = require('./ReadableStreamBuffer').ReadableStreamBuffer;


     this.blobSvc.createBlockBlobFromStream(config.MicrosoftBucketName, id + '.png', new readableStreamBuffer(response), length, callback);
   }

   this.analyze = function(url, callback) {
     this.request({
           headers: {
             'Ocp-Apim-Subscription-Key': config.MicrosoftSubscriptionKey,
             'Content-Type': 'application/json'
           },
           uri: 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
           json: {"url": url},
           method: 'POST'
         }, callback);
   }


}
