// Simple MongoDB connection test
import mongoose from 'mongoose';

// Connection URI
const MONGODB_URI = 'mongodb+srv://Neon099:trykoitoemman@self-reality.bvcpbyn.mongodb.net/?retryWrites=true&w=majority&appName=Self-reality';
const MONGODB_DB_NAME = 'Self-reality-database';

async function testConnection() {
  try {
    console.log('Mongoose version:', mongoose.version);
    console.log('Mongoose connect type:', typeof mongoose.connect);
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Connected successfully to MongoDB!');
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Test creating a model
    const testSchema = new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.models.Test || mongoose.model('Test', testSchema);
    console.log('✅ Model created successfully');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
}

// Run the test
testConnection(); 