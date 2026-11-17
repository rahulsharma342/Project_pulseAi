
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
        const { name, email, password, companyName } = req.body;

        // Validate fields
        if (!name || !email || !password || !companyName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check existing user
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        const tenantId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        // Create Tenant
        const tenant = await Tenant.create({
            companyName,
            _id: tenantId,
            owner: userId
        });

        // Create User
        const user = await User.create({
            _id: userId,
            name,
            email,
            password: hashedPassword,
            tenantId,
            role: 'owner'
        });

        // Update tenant owner
        tenant.owner = user._id;
        await tenant.save();

        // Generate token
        const token = generateToken(user._id);

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

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
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    return res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};
