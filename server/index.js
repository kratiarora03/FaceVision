const { Server } = require("socket.io");
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
app.get('/', (req, res) => {
    res.send('Welcome to the server!');
  });

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const emailToSocketIdMap = new Map();
const socketIDToMap = new Map();

io.on('connection', (socket) => {
    console.log('Socket Connected', socket.id);
    
    socket.on("room:join", (data) => {
        const { email, room } = data;
        emailToSocketIdMap.set(email, socket.id);
        socketIDToMap.set(socket.id, email);
        socket.join(room);
        io.to(room).emit("user:joined", { email, id: socket.id });
        io.to(socket.id).emit("room:join", data);
    });

    socket.on('user:call', ({ to, offer }) => {
        io.to(to).emit('incoming:call', { from: socket.id, offer });
    });

    socket.on('call:accepted', ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    });

    socket.on('peer:nego:needed', ({ to, offer }) => {
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });

    socket.on('peer:nego:done', ({ to, answer }) => {
        io.to(to).emit("peer:nego:final", { from: socket.id, answer });
    });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
