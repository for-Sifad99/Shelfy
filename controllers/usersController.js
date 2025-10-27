// User controller for handling user-related operations
const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');

// Create a new user
const createUser = async (req, res) => {
    try {
        const { usersCollection } = await getCollections();
        const userData = req.body;
        
        // Validate required fields
        if (!userData.email) {
            return res.status(400).send({ message: 'Email is required' });
        }
        
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(409).send({ message: 'User already exists' });
        }
        
        // Set default role if not provided
        const userWithDefaults = {
            ...userData,
            role: userData.role || 'user',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await usersCollection.insertOne(userWithDefaults);
        res.status(201).send(result);
    } catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).send({ error: 'Failed to create user', details: error.message });
    }
};

// Get user by email
const getUserByEmail = async (req, res) => {
    try {
        const { usersCollection } = await getCollections();
        const { email } = req.params;
        
        // Validate email parameter
        if (!email) {
            return res.status(400).send({ message: 'Email parameter is required' });
        }
        
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        
        res.send(user);
    } catch (error) {
        console.error("Failed to fetch user:", error);
        res.status(500).send({ error: 'Failed to fetch user', details: error.message });
    }
};

// Update user by email
const updateUser = async (req, res) => {
    try {
        const { usersCollection } = await getCollections();
        const { email } = req.params;
        const updateData = req.body;
        
        // Validate email parameter
        if (!email) {
            return res.status(400).send({ message: 'Email parameter is required' });
        }
        
        // Allow role changes when explicitly provided (for admin operations)
        // Regular user updates should not include role changes for security
        const updateWithTimestamp = {
            $set: {
                ...updateData,
                updatedAt: new Date()
            }
        };
        
        const result = await usersCollection.updateOne(
            { email },
            updateWithTimestamp
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).send({ message: 'User not found' });
        }
        
        res.send(result);
    } catch (error) {
        console.error("Failed to update user:", error);
        res.status(500).send({ error: 'Failed to update user', details: error.message });
    }
};

// Delete user by email
const deleteUser = async (req, res) => {
    try {
        const { usersCollection, booksCollection } = await getCollections();
        const { email } = req.params;
        
        // Validate email parameter
        if (!email) {
            return res.status(400).send({ message: 'Email parameter is required' });
        }
        
        // First, delete all books added by this user
        await booksCollection.deleteMany({ authorEmail: email });
        
        // Then, delete the user
        const result = await usersCollection.deleteOne({ email });
        
        if (result.deletedCount === 0) {
            return res.status(404).send({ message: 'User not found' });
        }
        
        res.send({ message: 'User and their books deleted successfully' });
    } catch (error) {
        console.error("Failed to delete user:", error);
        res.status(500).send({ error: 'Failed to delete user', details: error.message });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const { usersCollection } = await getCollections();
        
        const users = await usersCollection.find().toArray();
        res.send(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        res.status(500).send({ error: 'Failed to fetch users', details: error.message });
    }
};

module.exports = {
    createUser,
    getUserByEmail,
    updateUser,
    deleteUser,
    getAllUsers
};