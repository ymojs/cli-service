import SocketIO from 'socket.io';
import * as http from 'http';

function registerEventHandler(socket) {
  let currentAddress: null | string;

  socket.on('connect', function(socket) {
    console.log('connect>>>>>>>>>');
    if (currentAddress) {
      socket.emit('blocked');
    }
    console.log('!!!!!!1');
    console.log(socket);
    // currentAddress = socket.handshake.address;
    socket.on('disconnect', () => {
      currentAddress = null;
    });
    // 绑定事件处理
    // registerCmdHandler(socket)
    // registerCliHandler(socket)
    socket.emit('connect');
  });
}

function createSocket(server: http.Server) {
  const socketIO = SocketIO(server);

  registerEventHandler(socketIO.of('/cmd'));
}

export default createSocket;