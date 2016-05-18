//server.js
var express = require('express');
var app = express();
var server = require('http').Server(app);
//var io = require("ws").Server

var io = require('socket.io')(server);
var fs = require('fs');
var port = process.env.PORT || 3000;
var Particle = require('particle-api-js');
var mongoose = require( 'mongoose');

/*mongoose.connect('mongodb://localhost:27017/parking');
var Schema = mongoose.Schema;
var spotContent = new Schema({
    spot    : {type: String,  index: true},
    occupied    : Number,
    updated_at : Date
});

var spotDB = mongoose.model( 'spotContent', spotContent);
var db = mongoose.connection;

function updateDB (spot_id){
  var db = mongoose.connection;
  db.on('open', function(){  
    console.log("inside the db.on");
    var new_spot_entry = new spotDB({
      spot: spot_id,
      occupied: 1,
      updated_at: new Date()
    });

    new_spot_entry.save(function(err){
      if (err) throw err;
      console.log("Spot Saved Successfully");
    });
  });
}*/

/*db.once('open', function(){
  console.log("Connected to DB");
  //do operations which involve interacting with DB.

  var spot_0 = new spotDB({
    spot: "spot_0",
    occupied: 0,
    updated_at: new Date()
  });

  spot_0.save(function(err){
    if ( err ) throw err;
    console.log("Spot Saved Successfully");
  });

  var spot_1 = new spotDB({
    spot: "spot_1",
    occupied: 0,
    updated_at: new Date()
  });

  spot_1.save(function(err){
    if ( err ) throw err;
    console.log("Spot Saved Successfully");
  });

  var spot_2 = new spotDB({
    spot: "spot_2",
    occupied: 0,
    updated_at: new Date()
  });

  spot_2.save(function(err){
    if ( err ) throw err;
    console.log("Spot Saved Successfully");
  });
}); */

app.get('/parking', function(req, res) {
  mongoose.model('spotContent').find(function(err, parking) {
    res.send(parking);
  })
});


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


io.sockets.on("connection", function (socket) {  
    // to make things interesting, have it send every second
    var interval = setInterval(function () {
      socket.emit("receiveData", {"Message": "Hello from the server"});

    }, 10000);

    socket.on("searchPhrase", function (searchTerm) {
        //console.log("inside searchPhrase server");
        if (searchTerm.length > 0) {
          console.log("search phrase is: " + searchTerm);
          //updateDB(searchTerm);
          io.sockets.emit("updateTable", {"occupied" : "spots[searchTerm]", "term" : searchTerm});
        }
    });

    socket.on("disconnect", function () {
        clearInterval(interval);
    });
});

