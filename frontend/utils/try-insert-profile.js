const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function tryInsert() {
  const id = '77777777-7777-7777-7777-777777777777';
  console.log(`Attempting to insert profile with ID: ${id}`);

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: id,
      username: 'agent_dummy',
      full_name: 'Agent Dummy'
    });

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Profile inserted!');
  }
}

tryInsert();
