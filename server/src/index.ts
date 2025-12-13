import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Game } from './classes/Game';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
    }
});

const game = new Game(io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('JOIN_GAME', (name: string) => {
        const success = game.addPlayer(socket.id, name);
        if (!success) {
            socket.emit('ERROR', 'Game is full');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        game.removePlayer(socket.id);
    });

    socket.on('START_GAME', () => {
        // Only host or first player can start? For now anyone.
        game.startGame();
    });

    socket.on('BID', (data: { amount: number }) => {
        game.handleBid(socket.id, data.amount);
    });

    socket.on('SELECT_TRUMP', (data: { suit: any, friends: any[] }) => {
        game.handleSelectTrumpAndFriends(socket.id, data.suit, data.friends);
    });

    socket.on('PLAY_CARD', (card: any) => {
        game.handlePlayCard(socket.id, card);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
