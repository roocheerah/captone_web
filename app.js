//server.js
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var port = process.env.PORT || 3000;
var Particle = require('particle-api-js');
var MongoClient = require('mongodb').MongoClient;

var particle = new Particle();

var prev_data = [];

io.on('connection', function(socket){
  particle.getEventStream({name: 'EE475Capstone-SpotChanged', auth: 'f8093528e7b81caceeaecd0569423df524dffbab'}).then(function(stream) {
    stream.on('event', function(data) {
      // Gives the spot number
      console.log("Data[data]  " + data["data"]);
      spot_data = data["data"].split("-");
      // Gives the device ID
      var deviceId = data["coreid"];
      prev_data[spot_data[0]] = spot_data[1];
      socket.emit("updateTable", {"occupied" : spot_data[1], "term" : spot_data[0]});
      console.log("Previous data on the server side is :" + prev_data);
      socket.emit("prev", prev_data);
    });
  });
});



server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


// Setting up the express server
app.use(express.static(__dirname + '/public'));


io.on("connection", function (socket) {  
    // to make things interesting, have it send every second
    var interval = setInterval(function () {
      socket.emit("receiveData", {"Message": "Hello from the server"});

    }, 10000);

    socket.on("searchPhrase", function (searchTerm) {
        //console.log("inside searchPhrase server");
        if (searchTerm.length > 0) {
          console.log("search phrase is: " + searchTerm);
          getDataFromParticleCloud(searchTerm);
          socket.emit("updateTable", {"occupied" : spots[searchTerm], "term" : searchTerm});
        }
    });

    socket.on("disconnect", function () {
        clearInterval(interval);
    });
});

