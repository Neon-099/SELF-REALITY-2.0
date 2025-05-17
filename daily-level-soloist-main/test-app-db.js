// Test MongoDB connectivity from within the app context
import { connectToDatabase } from './src/lib/mongodb.js';
import { MongoDBService } from './src/lib/services/mongodb-service.js';

// IIFE to use async/await
(async () => {
  console.log('Testing MongoDB connectivity from the app context...');
  
  // Test direct database connection first
  try {
    console.log('1. Testing direct database connection...');
    const db = await connectToDatabase();
    console.log('✅ Direct connection successful!');
    
    // Verify models are accessible
    try {
      const { User, Quest, Mission } = await import('./src/lib/mongodb.js').then(m => m.getModels());
      console.log('✅ Models loaded successfully:',
        User ? 'User model available' : 'User model missing',
        Quest ? 'Quest model available' : 'Quest model missing',
        Mission ? 'Mission model available' : 'Mission model missing'
      );
      
      // Test a simple query
      const userCount = await User.countDocuments();
      console.log(`Database has ${userCount} users`);
    } catch (error) {
      console.error('❌ Error accessing models:', error);
    }
  } catch (error) {
    console.error('❌ Direct connection failed:', error);
  }
  
  // Now test via the service layer
  try {
    console.log('\n2. Testing database connection via MongoDBService...');
    const service = MongoDBService.getInstance();
    const initialized = await service.initialize();
    
    if (initialized) {
      console.log('✅ Service initialization successful!');
      
      // Try to get users
      const users = await service.getAllUsers?.();
      if (users) {
        console.log(`Service returned ${users.length} users`);
      } else {
        console.log('No users returned from service');
      }
      
      // Try to get quests
      const quests = await service.getAllQuests?.();
      if (quests) {
        console.log(`Service returned ${quests.length} quests`);
      } else {
        console.log('No quests returned from service');
      }
    } else {
      console.error('❌ Service initialization failed!');
    }
  } catch (error) {
    console.error('❌ Service connection failed:', error);
  }
})().catch(console.error); 