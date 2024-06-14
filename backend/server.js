const express = require("express");
const http = require("http")
const { Server } = require("socket.io");
const cors = require("cors");

const app = express()
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors());

let gameState = {
    board: Array(9).fill(null),
    currentPlayer: "X",
    players: [],
};

const calculateWinner = (squares) => {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }

    return null;
};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    if (gameState.players.length < 2) {
        gameState.players.push(socket.id);
        socket.emit('gameStart', gameState);
        if (gameState.players.length === 2) {
            io.emit('gameStart', gameState);
        }
    } else {
        socket.emit('gameError', 'Game is full');
    }

    socket.on('makeMove', ({ index }) => {
        if (socket.id !== gameState.players[gameState.currentPlayer === "X" ? 0 : 1] || gameState.board[index]) {
            socket.emit('invalidMove', 'It is not your turn or the move is invalid.');
            return;
        }

        gameState.board[index] = gameState.currentPlayer;
        gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";

        const winner = calculateWinner(gameState.board);
        if (winner) {
            io.emit('gameOver', { winner, board: gameState.board });
        } else {
            io.emit('moveMade', gameState);
        }
    });

    socket.on('resetGame', () => {
        gameState = {
            board: Array(9).fill(null),
            currentPlayer: "X",
            players: gameState.players,
        };
        io.emit('gameReset', gameState);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        gameState.players = gameState.players.filter(player => player !== socket.id);
        if (gameState.players.length < 2) {
            gameState = {
                board: Array(9).fill(null),
                currentPlayer: "X",
                players: gameState.players,
            };
        }
        io.emit('playerDisconnected', gameState);
    });
});


app.get("/", (req, res) => {
    res.send("Server is running")
})

server.listen(4000, () => {
    console.log("Server running on PORT: 4000");
})