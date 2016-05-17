//server.js
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var port = process.env.PORT || 3000;
var Particle = require('particle-api-js');

var particle = new Particle();

var spots = [];

function getDataFromParticleCloud(variable) {
  particle.getVariable({ deviceId: '310047000447343232363230',
                         name: variable,
                         auth: 'f8093528e7b81caceeaecd0569423df524dffbab'
                       }).then(function(data) {
                          console.log('Device variable retrieved successfully:', data.body);
                          spots[variable] = data.body.occupied;
                          // If occupied, update the table, 
                          // If not occupied, "Vacant"
                        }, function(err) {
                          //console.log('An error occurred while getting attrs:', err);
                        });  
}


server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


// Setting up the express server
app.use(express.static(__dirname + '/public'));


io.on('connection', function(socket){
   console.log('connection');

  socket.on('CH01', function (from, msg) {
    console.log('MSG', from, ' saying ', msg);
  });

});


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

