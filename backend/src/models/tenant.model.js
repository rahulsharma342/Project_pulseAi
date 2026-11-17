
import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    plan: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free'
    },

    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    }

}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;
