const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
    patientId: String,
    filename: String,
    filepath: String,
    originalname: String,
    mimetype: String,
    size: Number,
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('Upload', uploadSchema);