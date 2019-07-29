// express for creating the server
import express from "express";
// enable http communcation
import http from "http";
// create and manage sockets
import io from "socket.io";

import uuidv1 from "uuid/v1";

const app = express();
const httpServer = http.createServer(app);
const socketIo = io(httpServer);

let users = {};
let games = {};
let num = 0;

app.get("/", (req, res) => {
  res.send("<h1>Hello im the socket sever, I'm runing happily</h1>");
});

socketIo.on("connection", socket => {
  console.log(`user have connected: ${socket.id}`);

  // update users array adding the new user
  users = { ...users, [socket.id]: { name: "" } };

  // broadcast users to all clients
  socketIo.emit("user_update", users);

  // broadcast games to current users
  socketIo.emit("game_update", games);

  // broadcast num
  socketIo.emit("num_update", num);

  socket.on("disconnect", function() {
    console.log(`user have disconnected: ${socket.id}`);

    // removing the user that is disconnecting
    delete users[socket.id];

    // romoving game from the user that is disconnecting
    Object.keys(games).map(key => {
      if (games[key].creator === socket.id) {
        delete games[key];
      }
    })

    // broadcast games to current users
    socketIo.emit("game_update", games);

    // broadcast users to all clients
    socketIo.emit("user_update", users);
  });

  socket.on("name_update", user_name => {
    // update user name
    users = {
      ...users,
      [socket.id]: {
        ...users[socket.id],
        name: user_name
      }
    };

    // broadcast users to all clients
    socketIo.emit("user_update", users);
  });

  socket.on("num_update", () => {
    // update num
    num++;

    // broadcast users to all clients
    socketIo.emit("num_update", num);
  });

  socket.on("create_game", () => {
    let gameAlreadyExist = false;
    Object.keys(games).map(key => {
      if (games[key].creator === socket.id) {
        gameAlreadyExist = true;
      }
    });
    if (!gameAlreadyExist) {
      games = {
        ...games,
        [uuidv1()]: {
          creator: socket.id,
          playerOne: socket.id,
          playerTwo: undefined,
          gameStatus: {
            status: "waiting on player two"
          }
        }
      };
      // broadcast games to current users
      socketIo.emit("game_update", games);
    }
  });

  socket.on('delete_game_by_user', data => {
    delete games[data.gameKey];

    // broadcast games to current users
    socketIo.emit("game_update", games);
  })

  socket.on('join_game', data => {
    games[data.gameKey] = {
      ...games[data.gameKey],
      playerTwo: data.userKey,
    }
    console.log('entro ',games[data.gameKey].playerTwo,' a ',data.gameKey);
    // broadcast games to current users
    socketIo.emit("game_update", games);
  });

  socket.on('leave_game', data => {
    console.log('salio ',games[data.gameKey].playerTwo, ' de ',data.gameKey);
    delete games[data.gameKey].playerTwo;
    // broadcast games to current users
    socketIo.emit("game_update", games);
  });

});

const PORT = 8000;
httpServer.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
