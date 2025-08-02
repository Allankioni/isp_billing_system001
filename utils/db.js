import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('MONGO_URI is not defined. Please define the MONGO_URI environment variable.');
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
} else {
  console.log('MONGO_URI:', MONGODB_URI.substring(0, 20) + '...');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    console.log('Using cached database connection.');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Creating new database connection.');
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Database connected successfully.');
      return mongoose;
    }).catch(err => {
      console.error('Database connection error:', err);
      cached.promise = null; // Reset promise on error
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export { connectToDatabase };
