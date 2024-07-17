const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Admin = mongoose.model('AdminInfo', adminSchema);

// Function to initialize admin account
const initializeAdmin = async () => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            await Admin.create({
                email: "admin@gmail.com",
                password: "admin" // In production, use a hashed password
            });
            console.log("Admin account initialized");
        }
    } catch (error) {
        console.error("Error initializing admin account:", error);
    }
};

module.exports = { Admin, initializeAdmin };