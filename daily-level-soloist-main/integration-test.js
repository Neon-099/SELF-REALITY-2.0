// Simple direct integration test for MongoDB connection
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://Neon099:trykoitoemman@self-reality.bvcpbyn.mongodb.net/?retryWrites=true&w=majority&appName=Self-reality';
const MONGODB_DB_NAME = 'Self-reality-database';

async function testDatabaseConnection() {
  try {
    // Here's the corrected connection approach
    console.log('Connecting to MongoDB...');
    console.log('Mongoose version:', mongoose.version);
    
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
    });
    
    console.log('✅ Connection successful!');
    
    // Define a test schema
    const TestSchema = new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    });
    
    // Create a test model
    const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);
    
    // Create a test document
    const testDoc = new TestModel({ name: 'Connection Test' });
    await testDoc.save();
    console.log('✅ Test document saved successfully');
    
    // Retrieve the document to verify
    const foundDoc = await TestModel.findOne({ name: 'Connection Test' });
    console.log('✅ Test document retrieved:', foundDoc.name);
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test cleanup complete');
    
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
  }
}

// Run the test
testDatabaseConnection(); 