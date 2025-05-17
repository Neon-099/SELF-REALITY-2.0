// Simple test file to directly check the MongoDB connection
import mongoose from 'mongoose';

// Connection settings
const MONGODB_URI = 'mongodb+srv://Neon099:trykoitoemman@self-reality.bvcpbyn.mongodb.net/?retryWrites=true&w=majority&appName=Self-reality';
const MONGODB_DB_NAME = 'Self-reality-database';

// Check mongoose version
console.log('Mongoose version:', mongoose.version);

// Direct connection test
try {
  console.log('Connecting to MongoDB...');
  
  // Connect using async/await in an IIFE
  (async () => {
    try {
      // Log the mongoose object to verify connect is a function
      console.log('mongoose.connect type:', typeof mongoose.connect);
      
      await mongoose.connect(MONGODB_URI, {
        dbName: MONGODB_DB_NAME
      });
      
      console.log('✅ Connection successful!');
      
      // Check connection status
      console.log('MongoDB connection state:', mongoose.connection.readyState);
      console.log('Connected to database:', mongoose.connection.db.databaseName);
      
      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:');
      collections.forEach(col => console.log(`- ${col.name}`));
      
      // Disconnect
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error);
    }
  })();
} catch (error) {
  console.error('❌ Error in test setup:', error);
} 