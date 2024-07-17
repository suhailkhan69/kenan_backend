const mongoose = require('mongoose');

const receptionStaffSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const ReceptionStaff = mongoose.model('ReceptionStaff', receptionStaffSchema);

const initializeReceptionStaff = async () => {
    try {
        const count = await ReceptionStaff.countDocuments();
        if (count === 0) {
            await ReceptionStaff.create({
                email: 'reception@gmail.com',
                password: 'reception'
            });
            console.log("Reception staff account initialized");
        }
    } catch (error) {
        console.error("Error initializing reception staff account:", error);
    }
};

module.exports = { ReceptionStaff, initializeReceptionStaff };