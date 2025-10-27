const express = require('express');
const router = express.Router();
const { 
    getAllBorrowedBooksInfo, 
    getBorrowedBooksByEmail, 
    addBorrowedBookInfo, 
    deleteBorrowedBook 
} = require('../controllers/borrowedBooksController');

// Get all borrowed books info
router.get('/borrowedBooksInfo', getAllBorrowedBooksInfo);

// Get all borrowed books for a specific user
router.get('/borrowedBooks/:email', getBorrowedBooksByEmail);

// Insert Borrowed book info by Post
router.post('/addBorrowedBookInfo', addBorrowedBookInfo);

// Delete Borrowed book by Id
router.delete('/deleteBorrowedBook/:id', deleteBorrowedBook);

module.exports = router;