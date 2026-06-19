import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define MONGODB_URI or MONGODB_URL inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
      
      // Check for common MongoDB Atlas errors
      if (error.message.includes('IP') || error.message.includes('whitelist') || error.message.includes('not authorized')) {
        const enhancedError = new Error(
          `MongoDB Atlas Connection Error: Your IP address is not whitelisted. Please add your current IP to the MongoDB Atlas whitelist at https://www.mongodb.com/docs/atlas/security-whitelist/`
        );
        enhancedError.isIPWhitelistError = true;
        throw enhancedError;
      }
      
      if (error.message.includes('authentication failed')) {
        const authError = new Error(
          `MongoDB Authentication Error: Please check your database credentials in .env.local`
        );
        authError.isAuthError = true;
        throw authError;
      }
      
      // Re-throw the original error for other cases
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    
    // Log the error for debugging
    console.error('Database connection failed:', e.message);
    
    // If it's an IP whitelist error, provide helpful instructions
    if (e.isIPWhitelistError) {
      console.log('\n🔧 To fix this issue:');
      console.log('1. Go to your MongoDB Atlas dashboard');
      console.log('2. Navigate to Network Access');
      console.log('3. Add your current IP address to the whitelist');
      console.log('4. Or add 0.0.0.0/0 for development (not recommended for production)');
      console.log('5. Save and wait for the changes to take effect\n');
    }
    
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
