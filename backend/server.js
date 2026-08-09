const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const DEFAULT_ROLES = [
  { name: 'Doctor', description: 'Oversees donor medical screening and eligibility', permissions: ['manage donors', 'review eligibility'] },
  { name: 'Assistant Doctor', description: 'Supports the doctor with donor screening', permissions: ['review eligibility'] },
  { name: 'Nurse', description: 'Handles blood collection and donor care', permissions: ['manage appointments', 'record donations'] },
  { name: 'Medical Technician', description: 'Runs lab tests and manages blood inventory', permissions: ['manage inventory'] },
  { name: 'Support Staff', description: 'Handles registration and general assistance', permissions: ['manage appointments'] },
];

const DEFAULT_BLOOD_BANKS = [
  { name: 'LifeFlow Blood Bank - Chennai', address: '12 Anna Salai, Nungambakkam', city: 'Chennai', phone: '044-2468 1000', email: 'chennai@lifeflow.com', latitude: 13.0628, longitude: 80.2507, services: ['Whole Blood', 'Platelets', 'Plasma'], workingHours: '8:00 AM - 8:00 PM' },
  { name: 'LifeFlow Blood Bank - Mumbai', address: '45 Linking Road, Bandra West', city: 'Mumbai', phone: '022-2643 2200', email: 'mumbai@lifeflow.com', latitude: 19.0596, longitude: 72.8295, services: ['Whole Blood', 'Platelets'], workingHours: '8:00 AM - 9:00 PM' },
  { name: 'LifeFlow Blood Bank - Delhi', address: '78 Connaught Place, New Delhi', city: 'Delhi', phone: '011-2341 5500', email: 'delhi@lifeflow.com', latitude: 28.6315, longitude: 77.2167, services: ['Whole Blood', 'Plasma', 'Cryoprecipitate'], workingHours: '8:00 AM - 8:00 PM' },
  { name: 'LifeFlow Blood Bank - Bengaluru', address: '23 MG Road, Shivaji Nagar', city: 'Bengaluru', phone: '080-2558 7700', email: 'bangalore@lifeflow.com', latitude: 12.9759, longitude: 77.6101, services: ['Whole Blood', 'Platelets', 'Plasma'], workingHours: '8:00 AM - 8:00 PM' },
  { name: 'LifeFlow Blood Bank - Kochi', address: '91 Marine Drive, Ernakulam', city: 'Kochi', phone: '0484-2361 8800', email: 'kochi@lifeflow.com', latitude: 9.9816, longitude: 76.2673, services: ['Whole Blood', 'Platelets'], workingHours: '9:00 AM - 7:00 PM' },
];

async function seedRoles() {
  try {
    const Role = require('./models/Role');
    const existing = await Role.findOne();
    if (!existing) {
      await Role.insertMany(DEFAULT_ROLES);
      console.log(`Seeded ${DEFAULT_ROLES.length} default admin roles`);
    }
  } catch (error) {
    console.error('Role seed error:', error.message);
  }
}

async function seedBloodBanks() {
  try {
    const BloodBank = require('./models/BloodBank');
    const existing = await BloodBank.findOne();
    if (!existing) {
      await BloodBank.insertMany(DEFAULT_BLOOD_BANKS);
      console.log(`Seeded ${DEFAULT_BLOOD_BANKS.length} default blood banks`);
    }
  } catch (error) {
    console.error('Blood bank seed error:', error.message);
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedRoles().then(seedBloodBanks);
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const bloodBankRoutes = require('./routes/bloodBankRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const urgentRequestRoutes = require('./routes/urgentRequestRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/blood-bank', bloodBankRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/urgent-requests', urgentRequestRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
