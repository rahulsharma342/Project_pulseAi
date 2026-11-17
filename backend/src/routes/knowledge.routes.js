
import express from 'express';

// Import authentication middleware
import { protect } from '../middleware/auth.middleware.js';

// Import tenant middleware
import { attachTenant } from '../middleware/tenant.middleware.js';

// Import knowledge controllers
import {
    createKnowledgeSource,
    getKnowledgeSources,
    deleteKnowledgeSource
} from '../controllers/knowledge.controller.js';

const router = express.Router();

// Create a new knowledge source
// 1. Verify JWT token
// 2. Identify user's company
// 3. Save knowledge source in database
router.post(
    '/',
    protect,
    attachTenant,
    createKnowledgeSource
);
// Get all knowledge sources of logged-in company
router.get(
    '/',
    protect,          // Verify JWT token
    attachTenant,     // Identify user's company
    getKnowledgeSources // Fetch company sources
);

// Delete a knowledge source
router.delete(
    '/:id',
    protect,                // Verify JWT token
    attachTenant,           // Identify user's company
    deleteKnowledgeSource   // Delete company's source
);

export default router;
