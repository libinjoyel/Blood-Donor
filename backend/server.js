const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
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
