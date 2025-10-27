const admin = require("firebase-admin");
const { getCollections } = require('../config/database');

// Verify Firebase Token
const verifyFbToken = async (req, res, next) => {
    const authHeader = req.headers?.authorization;

    // Check if authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized access! Missing or invalid authorization header.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        // Verify Firebase ID token
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;
        next();
    } catch (error) {
        console.error('Firebase token verification error:', error);
        return res.status(401).send({ message: 'Unauthorized access! Invalid token.' });
    }
};

// Check if decoded email exists
const verifyTokenEmail = async (req, res, next) => {
    if (!req.decoded?.email) {
        return res.status(403).send({ message: 'Forbidden access! Email not found in token.' });
    }
    next();
};

// Verify if user is admin
const verifyAdmin = async (req, res, next) => {
    const email = req.decoded?.email;
    
    // First check if email exists in token
    if (!email) {
        return res.status(403).send({ message: 'Forbidden access! Email not found in token.' });
    }
    
    try {
        // Get user from database
        const { usersCollection } = await getCollections();
        const user = await usersCollection.findOne({ email });
        
        // Check if user exists and has admin role
        if (!user) {
            return res.status(404).send({ message: 'User not found in database.' });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).send({ message: 'Forbidden access! Admin privileges required.' });
        }
        
        // User is admin, proceed to next middleware
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).send({ message: 'Internal server error during admin verification.' });
    }
};

module.exports = {
    verifyFbToken,
    verifyTokenEmail,
    verifyAdmin
};