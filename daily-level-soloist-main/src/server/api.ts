import { IncomingMessage, ServerResponse } from 'http';
import { connectToDatabase, getModels } from '../lib/mongodb-browser';

// Define model types to match the implementation in mongodb-browser.ts
interface MongooseModel {
  findById: (id: string) => Promise<any>;
  findOne: (query: any) => Promise<any>;
  find: () => Promise<any> | { lean: () => any[]; exec: () => any[] };
  findByIdAndUpdate: (id: string, data: any, options?: any) => Promise<any>;
  new (data: any): any;
}

// Add constructable types interface
interface ConstructableModel extends MongooseModel {
  new (data: any): any;
}

// Get properly typed model instances
const models = getModels();
const User = models.User as any as ConstructableModel;
const Quest = models.Quest as any as ConstructableModel;
const Mission = models.Mission as any as ConstructableModel;
const ShopItem = models.ShopItem as any as ConstructableModel;

// Helper function to safely use lean() method when it exists
const safelyUseLean = async (findPromise: any) => {
  const result = await findPromise;
  if (result && typeof result.lean === 'function') {
    return result.lean();
  }
  return result;
};

export const handleApi = async (req: IncomingMessage, res: ServerResponse) => {
  console.log(`[API] Request received: ${req.method} ${req.url}`);
  try {
    // CORS Headers - set these early
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Added Authorization as common header

    if (req.method === 'OPTIONS') {
      console.log('[API] Responding to OPTIONS request');
      res.writeHead(204); // No Content for OPTIONS
      res.end();
      return;
    }

    const url = new URL(req.url!, `http://${req.headers.host}`);
    const endpoint = url.pathname.replace('/api/', '');
    console.log(`[API] Parsed endpoint: ${endpoint}`);

    // Add health check endpoint
    if (endpoint === 'health') {
      console.log('[API] Health check requested');
      try {
        // Return successful even without MongoDB for basic connectivity testing
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        try {
          // Try to connect to MongoDB but don't make overall health check depend on it
          const db = await connectToDatabase();
          res.end(JSON.stringify({ 
            status: 'ok', 
            message: db ? 'MongoDB connected' : 'API server running, MongoDB unavailable',
            dbStatus: db ? 'connected' : 'disconnected' 
          }));
        } catch (dbError) {
          console.warn('[API] Health check - MongoDB connection failed:', dbError);
          res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'API server running, MongoDB unavailable',
            dbStatus: 'error',
            dbError: String(dbError) 
          }));
        }
        return;
      } catch (error) {
        console.error('[API] Health check failed:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Internal server error during health check' }));
        return;
      }
    }

    const db = await connectToDatabase();
    if (!db) {
      console.error('[API] Database connection not available');
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database connection not available' }));
      return;
    }
    console.log('[API] Database connected successfully');
    
    let body = '';
    await new Promise<void>((resolve, reject) => { // Added reject for error handling
      req.on('data', chunk => { body += chunk; });
      req.on('end', resolve);
      req.on('error', reject); // Handle errors during request body reading
    });
    
    const data = body ? JSON.parse(body) : {};
    if (body) console.log('[API] Request body parsed:', data);

    // Handle more specific endpoints with URL parameters
    if (endpoint.startsWith('users/')) {
      const parts = endpoint.split('/');
      if (parts.length === 2) {
        // Handle /users/:id
        const userId = parts[1];
        if (req.method === 'GET') {
          console.log(`[API] Getting user by ID: ${userId}`);
          const user = await User.findById(userId);
          if (user) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(user));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
          }
        } else if (req.method === 'PUT') {
          console.log(`[API] Updating user: ${userId}`);
          const updatedUser = await User.findByIdAndUpdate(userId, data, { new: true });
          if (updatedUser) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updatedUser));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
          }
        }
        return;
      } else if (parts.length === 3 && parts[1] === 'auth') {
        // Handle /users/auth/:authUserId
        const authUserId = parts[2];
        console.log(`[API] Getting user by auth ID: ${authUserId}`);
        const user = await User.findOne({ authUserId });
        if (user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(user));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
        }
        return;
      }
    } else if (endpoint.startsWith('quests/')) {
      const parts = endpoint.split('/');
      if (parts.length === 2) {
        // Handle /quests/:id
        const questId = parts[1];
        if (req.method === 'GET') {
          console.log(`[API] Getting quest by ID: ${questId}`);
          const quest = await Quest.findById(questId);
          if (quest) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(quest));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Quest not found' }));
          }
        } else if (req.method === 'PUT') {
          console.log(`[API] Updating quest: ${questId}`);
          const updatedQuest = await Quest.findByIdAndUpdate(questId, data, { new: true });
          if (updatedQuest) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updatedQuest));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Quest not found' }));
          }
        }
        return;
      }
    } else if (endpoint.startsWith('missions/')) {
      const parts = endpoint.split('/');
      if (parts.length === 2) {
        // Handle /missions/:id
        const missionId = parts[1];
        if (req.method === 'GET') {
          console.log(`[API] Getting mission by ID: ${missionId}`);
          const mission = await Mission.findById(missionId);
          if (mission) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(mission));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Mission not found' }));
          }
        } else if (req.method === 'PUT') {
          console.log(`[API] Updating mission: ${missionId}`);
          const updatedMission = await Mission.findByIdAndUpdate(missionId, data, { new: true });
          if (updatedMission) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updatedMission));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Mission not found' }));
          }
        }
        return;
      }
    }

    // Handle base endpoints
    switch (endpoint) {
      case 'users':
        if (req.method === 'GET') {
          console.log('[API /users] Handling GET');
          const users = await safelyUseLean(User.find());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(users));
        } else if (req.method === 'POST') {
          console.log('[API /users] Handling POST');
          const user = new User(data);
          await user.save();
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(user));
        }
        break;

      case 'quests':
        if (req.method === 'GET') {
          console.log('[API /quests] Handling GET');
          const quests = await safelyUseLean(Quest.find());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(quests));
        } else if (req.method === 'POST') {
          console.log('[API /quests] Handling POST');
          const quest = new Quest(data);
          await quest.save();
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(quest));
        }
        break;

      case 'missions':
        if (req.method === 'GET') {
          console.log('[API /missions] Handling GET');
          const missions = await safelyUseLean(Mission.find());
          console.log('[API /missions] Fetched missions:', missions); 
          if (!res.writableEnded) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(missions));
            console.log('[API /missions] Sent JSON response for missions.');
          } else {
            console.log('[API /missions] Response already ended before sending missions.');
          }
        } else if (req.method === 'POST') {
          console.log('[API /missions] Handling POST');
          const mission = new Mission(data);
          await mission.save();
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(mission));
        }
        break;

      case 'shop':
        if (req.method === 'GET') {
          console.log('[API /shop] Handling GET');
          const items = await safelyUseLean(ShopItem.find());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(items));
        } else if (req.method === 'POST') {
          console.log('[API /shop] Handling POST');
          const item = new ShopItem(data);
          await item.save();
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(item));
        }
        break;

      default:
        console.log(`[API] Endpoint not found: ${endpoint}`);
        if (!res.writableEnded) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    }
  } catch (error: any) { // Explicitly type error as any or unknown
    console.error('[API] Critical Error in handleApi:', error);
    if (!res.writableEnded) { // Check if headers haven't been sent
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', details: error.message || String(error) }));
    } else {
        // If headers already sent, it's harder to recover, but at least log it.
        console.error('[API] Error occurred after headers were sent.');
    }
  }
}; 