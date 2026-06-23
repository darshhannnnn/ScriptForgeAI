const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required');
  }
  return crypto.pbkdf2Sync(secret, 'scriptforge-api-keys', 100_000, 32, 'sha256');
}

function decryptApiKey(stored) {
  const key = getEncryptionKey();
  const [ivHex, encryptedHex, tagHex] = stored.split(':');

  if (!ivHex || !encryptedHex || !tagHex) {
    throw new Error('Malformed encrypted API key');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri, { family: 4 });

  const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    apiKeys: {
      gemini: String
    }
  }, { collection: 'users' });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const envKey = process.env.GOOGLE_GEMINI_API_KEY || '';
  const users = await User.find({}).lean();
  for (const user of users) {
    console.log(`User: ${user.name} (${user.email})`);
    if (user.apiKeys?.gemini) {
      try {
        const decrypted = decryptApiKey(user.apiKeys.gemini);
        console.log(`  Decrypted Key length: ${decrypted.length}`);
        console.log(`  Decrypted Key is identical to env key: ${decrypted === envKey}`);
        console.log(`  Decrypted Key value: ${decrypted}`);
      } catch (e) {
        console.log(`  Decryption failed: ${e.message}`);
      }
    } else {
      console.log(`  No key stored.`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
