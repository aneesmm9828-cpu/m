const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCallSignaling() {
  console.log('--- MARB Call Signaling Diagnostic ---');

  // 1. Check if calls table is accessible
  console.log('\n1. Checking table access...');
  const { data, error } = await supabase.from('calls').select('*').limit(1);
  if (error) {
    console.error('❌ Table Error:', error.message);
    if (error.message.includes('not found')) {
      console.log('💡 HINT: Run the calls migration in Supabase Dashboard.');
    }
  } else {
    console.log('✅ Table "calls" exists and is accessible.');
  }

  // 2. Check if Realtime is active on the channel
  console.log('\n2. Testing Realtime subscription...');
  const channel = supabase.channel('signaling-test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, payload => {
      console.log('🔔 Received event!', payload);
    })
    .subscribe((status) => {
      console.log(`📡 Subscription status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime is WORKING.');
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Realtime is NOT WORKING or not enabled for "calls" table.');
      }
    });

  // Keep process alive briefly for realtime test
  setTimeout(() => {
    channel.unsubscribe();
    console.log('\nDiagnostic complete. Process exiting...');
    process.exit(0);
  }, 5000);
}

testCallSignaling();
