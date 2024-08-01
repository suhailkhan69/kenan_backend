const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { Admin, initializeAdmin } = require('./Admin');
const { LabStaff, initializeLabStaff } = require('./LabStaff');
const { PharmacyStaff, initializePharmacyStaff } = require('./PharmacyStaff');
const { ReceptionStaff, initializeReceptionStaff } = require('./ReceptionStaff');
const { notifyPatient } = require('./websocketServer');
const Feedback = require('./Feedback');


// Use CORS middleware
app.use(cors());

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const mongoUrl = "mongodb+srv://hospitalbackend09:suhailabinav@cluster0.jzslu8d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoUrl).then(() => {
    console.log("db connected");
    initializeAdmin();
    initializeLabStaff();
    initializePharmacyStaff();
    initializeReceptionStaff();
}).catch((e) => {
    console.log(e);
});

// Import schemas
require('./Userdetails');
require('./Appointment');
require('./DoctorDetails');
require('./Consultation');
require('./Upload');

// Create models
const User = mongoose.model("UserInfo");
const Appointment = mongoose.model("Appointments");
const Doctor = mongoose.model("DoctorInfo");
const Consultation = mongoose.model("Consultation");
const Upload = mongoose.model("Upload");

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
    res.send({ status: "started" });
});

app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = new User({ name, email, password });
        await user.save();
        res.send({ status: "ok", data: "user created", userId: user.id });
    } catch (error) {
        res.send({ status: "error", data: error.message });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
        const token = jwt.sign({ _id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.send({ status: "ok", data: "login successful", token: token, user });
    } else {
        res.send({ status: "error", data: "Invalid credentials" });
    }
});

// Admin login route
app.post("/admin/login", async (req, res) => {
    await handleLogin(req, res, Admin);
});

app.post("/lab/login", async (req, res) => {
    await handleLogin(req, res, LabStaff);
});

app.post("/pharmacy/login", async (req, res) => {
    await handleLogin(req, res, PharmacyStaff);
});

app.post("/reception/login", async (req, res) => {
    await handleLogin(req, res, ReceptionStaff);
});

// Generic login handler
async function handleLogin(req, res, StaffModel) {
    const { email, password } = req.body;
    try {
        const staff = await StaffModel.findOne({ email, password });
        if (staff) {
            const token = jwt.sign({ _id: staff._id }, 'your_jwt_secret', { expiresIn: '1h' });
            res.send({ status: "ok", data: "login successful", token: token, staff: { email: staff.email } });
        } else {
            res.send({ status: "error", data: "Invalid credentials" });
        }
    } catch (error) {
        res.send({ status: "error", data: error.message });
    }
}

app.post("/api/appointments", async (req, res) => {
    const { doctor, doctorNumber, date, patientId, symptoms } = req.body;
    try {
        const appointment = await Appointment.create({
            patientId: patientId,
            doctor: doctor,
            doctorNumber: doctorNumber,
            date: new Date(date),
            status: 'pending',
            symptoms: symptoms,
            checkedIn: false
        });
        res.send({ status: "ok", data: appointment });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.get("/api/appointments", async (req, res) => {
    try {
        const appointments = await Appointment.find().populate('patientId', 'name');
        res.send({ status: "ok", data: appointments });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.get("/api/doctor/:number/appointments", async (req, res) => {
    const { number } = req.params;
    try {
        const appointments = await Appointment.find({ 
            doctorNumber: number, 
            status: 'approved', 
            checkedIn: true 
        }).populate('patientId', 'name');
        res.send({ status: "ok", data: appointments });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.get("/api/appointments/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).send({ status: "error", data: "Appointment not found" });
        }
        res.send({ status: "ok", data: appointment });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.patch("/api/appointments/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'cancelled'].includes(status)) {
        return res.status(400).send({ status: "error", data: "Invalid status value" });
    }
    try {
        const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
        if (!appointment) {
            return res.status(404).send({ status: "error", data: "Appointment not found" });
        }
        res.send({ status: "ok", data: appointment });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.patch("/api/appointments/:id/date", async (req, res) => {
    const { id } = req.params;
    const { date } = req.body;
    try {
        const appointment = await Appointment.findByIdAndUpdate(id, { date: new Date(date) }, { new: true });
        if (!appointment) {
            return res.status(404).send({ status: "error", data: "Appointment not found" });
        }
        res.send({ status: "ok", data: appointment });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.patch("/api/appointments/:id/checkedin", async (req, res) => {
    const { id } = req.params;
    const { checkedIn } = req.body;
    try {
        const appointment = await Appointment.findByIdAndUpdate(id, { checkedIn }, { new: true });
        if (!appointment) {
            return res.status(404).send({ status: "error", data: "Appointment not found" });
        }
        res.send({ status: "ok", data: appointment });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.get("/api/appointments/approved-checkedin", async (req, res) => {
    try {
        const appointments = await Appointment.find({ status: 'approved', checkedIn: true });
        console.log('Fetched Appointments:', appointments);
        res.send({ status: "ok", data: appointments });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.post("/doctor/signup", async (req, res) => {
    const { name, email, password, number } = req.body;
    try {
        const doctor = new Doctor({ name, email, password, number });
        await doctor.save();
        res.send({ status: "ok", data: "doctor created", doctorId: doctor.id });
    } catch (error) {
        res.send({ status: "error", data: error.message });
    }
});

app.post("/doctor/login", async (req, res) => {
    const { email, password, number } = req.body;
    const doctor = await Doctor.findOne({ email, password, number });
    if (doctor) {
        const token = jwt.sign({ _id: doctor._id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.send({ status: "ok", data: "login successful", token: token, doctor });
    } else {
        res.send({ status: "error", data: "Invalid credentials" });
    }
});

app.get("/api/patient/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const patient = await User.findById(id);
        const appointment = await Appointment.findOne({ patientId: id, status: 'approved', checkedIn: true });
        if (!patient || !appointment) {
            return res.status(404).send({ status: "error", data: "Patient or Appointment not found" });
        }
        res.send({ status: "ok", data: { patient, symptoms: appointment.symptoms } });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.post("/api/patient/:id/consultation", async (req, res) => {
    const { id } = req.params;
    const { selectedOption, additionalNotes } = req.body;
    try {
        const appointment = await Appointment.findOne({ patientId: id, status: 'approved', checkedIn: true });
        if (!appointment) {
            console.error("Appointment not found for patient ID:", id);
            return res.status(404).send({ status: "error", data: "Appointment not found" });
        }

        const consultation = new Consultation({
            patientId: id,
            selectedOption,
            additionalNotes
        });

        await consultation.save();

        appointment.consultation = consultation._id;
        await appointment.save();

        console.log("Consultation saved:", consultation);
        res.send({ status: "ok", data: consultation });
    } catch (error) {
        console.error("Error creating consultation", error);
        res.status(500).send({ status: "error", data: error.message });
    }
});
  
app.get("/api/patient/:id/latest-consultation", async (req, res) => {
    const { id } = req.params;
    try {
        const consultation = await Consultation.findOne({ patientId: id }).sort({ createdAt: -1 });
        if (!consultation) {
            return res.status(404).send({ status: "error", data: "No consultation found" });
        }
        res.send({ status: "ok", data: consultation });
    } catch (error) {
        console.error("Error fetching latest consultation", error);
        res.status(500).send({ status: "error", data: error.message });
    }
});
  
app.get("/api/consultations", async (req, res) => {
    try {
        const consultations = await Consultation.find();
        res.send({ status: "ok", data: consultations });
    } catch (error) {
        console.error("Error fetching consultations", error);
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.post('/api/upload/:patientId', upload.single('file'), async (req, res) => {
    const { patientId } = req.params;
    try {
        if (!req.file) {
            return res.status(400).send({ status: "error", data: "No file uploaded" });
        }

        const fileData = new Upload({
            patientId: patientId,
            filename: req.file.filename,
            filepath: req.file.path,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        await fileData.save();

        res.send({ status: "ok", data: "File uploaded successfully", file: fileData });
    } catch (error) {
        console.error('Error in file upload:', error);
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.get('/api/uploads/:patientId', async (req, res) => {
    const { patientId } = req.params;
    try {
        const files = await Upload.find({ patientId });
        res.send({ status: "ok", data: files });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.get("/api/patient/:patientId/appointment-status", async (req, res) => {
    const { patientId } = req.params;
    console.log(`Fetching appointment status for patient ID: ${patientId}`); // Debug log

    try {
        const appointment = await Appointment.findOne({ patientId }).sort({ date: -1 });
        if (!appointment) {
            console.log(`Appointment not found for patient ID: ${patientId}`); // Debug log
            return res.status(404).send({ status: "error", data: "Appointment not found" });
        }

        const doctor = await Doctor.findOne({ number: appointment.doctorNumber });
        if (!doctor) {
            console.log(`Doctor not found for doctor number: ${appointment.doctorNumber}`); // Debug log
            return res.status(404).send({ status: "error", data: "Doctor not found" });
        }

        const startOfDay = new Date(appointment.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(appointment.date);
        endOfDay.setHours(23, 59, 59, 999);

        const waitingCount = await Appointment.countDocuments({
            doctorNumber: appointment.doctorNumber,
            checkedIn: true,
            date: { $gte: startOfDay, $lte: endOfDay },
            _id: { $lt: appointment._id } // Only count appointments before the current one
        });

        const stage = appointment.consultationStarted ? 'consultation_started' : (appointment.checkedIn ? 'checked_in' : 'initial');

        res.send({
            status: "ok",
            data: {
                stage,
                appointment: {
                    ...appointment.toObject(),
                    doctorName: doctor.name,
                    roomNumber: doctor.roomNumber,
                    waitingCount,
                    consultation: appointment.consultation || {}
                }
            }
        });
    } catch (error) {
        console.error('Error fetching appointment status:', error); // Enhanced error logging
        res.status(500).send({ status: "error", data: error.message });
    }
});

  
app.post('/api/start-consultation', async (req, res) => {
    const { patientId } = req.body;
    try {
        // Perform any necessary operations here, e.g., updating the database
        // Notify the patient via WebSocket
        notifyPatient(patientId);
        res.send({ status: 'ok', message: 'Consultation started' });
    } catch (error) {
        res.status(500).send({ status: 'error', message: error.message });
    }
});

app.patch("/api/appointments/:id/consultation-start", async (req, res) => {
    const { id } = req.params;
    const { consultationStarted } = req.body;
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { consultationStarted },
            { new: true }
        );
        if (!appointment) {
            return res.status(404).send({ status: "error", data: "Appointment not found" });
        }
        res.send({ status: "ok", data: appointment });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.get("/api/patient/:patientId/consultation-details", async (req, res) => {
    const { patientId } = req.params;
    try {
        const consultation = await Consultation.findOne({ patientId }).sort({ createdAt: -1 });
        if (!consultation) {
            return res.status(404).send({ status: "error", data: "No consultation found" });
        }
        res.send({ status: "ok", data: consultation });
    } catch (error) {
        console.error("Error fetching consultation details", error);
        res.status(500).send({ status: "error", data: error.message });
    }
});

app.patch("/api/consultation/:id/estimated-time", async (req, res) => {
    const { id } = req.params;
    const { estimatedTime } = req.body;
    try {
      const consultation = await Consultation.findByIdAndUpdate(
        id,
        { estimatedTime },
        { new: true }
      );
      if (!consultation) {
        return res.status(404).send({ status: "error", data: "Consultation not found" });
      }
      res.send({ status: "ok", data: consultation });
    } catch (error) {
      res.status(500).send({ status: "error", data: error.message });
    }
  });

  // Route to submit feedback
app.post("/api/feedback", async (req, res) => {
    const { patientId, feedbackText, rating } = req.body;
    try {
        const feedback = new Feedback({ patientId, feedbackText, rating });
        await feedback.save();
        res.send({ status: "ok", data: "Feedback submitted successfully", feedback });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

// Route to get feedback for a specific patient
app.get("/api/feedback/:patientId", async (req, res) => {
    const { patientId } = req.params;
    try {
        const feedbacks = await Feedback.find({ patientId });
        if (feedbacks.length === 0) {
            return res.status(404).send({ status: "error", data: "No feedback found" });
        }
        res.send({ status: "ok", data: feedbacks });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

// Route to get all feedback
app.get("/api/feedback", async (req, res) => {
    try {
        const feedbacks = await Feedback.find();
        res.send({ status: "ok", data: feedbacks });
    } catch (error) {
        res.status(500).send({ status: "error", data: error.message });
    }
});

  

  
app.listen(5001, () => {
    console.log("server running on port 5001");
});
