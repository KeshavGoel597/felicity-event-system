const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const connectDatabase = require('../config/database');

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Admin credentials
    const adminEmail = 'admin@felicity.com';
    const adminPassword = 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Use existing credentials to login');
      process.exit(0);
    }

    // Create new admin
    const admin = await Admin.create({
      email: adminEmail,
      password: adminPassword,
    });

    console.log('✅ Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', adminEmail);
    console.log('🔑 Password: ', adminPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

// Run the seed script
seedAdmin();
