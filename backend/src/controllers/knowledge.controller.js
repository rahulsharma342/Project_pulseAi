
import KnowledgeSource from '../models/knowledgeSource.model.js';

// Add a new knowledge source for the logged-in company
export const createKnowledgeSource = async (req, res) => {
    try {

        // Get source details from frontend request
        const { name, type, sourceUrl } = req.body;

        // Check whether all required fields are provided
        if (!name || !type || !sourceUrl) {
            return res.status(400).json({
                success: false,
                message: 'Name, type and sourceUrl are required'
            });
        }

        // Allow only website or PDF sources
        if (!['website', 'pdf'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid source type'
            });
        }

        // Create a new knowledge source in MongoDB
        const knowledgeSource = await KnowledgeSource.create({

            // Company ID comes from tenant middleware, not frontend
            tenantId: req.tenantId,

            // Source name
            name,

            // Source type: website or pdf
            type,

            // Website URL or PDF path
            sourceUrl
        });

        // Send successful response
        return res.status(201).json({
            success: true,
            message: 'Knowledge source created successfully',
            data: knowledgeSource
        });

    } catch (error) {

        // Print error in backend terminal
        console.error('Create Knowledge Source Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Get all knowledge sources of the logged-in company
export const getKnowledgeSources = async (req, res) => {
    try {

        // Find only those sources that belong to this company
        const sources = await KnowledgeSource.find({
            tenantId: req.tenantId
        })
        .sort({ createdAt: -1 }); // Latest sources first

        // Send sources to frontend
        return res.status(200).json({
            success: true,
            count: sources.length,
            data: sources
        });

    } catch (error) {

        // Print error in backend terminal
        console.error('Get Knowledge Sources Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Delete a knowledge source belonging to the logged-in company
export const deleteKnowledgeSource = async (req, res) => {
    try {

        // Get source ID from the URL parameter
        const { id } = req.params;

        // Find and delete only if this source belongs to the logged-in company
        const source = await KnowledgeSource.findOneAndDelete({
            _id: id,
            tenantId: req.tenantId
        });

        // If source does not exist or belongs to another company
        if (!source) {
            return res.status(404).json({
                success: false,
                message: 'Knowledge source not found'
            });
        }

        // Send successful response
        return res.status(200).json({
            success: true,
            message: 'Knowledge source deleted successfully'
        });

    } catch (error) {

        // Log error in backend terminal
        console.error('Delete Knowledge Source Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
