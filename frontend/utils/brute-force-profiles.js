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

async function bruteForce() {
  const commonColumns = [
    'id', 'username', 'full_name', 'avatar_url', 'bio', 'updated_at', 'website'
  ];

  console.log('🔨 Brute-forcing column names for "profiles"...');

  for (const col of commonColumns) {
    const { error } = await supabase.from('profiles').select(col).limit(1);
    if (!error) {
      console.log(`✅ FOUND COLUMN: ${col}`);
    }
  }
}

bruteForce();
