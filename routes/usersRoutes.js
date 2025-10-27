const express = require('express');
const router = express.Router();
const { verifyFbToken, verifyTokenEmail, verifyAdmin } = require('../utils/middleware');
const { 
    createUser, 
    getUserByEmail, 
    updateUser, 
    deleteUser,
    getAllUsers
} = require('../controllers/usersController');

// Create a new user (no authentication required as this is called during registration)
router.post('/users', createUser);

// Get all users (admin only)
router.get('/users', verifyFbToken, verifyTokenEmail, verifyAdmin, getAllUsers);

// Get user by email (authenticated users can get their own info)
router.get('/users/:email', verifyFbToken, verifyTokenEmail, getUserByEmail);

// Update user by email (authenticated users can update their own info)
router.patch('/users/:email', verifyFbToken, verifyTokenEmail, updateUser);

// Delete user by email (admin only)
router.delete('/users/:email', verifyFbToken, verifyTokenEmail, verifyAdmin, deleteUser);

module.exports = router;