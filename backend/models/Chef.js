import mongoose from 'mongoose'
const chefSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    currentOrderCount: {
        type: Number,
        default: 0
    },
    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

export default mongoose.model('Chef', chefSchema);