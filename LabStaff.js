const mongoose = require('mongoose');

const labStaffSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const LabStaff = mongoose.model('LabStaff', labStaffSchema);

const initializeLabStaff = async () => {
    try {
        const count = await LabStaff.countDocuments();
        if (count === 0) {
            await LabStaff.create({
                email: 'lab@gmail.com',
                password: 'lab'
            });
            console.log("Lab staff account initialized");
        }
    } catch (error) {
        console.error("Error initializing lab staff account:", error);
    }
};

module.exports = { LabStaff, initializeLabStaff };