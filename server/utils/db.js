const mongoose = require('mongoose');
const seedData = require('./seed');

const connectDB = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelgear';
  
  try {
    // Try connecting to default DB
    // Set a small connection timeout (e.g. 2 seconds) so it doesn't hang if local DB is not running
    console.log(`Attempting connection to MongoDB at: ${connStr}`);
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000, // Timeout after 2s
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Could not connect to standard MongoDB: ${error.message}`);
    console.log('Launching in-memory MongoDB Server (Developer Sandbox Mode)...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoose.set('bufferTimeoutMS', 120000); // 2 minutes buffering limit for first download
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '4.4.25', // Lightweight version (~70MB download)
        }
      });
      const mongoUri = mongoServer.getUri();
      
      console.log(`In-Memory MongoDB Server running at ${mongoUri}`);
      const conn = await mongoose.connect(mongoUri);
      console.log('In-Memory MongoDB Connected successfully.');
      
      // Auto-seed in-memory DB since it starts fresh/empty!
      console.log('Auto-populating database with custom keyboards catalog...');
      await seedData(false);
      console.log('Auto-seeding complete! App is ready.');
      
      // Keep reference to server so it can be shut down on process termination
      process.on('SIGINT', async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        process.exit(0);
      });
    } catch (memError) {
      console.error(`Failed to launch in-memory MongoDB Server: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
