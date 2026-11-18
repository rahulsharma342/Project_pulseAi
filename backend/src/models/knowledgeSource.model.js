
import mongoose from 'mongoose';

// Schema for storing a company's knowledge sources
const knowledgeSourceSchema = new mongoose.Schema({

    // Company ID: tells us which tenant owns this source
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },

    // Name given to the knowledge source
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Source type: website or PDF document
    type: {
        type: String,
        enum: ['website', 'pdf'],
        required: true
    },

    // Website URL or uploaded PDF file path
    sourceUrl: {
        type: String,
        required: true,
        trim: true
    },
    // Store extracted text from website or PDF
content: {
    type: String,
    default: ''
},

    // Processing status of the source
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    }

}, {
    // Automatically adds createdAt and updatedAt
    timestamps: true
});

// Create KnowledgeSource model
const KnowledgeSource = mongoose.model(
    'KnowledgeSource',
    knowledgeSourceSchema
);

export default KnowledgeSource;
