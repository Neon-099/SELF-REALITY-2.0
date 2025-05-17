import mongoose from 'mongoose';
import { MongoDBService } from './services/mongodb-service';

// Replace YOUR_NEW_PASSWORD with the password you just reset in MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://Neon099:trykoitoemman@self-reality.bvcpbyn.mongodb.net/?retryWrites=true&w=majority&appName=Self-reality';
const MONGODB_DB_NAME = 'Self-reality-database';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 2000,
      family: 4,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Database Name:', mongoose.connection.db.databaseName);
    console.log('Connection State:', mongoose.connection.readyState);
    
    // Test creating a collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable Collections:', collections.map(c => c.name));

    // Test MongoDB service
    console.log('\nTesting MongoDB Service...');
    const mongoService = MongoDBService.getInstance();
    await mongoService.initialize();

    // Create a test user
    const testUser = await mongoService.createUser({
      username: 'testUser',
      level: 1,
      exp: 0,
      stats: {
        strength: 1,
        intelligence: 1,
        vitality: 1,
        charisma: 1
      }
    });
    console.log('Created test user:', testUser);

    // Get the test user
    const user = await mongoService.getUser('testUser');
    console.log('Retrieved test user:', user);

    // Create a test quest
    const testQuest = await mongoService.createQuest({
      title: 'Test Quest',
      description: 'A test quest',
      expReward: 100
    });
    console.log('Created test quest:', testQuest);

    // Get all quests
    const quests = await mongoService.getQuests();
    console.log('Retrieved quests:', quests);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nConnection closed.');
  }
}

// Run the test
testConnection().catch(console.error); 