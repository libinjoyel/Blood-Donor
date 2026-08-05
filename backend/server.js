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

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedRoles();
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
