const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// URI:
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q1etiuc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Changed from true to false to allow commands not in API Version 1
        deprecationErrors: true,
    }
});

// Function to connect to database
async function connectDB() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();
        return client.db('books-library');
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        throw error;
    }
}

// Function to get collections
async function getCollections() {
    const db = await connectDB();
    return {
        booksCollection: db.collection('books'),
        borrowedBooksCollection: db.collection('BorrowedBooksInfo'),
        usersCollection: db.collection('users')
    };
}

module.exports = {
    connectDB,
    getCollections
};
