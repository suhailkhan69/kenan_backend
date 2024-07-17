const mongoose = require('mongoose');

const pharmacyStaffSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const PharmacyStaff = mongoose.model('PharmacyStaff', pharmacyStaffSchema);

const initializePharmacyStaff = async () => {
    try {
        const count = await PharmacyStaff.countDocuments();
        if (count === 0) {
            await PharmacyStaff.create({
                email: 'pharmacy@gmail.com',
                password: 'pharmacy'
            });
            console.log("Pharmacy staff account initialized");
        }
    } catch (error) {
        console.error("Error initializing pharmacy staff account:", error);
    }
};

module.exports = { PharmacyStaff, initializePharmacyStaff };