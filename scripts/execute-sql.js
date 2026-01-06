import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://abhrgewzglubansbyitm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaHJnZXd6Z2x1YmFuc2J5aXRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1MjIzNSwiZXhwIjoyMDgwNDI4MjM1fQ.Y-Ztgh4Yi9Igl5-u3gMe5iDMlpcabaHF6L_JMWq9LGQ';

// Read and split SQL file into individual statements
const sqlFile = path.join(__dirname, '../supabase/migrations/001_create_schema.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Split by semicolons but respect strings/comments
const statements = sqlContent
  .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function executeViaRPC() {
  // Use service role to call pg functions
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: 'public' }
  });

  console.log('Supabaseに接続中...');

  // Try to create the schema using rpc
  // This requires a function to be created first, so let's use a different approach

  // Use the REST API directly to execute SQL
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ sql: sqlContent })
  });

  if (!response.ok) {
    const error = await response.text();
    console.log('RPC exec_sql not available, trying direct database access...');
    return false;
  }

  return true;
}

async function main() {
  const success = await executeViaRPC();

  if (!success) {
    console.log('\n直接SQL実行ができません。');
    console.log('Supabaseダッシュボードで以下の手順を実行してください：\n');
    console.log('1. https://supabase.com/dashboard/project/abhrgewzglubansbyitm/sql を開く');
    console.log('2. 以下のSQLをコピーして実行:\n');
    console.log('━'.repeat(60));
    console.log(sqlContent);
    console.log('━'.repeat(60));
  }
}

main().catch(console.error);
