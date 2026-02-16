const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const exists = await Admin.findOne({ email: 'admin@felicity.iiit.ac.in' });
    if (!exists) {
      await Admin.create({ email: 'admin@felicity.iiit.ac.in', password: 'admin123' });
      console.log('✅ Admin created successfully');
      console.log('   Email: admin@felicity.iiit.ac.in');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin already exists');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  process.exit();
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
