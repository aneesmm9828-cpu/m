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

async function checkColumns() {
  console.log('🧐 Checking "profiles" table columns...\n');

  // To check columns without admin access, we try to select one row and look at keys
  // or use an intentional error to see schema hints.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    if (data.length > 0) {
      console.log('✅ Columns found:', Object.keys(data[0]).join(', '));
    } else {
      console.log('⚠️ Table is empty. Trying to guess columns by inserting dummy data...');
      // Try to insert an object with all needed keys to see which one fails
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
            id: '00000000-0000-0000-0000-000000000000',
            username: 'test',
            full_name: 'test',
            avatar_url: 'test',
            bio: 'test'
        });

      if (insertError) {
        console.error('❌ Insertion failed:', insertError.message);
        console.log('Hint: Check if these columns exist in your Supabase Dashboard.');
      }
    }
  }
}

checkColumns();
