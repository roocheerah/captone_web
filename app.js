//server.js
var express = require('express');
var app = express();
var server = require('http').Server(app);
//var io = require("ws").Server

var io = require('socket.io')(server);
var fs = require('fs');
var port = process.env.PORT || 3000;
var Particle = require('particle-api-js');
var Firebase = require("firebase");

var particle = new Particle();
var myFirebaseRef = new Firebase("https://capstoneee475.firebaseio.com/");
var prev_values = [];

io.on('connection', function(socket){
  particle.getEventStream({name: 'EE475Capstone-SpotChanged', auth: 'f8093528e7b81caceeaecd0569423df524dffbab'}).then(function(stream) {
    
    stream.on('event', function(data) {
      // Gives the spot number
      console.log("Data[data]  " + data["data"]);
      spot_data = data["data"].split("-");
      // Gives the device ID
      var deviceId = data["coreid"];
      io.sockets.emit("updateTable", {"occupied" : spot_data[1], "term" : spot_data[0]});
    });

  });

});

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Setting up the express server
app.use(express.static(__dirname + '/public'));

io.sockets.on("connection", function (socket) {  
    // to make things interesting, have it send every second
    var interval = setInterval(function () {
      myFirebaseRef.once("value", function(snapshot) {
      // The callback function will get called twice, once for "fred" and once for "barney"
      snapshot.forEach(function(childSnapshot) {
        // key will be "fred" the first time and "barney" the second time
        var key = childSnapshot.key();
        // childData will be the actual contents of the child
        var childData = childSnapshot.val();
        io.sockets.emit("receiveData", {"term": key, "occupied": childData});
      });
    });

    }, 50);

    socket.on("searchPhrase", function (searchTerm) {
        //console.log("inside searchPhrase server");
        if (searchTerm.length > 0) {
          console.log("search phrase is: " + searchTerm);
          //updateDB(searchTerm);
          // Keeps replacing the spot with the new one
          var insert_val = {};
          // TODO: Change to occupied or not 
          //insert_val[searchTerm] = 1;
          myFirebaseRef.child(searchTerm).set(1);
          //myFirebaseRef.once("value", function(snapshot) { console.log(snapshot.child("occupied").val()); });
          io.sockets.emit("updateTable", {"occupied" : "1", "term" : searchTerm});
        }
    });

    socket.on("disconnect", function () {
        clearInterval(interval);
    });
});

