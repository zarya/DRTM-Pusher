var sys = require('sys');
var net = require('net');
var ip = require('ip');
var fs = require('fs');

var DMRStore = {};
var connect_counter = {};

//
//
// socketio

var io = require('socket.io')();

io.sockets.on('connection', function(socket) {
  
  // do stuff when client connects
  writeDMRStore();
  var address = socket.handshake.address;
  console.log('Connection from: ' + address + " (" + socket.id + ")");
  connect_counter[socket.id] = address;
  console.log("Client count: " + Object.keys(connect_counter).length);

  // emit to just this socket 
  for (var prop in DMRStore) {
    socket.emit('mqtt', {
      'topic': String(prop),
      'payload': String(DMRStore[prop])
    });
  }

  // remove client on disconnect
  socket.on('disconnect', function() {
    console.log("Client disconnected: " + connect_counter[this.id] + " (" + this.id + ")");
    delete connect_counter[this.id];
    console.log("Client count: " + Object.keys(connect_counter).length);
  });

});

io.listen(5000);

//
//
// mqtt

var mqtt = require('mqtt');
var client = mqtt.connect({
  host: '172.18.203.238',
  port: 1883,
  reconnectPeriod: 1000
});

client.on('connect', function() {
  readDMRStore();
  client.subscribe("hytera/#");
})

client.on('message', function(topic, payload) {
  DMRStore[topic] = String(payload);
  io.sockets.emit('mqtt', {
    'topic': String(topic),
    'payload': String(payload)
  });
});




var writeDMRStore = function() {
  fs.writeFile("/tmp/dmrstore", JSON.stringify(DMRStore), function(err) {
    if (err) {
      return console.log(err);
    }
  });
}

var readDMRStore = function() {
  fs.readFile('/tmp/dmrstore', 'utf8', function(err, data) {
    if (err) {
      return console.log(err);
    }
    DMRStore = JSON.parse(data);
  });
}
