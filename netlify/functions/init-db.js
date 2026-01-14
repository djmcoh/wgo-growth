import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    // Create tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'content',
        platform TEXT DEFAULT 'general',
        week INTEGER DEFAULT 1,
        due_date DATE,
        priority TEXT DEFAULT 'medium',
        completed BOOLEAN DEFAULT false,
        recurring BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create metrics table
    await sql`
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        platform TEXT UNIQUE NOT NULL,
        followers INTEGER DEFAULT 0,
        growth DECIMAL(5,2) DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        engagement DECIMAL(5,2) DEFAULT 0,
        subscribers INTEGER DEFAULT 0,
        opens DECIMAL(5,2) DEFAULT 0,
        clicks DECIMAL(5,2) DEFAULT 0,
        connections INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Insert default metrics if not exists
    await sql`
      INSERT INTO metrics (platform, subscribers, growth, opens, clicks)
      VALUES ('substack', 412, 8.2, 62, 18)
      ON CONFLICT (platform) DO NOTHING
    `;
    
    await sql`
      INSERT INTO metrics (platform, followers, growth, impressions, engagement)
      VALUES ('twitter', 847, 12.4, 24500, 3.2)
      ON CONFLICT (platform) DO NOTHING
    `;
    
    await sql`
      INSERT INTO metrics (platform, connections, growth, views, engagement)
      VALUES ('linkedin', 623, 5.1, 1240, 4.8)
      ON CONFLICT (platform) DO NOTHING
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Database initialized' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
