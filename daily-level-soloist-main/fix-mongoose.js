// Compatibility test to find issues with mongoose loading
console.log('Testing mongoose loading...');

// IIFE to use async/await
(async () => {
  // Try dynamic import first (should work in ESM modules)
  try {
    const mongoose = await import('mongoose');
    console.log('Dynamic import successful');
    console.log('mongoose.connect type:', typeof mongoose.default.connect);
    console.log('mongoose.version:', mongoose.default.version);
    
    // Check for the actual connect method
    if (typeof mongoose.default.connect === 'function') {
      console.log('✅ Connect method exists on default export');
    } else {
      console.log('❌ Connect method not found on default export');
    }
  } catch (error) {
    console.error('Error with dynamic import:', error);
  }
  
  // Try direct import
  try {
    const mongoose = await import('mongoose');
    console.log('\nDirect import successful');
    console.log('mongoose.connect type:', typeof mongoose.connect);
    console.log('mongoose.version:', mongoose.version);
    
    // Check for the actual connect method
    if (typeof mongoose.connect === 'function') {
      console.log('✅ Connect method exists directly on import');
    } else {
      console.log('❌ Connect method not found directly on import');
    }
    
    // Test both approaches to connect
    try {
      console.log('\nTesting direct connect...');
      await mongoose.connect('mongodb+srv://Neon099:trykoitoemman@self-reality.bvcpbyn.mongodb.net/test', {
        serverSelectionTimeoutMS: 500 // Short timeout for testing
      });
      console.log('✅ Direct connect worked!');
      await mongoose.disconnect();
    } catch (error) {
      console.log('❌ Direct connect failed:', error.message);
    }

    try {
      console.log('\nTesting default connect...');
      await mongoose.default.connect('mongodb+srv://Neon099:trykoitoemman@self-reality.bvcpbyn.mongodb.net/test', {
        serverSelectionTimeoutMS: 500 // Short timeout for testing
      });
      console.log('✅ Default connect worked!');
      await mongoose.default.disconnect();
    } catch (error) {
      console.log('❌ Default connect failed:', error.message);
    }
  } catch (error) {
    console.error('Error with direct import:', error);
  }
})(); 