import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

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
        recurring_frequency TEXT DEFAULT 'weekly',
        recurring_include_weekends BOOLEAN DEFAULT false,
        recurring_weekend_handling TEXT DEFAULT 'next-monday',
        recurring_end_type TEXT DEFAULT 'never',
        recurring_end_count INTEGER DEFAULT 10,
        recurring_end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add recurring columns if they don't exist (for existing tables)
    await sql`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS recurring_frequency TEXT DEFAULT 'weekly'
    `;
    await sql`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS recurring_include_weekends BOOLEAN DEFAULT false
    `;
    await sql`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS recurring_weekend_handling TEXT DEFAULT 'next-monday'
    `;
    await sql`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS recurring_end_type TEXT DEFAULT 'never'
    `;
    await sql`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS recurring_end_count INTEGER DEFAULT 10
    `;
    await sql`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS recurring_end_date DATE
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
      const defaultTasks = [
        { title: 'Set up Twitter analytics tracking', category: 'foundation', platform: 'twitter', week: 1, due_date: '2026-01-06', priority: 'high' },
        { title: 'Optimize LinkedIn profile completely', category: 'foundation', platform: 'linkedin', week: 1, due_date: '2026-01-07', priority: 'high' },
        { title: 'Create list of 50 journalists/influencers', category: 'networking', platform: 'twitter', week: 1, due_date: '2026-01-08', priority: 'high' },
        { title: 'Map out Q1 content calendar', category: 'content', platform: 'substack', week: 1, due_date: '2026-01-09', priority: 'high' },
        { title: 'Set up metrics tracking spreadsheet', category: 'analytics', platform: 'general', week: 1, due_date: '2026-01-10', priority: 'medium' },
        { title: 'Write and publish Q1 first piece', category: 'content', platform: 'substack', week: 2, due_date: '2026-01-13', priority: 'high' },
        { title: 'Create 5 Twitter threads', category: 'content', platform: 'twitter', week: 2, due_date: '2026-01-14', priority: 'high' },
        { title: 'Write 3 LinkedIn posts', category: 'content', platform: 'linkedin', week: 2, due_date: '2026-01-15', priority: 'medium' },
        { title: 'Reach out to 5 newsletters', category: 'networking', platform: 'substack', week: 2, due_date: '2026-01-16', priority: 'medium' },
        { title: 'Daily Twitter posting', category: 'distribution', platform: 'twitter', week: 3, due_date: '2026-01-20', priority: 'high', recurring: true },
        { title: 'Engage with 10 key accounts', category: 'networking', platform: 'twitter', week: 3, due_date: '2026-01-21', priority: 'high', recurring: true },
        { title: 'Email 3 journalists', category: 'networking', platform: 'general', week: 3, due_date: '2026-01-22', priority: 'medium' },
        { title: 'Review Week 1-3 analytics', category: 'analytics', platform: 'general', week: 4, due_date: '2026-01-27', priority: 'high' },
        { title: 'Write Q1 second piece', category: 'content', platform: 'substack', week: 4, due_date: '2026-01-28', priority: 'high' },
        { title: 'Plan data visualization projects', category: 'content', platform: 'general', week: 4, due_date: '2026-01-29', priority: 'medium' },
        { title: 'Set up Substack welcome sequence', category: 'foundation', platform: 'substack', week: 4, due_date: '2026-01-30', priority: 'medium' },
        { title: 'Apply to speak at conferences', category: 'speaking', platform: 'general', week: 4, due_date: '2026-01-31', priority: 'low' }
      ];

      for (const task of defaultTasks) {
        await sql`
          INSERT INTO tasks (title, category, platform, week, due_date, priority, recurring)
          VALUES (${task.title}, ${task.category}, ${task.platform}, ${task.week}, ${task.due_date}, ${task.priority}, ${task.recurring || false})
        `;
      }
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Database initialized with default tasks' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
