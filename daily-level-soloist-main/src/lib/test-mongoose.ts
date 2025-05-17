// Simple test file to verify mongoose import and connection method
import * as mongoose from 'mongoose';

async function testMongooseImport() {
  console.log('Mongoose version:', mongoose.version);
  console.log('Mongoose connect method type:', typeof mongoose.connect);
  
  try {
    // Test if we can access mongoose methods
    console.log('Available mongoose methods:', Object.keys(mongoose));
    
    if (typeof mongoose.connect === 'function') {
      console.log('✅ mongoose.connect is a function, as expected');
    } else {
      console.error('❌ mongoose.connect is not a function! Actual type:', typeof mongoose.connect);
      
      // Check if we need to use mongoose.default
      if (mongoose.default && typeof mongoose.default.connect === 'function') {
        console.log('✅ mongoose.default.connect is available - this is the correct way to import');
      } else {
        console.error('❌ mongoose.default.connect is not available either');
      }
    }
  } catch (error) {
    console.error('Error testing mongoose:', error);
  }
}

// Run the test
testMongooseImport().catch(console.error); 