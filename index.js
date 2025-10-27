const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const admin = require("firebase-admin");
const { connectDB, getCollections } = require('./config/database');
const routes = require('./routes');

// Firebase Service Token Process
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decoded);

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
    origin: ["http://localhost:5174", 'http://localhost:5173', "http://localhost:3000", 'https://shelfybook.netlify.app'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware:
app.use(cors(corsOptions));
app.use(express.json());

// Socket.io setup with CORS
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5174", 'http://localhost:5173', "http://localhost:3000", 'https://shelfybook.netlify.app'],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', async (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining
    socket.on('join', async (userData) => {
        try {
            // Get user from database to verify admin status
            const { usersCollection } = await getCollections();
            const user = await usersCollection.findOne({ email: userData.email });
            
            const userWithRole = {
                ...userData,
                isAdmin: user ? user.role === 'admin' : false
            };
            
            connectedUsers.set(socket.id, userWithRole);
            console.log('User joined:', userWithRole);
        } catch (error) {
            console.error('Error verifying user role:', error);
            // Default to non-admin if there's an error
            connectedUsers.set(socket.id, { ...userData, isAdmin: false });
        }
    });

    // Handle new book rating
    socket.on('newRating', (ratingData) => {
        // Broadcast to all connected admin users only
        connectedUsers.forEach((userData, socketId) => {
            if (userData.isAdmin) {
                socket.to(socketId).emit('ratingNotification', ratingData);
            }
        });
        console.log('New rating:', ratingData);
    });

    // Handle new book comment
    socket.on('newComment', (commentData) => {
        // Broadcast to all connected admin users only
        connectedUsers.forEach((userData, socketId) => {
            if (userData.isAdmin) {
                socket.to(socketId).emit('commentNotification', commentData);
            }
        });
        console.log('New comment:', commentData);
    });

    // Handle new book post
    socket.on('newBook', (bookData) => {
        // Broadcast to all connected admin users only
        connectedUsers.forEach((userData, socketId) => {
            if (userData.isAdmin) {
                socket.to(socketId).emit('bookNotification', bookData);
            }
        });
        console.log('New book posted:', bookData);
    });

    // Handle new book borrow
    socket.on('newBorrow', (borrowData) => {
        // Broadcast to all connected admin users only
        connectedUsers.forEach((userData, socketId) => {
            if (userData.isAdmin) {
                socket.to(socketId).emit('borrowNotification', borrowData);
            }
        });
        console.log('New book borrowed:', borrowData);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        connectedUsers.delete(socket.id);
        console.log('User disconnected:', socket.id);
    });
});

// Verify Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Home route:
app.get('/', (req, res) => {
    res.send('<h1>This is cool a 📖book collection!</h1>');
});

// Use all routes
app.use('/api', routes);

// 404 route:
app.use((req, res) => {
    res.status(404).send(
        `<div style=" padding-top: 20px; text-align:center;">
        <h1 style="color: #ff735c">⚠️Page Not Found!</h1>
        <a style="color:blue;" href='/'>Back Home</a>
        </div>`
    );
});

async function startServer() {
    try {
        // Connect to database
        await connectDB();

        const port = process.env.PORT || 5000;
        const host = '0.0.0.0';

        server.listen(port, host, () => {
            console.log(`🚀 Server running on port ${port}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

startServer();