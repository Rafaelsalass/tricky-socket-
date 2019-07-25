// express for creating the server
import express from 'express';
// enable http communcation
import http from 'http';
// create and manage sockets
import io from 'socket.io';

import uuidv1 from 'uuid/v1';

const app = express();
const httpServer = http.createServer(app);
const socketIo = io(httpServer);

let users = {};
let games = {};

app.get('/', (req, res) => {
  res.send("<h1>Hello im the socket sever, I'm runing happily</h1>");
})

socketIo.on('connection', socket => {
  console.log(`user have connected: ${socket.id}`);

  // update users array adding the new user
  users = { ...users, [socket.id]: {name: ''}};

  // broadcast users to all clients
  socketIo.emit('user_update', users);

  socket.on('disconnect', function(){
    console.log(`user have disconnected: ${socket.id}`);

    // removing the user that is disconnecting
    delete users[socket.id];
    console.log(users);

    // broadcast users to all clients
    socketIo.emit('user_update', users);
  });

  socket.on('name_update', (user_name) => {
    // update user name
    users = { ...users, [socket.id]: {
      ...users[socket.id],
      name: user_name
    }};

    // broadcast users to all clients
    socketIo.emit('user_update', users);
  });

  socket.on('create_game', () => {
    let gameAlreadyExist = false;
    Object.keys(games).map(key => {
      if(games[key].creator === socket.id) {
        gameAlreadyExist = true;
      }
    });
    if (!gameAlreadyExist) {
      games = {
        ...games,
        [uuidv1()]: {
          creator: socket.id,
          playerOne: socket.id,
          gameStatus: {
            status: 'waiting on player two',
          },
        }
      }
      socketIo.emit('game_update', games);
    }
  });
});

const PORT = 8000;
httpServer.listen(PORT, () => {
 console.log(`listening on port ${PORT}`);
});
