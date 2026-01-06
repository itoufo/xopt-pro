import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database connection string - needs to be set
// Format: postgresql://postgres:[PASSWORD]@db.abhrgewzglubansbyitm.supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL環境変数を設定してください');
  console.error('例: DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.abhrgewzglubansbyitm.supabase.co:5432/postgres"');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('データベースに接続中...');
    await client.connect();
    console.log('接続成功！');

    const sqlFile = path.join(__dirname, '../supabase/migrations/001_create_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('SQLを実行中...');
    await client.query(sql);
    console.log('テーブル作成完了！');

  } catch (err) {
    console.error('エラー:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
