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

async function fullScan() {
  console.log('📊 --- FULL SUPABASE DATABASE SCAN --- 📊\n');

  const tables = ['profiles', 'posts', 'stories', 'reels', 'users', 'criyet', 'create'];

  for (const tableName of tables) {
    console.log(`Checking Table: "${tableName}"...`);

    // 1. Check if table exists and get one row to see columns
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('not find the table') || error.message.includes('does not exist')) {
        console.log(`❌ STATUS: DOES NOT EXIST\n`);
      } else {
        console.log(`⚠️ STATUS: EXISTS (but error: ${error.message})\n`);
      }
    } else {
      console.log(`✅ STATUS: ACTIVE`);
      if (data.length > 0) {
        console.log(`📝 COLUMNS FOUND: ${Object.keys(data[0]).join(', ')}`);
        console.log(`🔢 DATA: Table has existing records.`);
      } else {
        console.log(`🔢 DATA: Table is currently EMPTY (0 rows).`);
        // Try to fetch columns using a different method if empty
        const { data: colData } = await supabase.from(tableName).select('*').limit(0);
        // Note: Supabase JS doesn't easily give column names for empty tables without specific queries,
        // but this confirms the table is there.
      }
      console.log('-----------------------------------\n');
    }
  }
}

fullScan();
