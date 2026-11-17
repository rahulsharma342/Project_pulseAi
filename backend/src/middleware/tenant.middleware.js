
import User from '../models/users.model.js';

// This middleware gets the logged-in user's company details
export const attachTenant = async (req, res, next) => {
    try {

        // Find the user using the ID stored by auth middleware
        const user = await User.findById(req.userId)

            // Fetch only tenantId and role, not the entire user document
            .select('tenantId role');

        // If user does not exist, stop the request
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Attach the user's company ID to the request
        // Other controllers can use req.tenantId to filter company data
        req.tenantId = user.tenantId;

        // Attach the user's role (owner, admin, or member)
        // This can be used later for role-based permissions
        req.userRole = user.role;

        // Continue to the next middleware or controller
        next();

    } catch (error) {

        // Print error in the backend terminal for debugging
        console.error('Tenant Middleware Error:', error);

        // Send an error response to the client
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
