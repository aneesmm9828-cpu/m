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

async function checkSchema() {
  console.log('🔍 Checking Highlights and Highlight Items schema...');

  const tables = ['highlights', 'highlight_items'];

  for (const table of tables) {
    console.log(`\nTable: ${table}`);
    // We try to select something that definitely won't exist to see if it lists columns in error or we just try a blank select
    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
        // If data is empty, we can't easily see columns unless we look at a dummy insert attempt
        if (data.length > 0) {
            console.log(`✅ Success! Columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
            console.log('⚠️ No data found. Attempting dummy insert to see columns...');
            const { error: insertError } = await supabase.from(table).insert({}).select();
            if (insertError && insertError.message.includes('has no column')) {
                // This might not work as expected but it's a trick sometimes
            }
            console.log('Insert error (might show columns):', insertError?.message);
        }
    }
  }
}

checkSchema();
