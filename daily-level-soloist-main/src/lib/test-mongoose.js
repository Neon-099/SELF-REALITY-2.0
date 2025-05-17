// Simple test file to verify mongoose import and connection method
// Using ESM syntax since package.json has "type": "module"
import mongoose from 'mongoose';

console.log('Mongoose version:', mongoose.version);
console.log('Mongoose connect method type:', typeof mongoose.connect);
console.log('Available mongoose methods:', Object.keys(mongoose));

if (typeof mongoose.connect === 'function') {
  console.log('✅ mongoose.connect is a function, as expected');
} else {
  console.error('❌ mongoose.connect is not a function! Actual type:', typeof mongoose.connect);
  
  // Check if mongoose is exported differently
  if (mongoose.default && typeof mongoose.default.connect === 'function') {
    console.log('✅ mongoose.default.connect is available - need to use default import');
  } else {
    console.error('❌ mongoose.default.connect is not available either');
  }
} 