const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo' },
  doctor: { type: String, required: true },
  doctorNumber: { type: Number, required: true }, // Add doctorNumber field
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'cancelled'], default: 'pending' },
  symptoms: { type: String, default: '' },
  checkedIn: { type: Boolean, default: false },
  roomNumber: { type: String, default: '' }, // Add roomNumber field
  waitingCount: { type: Number, default: 0 }, // Add waitingCount field
  consultationStarted: { type: Boolean, default: false }, // Add consultationStarted field
  consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' }
});

mongoose.model('Appointments', appointmentSchema);
