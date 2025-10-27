const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');

// Get all books with optional category + pagination
const getAllBooks = async (req, res) => {
    try {
        const { booksCollection } = await getCollections();
        const category = req.query.category;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        // Query Setup
        const query = {};
        if (category) {
            query.category = category;
        };

        const skip = (page - 1) * limit;
        const totalBooks = await booksCollection.countDocuments(query);
        const totalPages = Math.ceil(totalBooks / limit);

        const books = await booksCollection
            .find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        res.send({
            books,
            totalBooks,
            totalPages,
            currentPage: page
        });

    } catch (err) {
        res.status(500).send({ message: "Server error" });
    };
};

// Get books by user email with pagination
const getBooksByUser = async (req, res) => {
    try {
        const { booksCollection } = await getCollections();
        const email = req.params.email;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        // Query Setup - filter by author email (which is the user's email)
        const query = { authorEmail: email };

        const skip = (page - 1) * limit;
        const totalBooks = await booksCollection.countDocuments(query);
        const totalPages = Math.ceil(totalBooks / limit);

        const books = await booksCollection
            .find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        res.send({
            books,
            totalBooks,
            totalPages,
            currentPage: page
        });

    } catch (err) {
        res.status(500).send({ message: "Server error" });
    };
};

// Get books statistics for admin dashboard
const getBooksStatistics = async (req, res) => {
    try {
        const { booksCollection, borrowedBooksCollection } = await getCollections();
        
        // Get total books count
        const totalBooks = await booksCollection.countDocuments();
        
        // Get total unique books (distinct titles)
        const uniqueBooks = await booksCollection.distinct('bookTitle');
        const totalUniqueBooks = uniqueBooks.length;
        
        // Get total books in stock (sum of all quantities)
        const booksInStock = await booksCollection.aggregate([
            {
                $group: {
                    _id: null,
                    totalStock: { $sum: "$quantity" }
                }
            }
        ]).toArray();
        const totalStock = booksInStock.length > 0 ? booksInStock[0].totalStock : 0;
        
        // Get total borrowed books
        const totalBorrowed = await borrowedBooksCollection.countDocuments();
        
        // Get books by category
        const booksByCategory = await booksCollection.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        
        res.send({
            totalBooks,
            totalUniqueBooks,
            totalStock,
            totalBorrowed,
            booksByCategory
        });

    } catch (err) {
        console.error("Error fetching books statistics:", err);
        res.status(500).send({ message: "Server error" });
    };
};

// Get a single book by Id
const getBookById = async (req, res) => {
    try {
        const { booksCollection } = await getCollections();
        const id = req.params.id;

        const book = await booksCollection.findOne({ _id: new ObjectId(id) });
        res.send(book);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch book' });
    };
};

// Get top 10 rating books by sorting
const getTopRatingBooks = async (req, res) => {
    try {
        const { booksCollection } = await getCollections();
        
        const books = await booksCollection
            .find()
            .sort({ rating: -1 })
            .limit(10)
            .toArray();

        res.send(books);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch top rating books' });
    };
};

// Get top users by books added
const getTopUsersByBooks = async (req, res) => {
    try {
        const { booksCollection } = await getCollections();
        
        // Aggregate books by author email and count them
        const topUsers = await booksCollection.aggregate([
            {
                $group: {
                    _id: "$authorEmail",
                    booksCount: { $sum: 1 },
                    authorName: { $first: "$authorName" }
                }
            },
            {
                $sort: { booksCount: -1 }
            },
            {
                $limit: 10
            }
        ]).toArray();
        
        res.send(topUsers);
    } catch (err) {
        console.error("Error fetching top users by books:", err);
        res.status(500).send({ message: "Server error" });
    };
};

// Insert book by Post
const addBook = async (req, res) => {
    try {
        const { booksCollection } = await getCollections();
        const book = req.body;

        const newBook = await booksCollection.insertOne(book);
        res.send(newBook);
    } catch (error) {
        res.status(500).send({ error: "Failed to add book" });
    };
};

// Update book info by Patch
const updateBook = async (req, res) => {
    try {
        const { booksCollection } = await getCollections();
        const id = req.params.id;
        const updatedBook = req.body;
        
        // Add timestamp for updates
        const bookWithTimestamp = {
            ...updatedBook,
            updatedAt: new Date()
        };

        const result = await booksCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: bookWithTimestamp }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({ message: 'Book not found' });
        }

        res.send(result);
    } catch (error) {
        res.status(500).send({ error: "Failed to update book" });
    };
};

// Delete book by ID
const deleteBook = async (req, res) => {
    try {
        const { booksCollection } = await getCollections();
        const id = req.params.id;

        const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: "Failed to delete book" });
    };
};

module.exports = {
    getAllBooks,
    getBooksByUser,
    getBooksStatistics,
    getBookById,
    getTopRatingBooks,
    addBook,
    updateBook,
    getTopUsersByBooks,
    deleteBook
};