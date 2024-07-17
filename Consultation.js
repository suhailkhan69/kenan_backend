const mongoose = require('mongoose');
const { Schema } = mongoose;

const consultationSchema = new mongoose.Schema({
    patientId: String,
    selectedOption: String,
    additionalNotes: String,
    estimatedTime: { type: String, default: '' },
    // other fields as needed
});

mongoose.model('Consultation', consultationSchema);
