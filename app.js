//server.js
var express = require('express');
var app = express();
var server = require('http').Server(app);
//var io = require("ws").Server

var io = require('socket.io')(server);
var fs = require('fs');
var port = process.env.PORT || 3000;
var Particle = require('particle-api-js');
var firebase = require("firebase");

var particle = new Particle();
var db = new firebase("https://capstoneee475.firebaseio.com/");
var prev_values = [];



server.listen(port, function () {
  //console.log('Server listening at port %d', port);
});

// Setting up the express server
app.use(express.static(__dirname + '/public'));

io.sockets.on("connection", function (socket) {  
    // to make things interesting, have it send every second
    var interval = setInterval(function () {
      //myFirebaseRef.once("value", function(snapshot) {
      db.on("value", function(snapshot) {  
        snapshot.forEach(function(childSnapshot) {
          //console.log("inside interval");
          var key = childSnapshot.key();
          var childData = childSnapshot.val();
          //console.log(key + " " + childData);
          io.sockets.emit("receiveData", {"term": key, "occupied": childData});
        });
      });
    }, 50);

    particle.getEventStream({name: 'EE475Capstone-SpotChanged', auth: 'f8093528e7b81caceeaecd0569423df524dffbab'}).then(function(stream) {
      stream.on('event', function(data) {
        // Gives the spot number
        //console.log("Data[data]  " + data["data"]);
        spot_data = data["data"].split("-");
        // Gives the device ID
        var deviceId = data["coreid"];
        //myFirebaseRef.child(spot_data[0]).set(spot_data[1]);
        db.child(spot_data[0]).set(spot_data[1]);
        //io.sockets.emit("receiveData", {"occupied" : spot_data[1], "term" : spot_data[0]});
      });
    });

    socket.on("searchPhrase", function (searchTerm) {
        //console.log("inside searchPhrase server");
        if (searchTerm.length > 0) {
          //console.log("search phrase is: " + searchTerm);
          var insert_val = {};
          // Set option to occupied here
          db.child(searchTerm).set(1);
        }
    });

    socket.on("disconnect", function () {
        clearInterval(interval);
    });
});

