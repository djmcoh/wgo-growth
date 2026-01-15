import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const method = event.httpMethod;
    
    // GET - fetch all metrics
    if (method === 'GET') {
      const rows = await sql`SELECT * FROM metrics`;
      
      // Transform into the format the app expects
      const metrics = {};
      rows.forEach(row => {
        if (row.platform === 'substack') {
          metrics.substack = {
            subscribers: row.subscribers || 0,
            growth: parseFloat(row.growth) || 0,
            openRate: parseFloat(row.opens) || 0,
            paidSubscribers: 0
          };
        } else if (row.platform === 'twitter' || row.platform === 'x') {
          metrics.x = {
            followers: row.followers || 0,
            growth: parseFloat(row.growth) || 0,
            impressions: row.impressions || 0,
            engagement: parseFloat(row.engagement) || 0
          };
        } else if (row.platform === 'linkedin') {
          metrics.linkedin = {
            followers: row.connections || 0,
            connections: row.connections || 0,
            growth: parseFloat(row.growth) || 0,
            impressions: row.views || 0,
            engagement: parseFloat(row.engagement) || 0
          };
        } else if (row.platform === 'bluesky') {
          metrics.bluesky = {
            followers: row.followers || 0,
            growth: parseFloat(row.growth) || 0,
            posts: row.impressions || 0
          };
        }
      });
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      };
    }
    
    // PUT - update metrics for a platform
    if (method === 'PUT') {
      const data = JSON.parse(event.body);
      const { platform, ...values } = data;
      
      if (platform === 'substack') {
        await sql`
          UPDATE metrics 
          SET subscribers = ${values.subscribers || 0},
              growth = ${values.growth || 0},
              opens = ${values.openRate || 0},
              updated_at = NOW()
          WHERE platform = 'substack'
        `;
      } else if (platform === 'x' || platform === 'twitter') {
        await sql`
          UPDATE metrics 
          SET followers = ${values.followers || 0},
              growth = ${values.growth || 0},
              impressions = ${values.impressions || 0},
              engagement = ${values.engagement || 0},
              updated_at = NOW()
          WHERE platform = 'x' OR platform = 'twitter'
        `;
      } else if (platform === 'linkedin') {
        await sql`
          UPDATE metrics 
          SET connections = ${values.connections || values.followers || 0},
              growth = ${values.growth || 0},
              views = ${values.impressions || 0},
              engagement = ${values.engagement || 0},
              updated_at = NOW()
          WHERE platform = 'linkedin'
        `;
      } else if (platform === 'bluesky') {
        await sql`
          UPDATE metrics 
          SET followers = ${values.followers || 0},
              growth = ${values.growth || 0},
              impressions = ${values.posts || 0},
              updated_at = NOW()
          WHERE platform = 'bluesky'
        `;
      }
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error) {
    console.error('Metrics API error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
