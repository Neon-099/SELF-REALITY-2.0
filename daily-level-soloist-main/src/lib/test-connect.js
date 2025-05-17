// Simple test file to verify our MongoDB connection
import { connectToDatabase, getModels } from './mongodb.ts';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const db = await connectToDatabase();
    
    console.log('✅ Connection successful!');
    console.log('Testing models access...');
    
    const { User, Quest, Mission } = getModels();
    console.log('✅ Models accessed successfully:', 
      User ? 'User model available' : 'User model NOT available',
      Quest ? 'Quest model available' : 'Quest model NOT available',
      Mission ? 'Mission model available' : 'Mission model NOT available'
    );
    
    // Try a simple query
    const userCount = await User.countDocuments();
    const questCount = await Quest.countDocuments();
    const missionCount = await Mission.countDocuments();
    
    console.log('Database stats:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Quests: ${questCount}`);
    console.log(`- Missions: ${missionCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    return false;
  }
}

// Run the test
testConnection().catch(console.error); 