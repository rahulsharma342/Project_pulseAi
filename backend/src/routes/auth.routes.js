
import express from 'express';

import { protect } from '../middleware/auth.middleware.js';
import { attachTenant } from '../middleware/tenant.middleware.js';

import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser
} from '../controllers/auth.controller.js';

const router = express.Router();

// Register new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Logout user
router.post('/logout', logoutUser);

// Get logged-in user's details
router.get('/me', protect, attachTenant, getCurrentUser);

export default router;
