import { Connect, IncomingMessage, ServerResponse } from 'connect';
import { connectToDatabase } from '../lib/mongodb';
import { User, Quest, Mission, ShopItem } from '../lib/mongodb';

export const handleApi = async (req: IncomingMessage, res: ServerResponse) => {
  // Set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Connect to MongoDB
    const db = await connectToDatabase();
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Parse the URL to get the endpoint
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const endpoint = url.pathname.replace('/api/', '');

    // Parse request body
    let body = '';
    await new Promise((resolve) => {
      req.on('data', chunk => { body += chunk; });
      req.on('end', resolve);
    });
    const data = body ? JSON.parse(body) : {};

    // Handle different endpoints
    switch (endpoint) {
      case 'users':
        if (req.method === 'GET') {
          try {
            const users = await User.find();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users));
          } catch (error) {
            throw new Error(`Failed to fetch users: ${error.message}`);
          }
        } else if (req.method === 'POST') {
          try {
            const user = new User(data);
            await user.save();
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(user));
          } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
          }
        }
        break;

      case 'quests':
        if (req.method === 'GET') {
          try {
            const quests = await Quest.find() || [];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(quests));
          } catch (error) {
            throw new Error(`Failed to fetch quests: ${error.message}`);
          }
        } else if (req.method === 'POST') {
          try {
            const quest = new Quest(data);
            await quest.save();
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(quest));
          } catch (error) {
            throw new Error(`Failed to create quest: ${error.message}`);
          }
        }
        break;

      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
  } catch (error) {
    console.error('API Error:', error);
    const statusCode = error.message.includes('not available') ? 503 : 500;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }));
  }
}; 