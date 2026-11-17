
import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
// Middleware to identify the logged-in user's company
import { attachTenant } from '../middleware/tenant.middleware.js';

import {
    registerUser,
    loginUser,
    logoutUser
} from '../controllers/auth.controller.js';

const router = express.Router();

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Logout
router.post('/logout', logoutUser);

// Get logged-in user's details and company information
// protect: verifies JWT token
// attachTenant: fetches user's tenantId and role
router.get('/me', protect, attachTenant, (req, res) => {

    res.status(200).json({
        success: true,
        message: 'User authenticated successfully',

        // Logged-in user's ID
        userId: req.userId,

        // User's company ID
        tenantId: req.tenantId,

        // User's role: owner, admin or member
        role: req.userRole
    });
});

export default router;
