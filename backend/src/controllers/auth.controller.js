
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import User from '../models/users.model.js';
import Tenant from '../models/tenant.model.js';

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Register User
export const registerUser = async (req, res) => {
    try {
        // Get registration details from frontend
        const { name, email, password, companyName } = req.body;

        // Check if all fields are provided
        if (!name || !email || !password || !companyName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Normalize email before checking database
        const normalizedEmail = email.toLowerCase().trim();

        // Check whether email is already registered
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password before storing it in MongoDB
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate IDs before creating either document
        // This solves the circular reference between User and Tenant
        const tenantId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        // Create Tenant with the future owner's User ID
        const tenant = await Tenant.create({
            _id: tenantId,
            companyName: companyName.trim(),
            owner: userId
        });

        // Create User with the Tenant ID
        const user = await User.create({
            _id: userId,
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            tenantId: tenant._id,
            role: 'owner'
        });

        // Generate JWT after successful registration
        const token = generateToken(user._id);

        // Store JWT in an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Send successful registration response
        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                tenantId: user.tenantId,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Register Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Login User
export const loginUser = async (req, res) => {
    try {
        // Get email and password from frontend
        const { email, password } = req.body;

        // Validate login fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user using normalized email
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        // Check whether user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare entered password with hashed password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        // Reject incorrect password
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT for authenticated user
        const token = generateToken(user._id);

        // Set JWT in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Send successful login response
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                tenantId: user.tenantId,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Logout User
export const logoutUser = (req, res) => {

    // Clear authentication cookie
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    // Send logout response
    return res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};
