const express = require('express');
const router = express.Router();

// Import route modules
const booksRoutes = require('./booksRoutes');
const borrowedBooksRoutes = require('./borrowedBooksRoutes');
const usersRoutes = require('./usersRoutes');

// Use route modules
router.use('/', booksRoutes);
router.use('/', borrowedBooksRoutes);
router.use('/', usersRoutes);

module.exports = router;