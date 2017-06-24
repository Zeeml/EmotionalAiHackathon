module.exports = function() {
  // [START vision_face_detection]
  // Imports the Google Cloud client library
  // Instantiates a client
  this.vision = (require('@google-cloud/vision'))();

  this.analyze = function(fileName, callback) {
    // Performs face detection on the local file
    this.vision.detectFaces(fileName)
      .then(callback)
      .catch((err) => {
        console.error('ERROR:', err);
      });
    // [END vision_face_detection]
  }

  // The path to the local image file, e.g. "/path/to/image.png"
  // const fileName = '/path/to/image.png';


}
