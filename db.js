const mongoose = require('mongoose');

async function connectDB() {
  const uri = String(process.env.MONGODB_URI || '').trim();
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

module.exports = { connectDB, mongoose };
