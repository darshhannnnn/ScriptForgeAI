const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
  });
  console.log('Connected.');

  // Define simple user schema
  const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    apiKeys: {
      gemini: String
    }
  }, { collection: 'users' });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users:`);
  for (const user of users) {
    console.log(`- Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Has Gemini Key: ${!!user.apiKeys?.gemini}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
