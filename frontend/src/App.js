import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io("http://localhost:4000");

function Square({ value, onSquareClick }) {
    return (
        <button className="square" onClick={onSquareClick}>
            {value}
        </button>
    );
}

function Board({ squares, onPlay }) {
    const handleClick = (i) => {
        onPlay(i);
    };

    return (
        <>
            <div className="board-row">
                <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
                <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
                <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
            </div>
            <div className="board-row">
                <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
                <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
                <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
            </div>
            <div className="board-row">
                <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
                <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
                <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
            </div>
        </>
    );
}

export default function Game() {
    const [game, setGame] = useState({
        board: Array(9).fill(null),
        currentPlayer: "X",
        players: [],
    });
    const [isTurn, setIsTurn] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        socket.on('gameStart', (gameData) => {
            setGame(gameData);
            setIsTurn(socket.id === gameData.players[0]);
            setErrorMessage("");
        });

        socket.on('moveMade', (gameData) => {
            setGame(gameData);
            setIsTurn(socket.id === gameData.players[gameData.currentPlayer === "X" ? 0 : 1]);
            setErrorMessage("");
        });

        socket.on('gameReset', (gameData) => {
            setGame(gameData);
            setIsTurn(socket.id === gameData.players[0]);
            setErrorMessage("");
        });

        socket.on('gameOver', ({ winner, board }) => {
            setGame({ ...game, board });
            setErrorMessage(`Player ${winner} wins!`);
        });

        socket.on('invalidMove', (message) => {
            setErrorMessage(message);
        });

        socket.on('playerDisconnected', (gameData) => {
            setGame(gameData);
            setErrorMessage("Player disconnected. Waiting for a new player...");
        });

        socket.on('connect_error', (error) => {
            console.error("WebSocket connection error:", error.message);
        });

        socket.on('disconnect', () => {
            console.log("Disconnected from server");
        });

        return () => {
            socket.off('gameStart');
            socket.off('moveMade');
            socket.off('gameReset');
            socket.off('gameOver');
            socket.off('invalidMove');
            socket.off('playerDisconnected');
            socket.off('connect_error');
            socket.off('disconnect');
        };
    }, []);

    const handlePlay = (index) => {
        if (!isTurn) {
            setErrorMessage("It's not your turn.");
            return;
        }

        socket.emit("makeMove", { index });
    };

    const resetGame = () => {
        socket.emit("resetGame");
    };

    return (
        <div className="game">
            <div className="game-board">
                <Board
                    squares={game.board}
                    onPlay={handlePlay}
                />
            </div>
            <div className="game-info">
                <button onClick={resetGame}>Reset Game</button>
                {errorMessage && <p>{errorMessage}</p>}
            </div>
        </div>
    );
}