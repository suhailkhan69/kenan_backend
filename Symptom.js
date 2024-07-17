const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo', required: true },
    symptoms: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    appointmentDate: { type: Date }
});

mongoose.model('Symptoms', symptomSchema);
