Init db · JS
Copy

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

    // Insert default tasks if table is empty
    const existingTasks = await sql`SELECT COUNT(*) as count FROM tasks`;
    if (parseInt(existingTasks[0].count) === 0) {
      await sql`
        INSERT INTO tasks (title, category, platform, week, due_date, priority, completed, recurring) VALUES
        ('Set up Twitter analytics tracking', 'foundation', 'twitter', 1, '2026-01-06', 'high', false, false),
        ('Optimize LinkedIn profile completely', 'foundation', 'linkedin', 1, '2026-01-07', 'high', false, false),
        ('Create list of 50 journalists/influencers', 'networking', 'twitter', 1, '2026-01-08', 'high', false, false),
        ('Map out Q1 content calendar', 'content', 'substack', 1, '2026-01-09', 'high', false, false),
        ('Set up metrics tracking spreadsheet', 'analytics', 'general', 1, '2026-01-10', 'medium', false, false),
        ('Write and publish Q1 first piece', 'content', 'substack', 2, '2026-01-13', 'high', false, false),
        ('Create 5 Twitter threads', 'content', 'twitter', 2, '2026-01-14', 'high', false, false),
        ('Write 3 LinkedIn posts', 'content', 'linkedin', 2, '2026-01-15', 'medium', false, false),
        ('Reach out to 5 newsletters', 'networking', 'substack', 2, '2026-01-16', 'medium', false, false),
        ('Daily Twitter posting', 'distribution', 'twitter', 3, '2026-01-20', 'high', false, true),
        ('Engage with 10 key accounts', 'networking', 'twitter', 3, '2026-01-21', 'high', false, true),
        ('Email 3 journalists', 'networking', 'general', 3, '2026-01-22', 'medium', false, false),
        ('Review Week 1-3 analytics', 'analytics', 'general', 4, '2026-01-27', 'high', false, false),
        ('Write Q1 second piece', 'content', 'substack', 4, '2026-01-28', 'high', false, false),
        ('Plan data visualization projects', 'content', 'general', 4, '2026-01-29', 'medium', false, false),
        ('Set up Substack welcome sequence', 'foundation', 'substack', 4, '2026-01-30', 'medium', false, false),
        ('Apply to speak at conferences', 'speaking', 'general', 4, '2026-01-31', 'low', false, false)
      `;
    }

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
