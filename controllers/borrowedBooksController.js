const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');

// Get all borrowed books info
const getAllBorrowedBooksInfo = async (req, res) => {
    try {
        const { borrowedBooksCollection } = await getCollections();
        const borrowedBooksInfo = await borrowedBooksCollection.find().toArray();
        res.send(borrowedBooksInfo);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch borrowed books info' });
    };
};

// Get all borrowed books for a specific user
const getBorrowedBooksByEmail = async (req, res) => {
    try {
        const { booksCollection, borrowedBooksCollection } = await getCollections();
        const email = req.params.email;

        // Find all borrowed entries by this user
        const borrowedBooks = await borrowedBooksCollection.find({ email }).toArray();
        // Extract all bookId values
        const bookIds = borrowedBooks.map(book => new ObjectId(book.bookId));
        // Find all borrowed books with those bookIds from booksCollection
        const books = await booksCollection.find({ _id: { $in: bookIds } }).toArray();

        // Merge borrowed info with book info
        const booksWithInfo = books.map(book => {
            const borrowedInfo = borrowedBooks.find(b => b.bookId === book._id.toString());
            return {
                ...book,
                ...borrowedInfo
            };
        });
        res.send(booksWithInfo);
    } catch (error) {
        return res.status(500).send({ error: 'Failed to fetch borrowed books' });
    };
};

// Insert Borrowed book info by Post
const addBorrowedBookInfo = async (req, res) => {
    try {
        const { borrowedBooksCollection } = await getCollections();
        const borrowedInfo = req.body;
        const { email, bookId } = borrowedInfo;

        // Check if user has borrowed 3 books already
        const totalBorrowed = await borrowedBooksCollection.countDocuments({ email });
        if (totalBorrowed >= 3) {
            return res.status(403).send({ message: "You can't borrow more than 3 books!" });
        };

        // Check if the user has already borrowed this book
        const alreadyBorrowed = await borrowedBooksCollection.findOne({ email, bookId });
        if (alreadyBorrowed) {
            return res.status(400).send({ message: "You have already borrowed this book." });
        };

        const newInfo = await borrowedBooksCollection.insertOne(borrowedInfo);
        res.send(newInfo);
    } catch (error) {
        res.status(500).send({ error: "Failed to add borrowed book info" });
    };
};

// Delete Borrowed book by Id
const deleteBorrowedBook = async (req, res) => {
    try {
        const { borrowedBooksCollection } = await getCollections();
        const id = req.params.id;

        const result = await borrowedBooksCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: "Failed to delete borrowed book" });
    };
};

module.exports = {
    getAllBorrowedBooksInfo,
    getBorrowedBooksByEmail,
    addBorrowedBookInfo,
    deleteBorrowedBook
};