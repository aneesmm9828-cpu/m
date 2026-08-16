const { createClient } = require('@supabase/supabase-js');
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

async function checkRPC() {
  console.log('Checking for "exec_sql" RPC...');
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

  if (error) {
    console.log('❌ exec_sql not found or access denied:', error.message);
  } else {
    console.log('✅ exec_sql FOUND! I can modify the schema!');
  }
}

checkRPC();
