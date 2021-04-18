const net = require('net');

// const socket = socketIO.connect()
const socket = new net.Socket();

socket.setEncoding = 'UTF-8';

socket.connect(8338, '127.0.0.1', () => {
  console.log('linajieshangle .....');
  socket.write('hello World');
});

// var socket = io.connect('http://127.0.0.1:8081');
//         socket.on('message', function(data) {
//             console.log(data.text);
//         })
 
//         $("#btn").click(function() {
//             socket.emit('clientmessage', {
//                 text: "hello"
//             });
//         });