// Set up express and application server
var express = require('express');
var app = express();

// Set up the different sockets for communication
var server = require('http').Server(app);
var io = require('socket.io')(server);

// Set up the firebase db root
var firebase = require("firebase");

// Particle Photon API set-up for node js
var Particle = require('particle-api-js');
var particle = new Particle();

// Get heroku or localhost:3000 port
var port = process.env.PORT || 3000;

/* PHOTON DEVICE CONSTANTS */
var AUTH_TOKEN = 'f8093528e7b81caceeaecd0569423df524dffbab';
var DEVICE_ID_1 = '310047000447343232363230';
var DEVICE_ID_2 = '33003b000d47343233323032';
//var DEVICE_ID_1 = '1234';
//var DEVICE_ID_2 = '5678';

/* FIREBASE CONSTANTS */
var ROOT_PATH = 'https://giftprompt.firebaseio.com/';
var root_db = new firebase(ROOT_PATH);

// Stores the previous values from the last time it was checked in the database
var prev_values = [];

// Ensures that the number of variables in the cloud (aka number of spots) is only retreived once
// at the beginning of the boot up
var flag = true;

// Setting up the server to listen to designated port
server.listen(port, function () {
  //console.log('Server listening at port %d', port);
});
app.use(express.static(__dirname + '/public'));


/*  NOW CONNECTING TO SOCKETS FOR REAL TIME COMMUNICATION    */


io.sockets.on("connection", function (socket) {  
    console.log("Connected inside");
    // RUNS EVERY 50 MS
    var interval = setInterval(function () {
      
      // Scan and update the firebase table initially
      if (flag) {
        flag = false;
        // Device ID of the photon
        console.log("Inside the flag");
        getNumVariable(DEVICE_ID_1);
        getNumVariable(DEVICE_ID_2);

        /* UNCOMMENT TO ADD MORE PHOTON DEVICES */
        //getNumVariable(DEVICE_ID_2);
        //getNumVariable('PHOTON ID#');
        //getNumVariable('PHOTON ID#');
      }

      // Checking first photon values
      var photon_1_db = root_db.child(DEVICE_ID_1);

      photon_1_db.on("value", function(snapshot) {  
        // Gives the number of dates
        var last_child = snapshot.numChildren();
        var child_count = 0;
        snapshot.forEach(function(childSnapshot) {
          child_count++;
          // Last date in the photon device
          if (child_count === last_child) {
            var date_db = photon_1_db.child(childSnapshot.key());
            date_db.on('child_added', function(dateChild, prev_key){
              var spot = dateChild.key();
              var status = dateChild.val()['occupied'];
              //console.log(spot);
              //console.log(status);
              io.sockets.emit("receiveData", {"term": DEVICE_ID_1 + ' ' + spot, "occupied": status});

            });
          }
        });

        //io.sockets.emit("receiveData", {"term": DEVICE_ID_1 + ' spot0', "occupied": 1});

      });

      
      // Checking first photon values
      var photon_2_db = root_db.child(DEVICE_ID_2);

      photon_2_db.on("value", function(snapshot) {
        // Gives the number of dates
        var last_child = snapshot.numChildren();
        //console.log('last_child ' + last_child);    
        var child_count = 0;
        snapshot.forEach(function(childSnapshot) {
          child_count++;
          // Last date in the photon device
          if (child_count === last_child) {
            //console.log("inside the if");
            var date_db = photon_2_db.child(childSnapshot.key());
            date_db.on('child_added', function(dateChild, prev_key){
              console.log("inside the if");
              var spot = dateChild.key();
              var status = dateChild.val()['occupied'];
              console.log(spot);
              console.log(status);
              io.sockets.emit("receiveData", {"term": DEVICE_ID_2 + ' ' + spot, "occupied": status});

            });
          }
        });


      });
      

    }, 50);


    // Retrieves the number of spots each particle photon is keeping track of
    function getNumVariable(id) {
      particle.getVariable({ deviceId: id, name: "num_vars", auth: AUTH_TOKEN }).then(function(data) {
                                result = data.body.result;
                                for(var i = 0; i < result; i++) {
                                  var spot = "spot_" + i;
                                  getDataFromParticleCloud(spot, id);
                                }
                              }, function(err) {});                          
    }


    // Need a global flag for sampling each spot according to the variable
    function getDataFromParticleCloud(variable, id) {
        particle.getVariable({ deviceId: id, name: variable, auth: AUTH_TOKEN }).then(function(data) {
                                console.log('Device variable retrieved successfully:', data.body.result);
                                // Setting the values according to new format
                                var date = data.body.coreInfo["last_heard"].split(".");
                                date = date[0];
                                console.log("date is now: " + date);
                                firebaseEntry(id, date, variable, data.body.result);

                              }, function(err) {
                                //console.log('An error occurred while getting attrs:', err);
                              });                        
    }


    // Everytime an event changes call this function
    particle.getEventStream({name: 'EE475Capstone-SpotChanged', auth: AUTH_TOKEN}).then(function(stream) {
                              stream.on('event', function(data) {
                                // Gives the spot number
                                //console.log("Data[data]  " + data["data"]);
                                spot_data = data["data"].split("-");
                                var date = data["published-at"].split(".")[0];
                                // Gives the device ID
                                var deviceId = data["coreid"];
                                // Only records the spot that has changed
                                firebaseEntry(deviceId, date, spot_data[0], spot_data[1]);
                            });
    });


    // Makes a new entry in the database
    // Photon ID -> Unique Date -> Spot # -> occupied/not occupied
    function firebaseEntry(deviceId, date, spot_num, status) {
      var id_ref = root_db.child(deviceId);
      var date_ref = id_ref.child(date);
      var spot_ref = date_ref.child(spot_num);
      spot_ref.set({occupied: status});
    }
    
    socket.on("disconnect", function () {
        clearInterval(interval);
    });
});

