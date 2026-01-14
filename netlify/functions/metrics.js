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
            opens: parseFloat(row.opens) || 0,
            clicks: parseFloat(row.clicks) || 0
          };
        } else if (row.platform === 'twitter') {
          metrics.twitter = {
            followers: row.followers || 0,
            growth: parseFloat(row.growth) || 0,
            impressions: row.impressions || 0,
            engagement: parseFloat(row.engagement) || 0
          };
        } else if (row.platform === 'linkedin') {
          metrics.linkedin = {
            connections: row.connections || 0,
            growth: parseFloat(row.growth) || 0,
            views: row.views || 0,
            engagement: parseFloat(row.engagement) || 0
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
          SET subscribers = ${values.subscribers},
              growth = ${values.growth},
              opens = ${values.opens},
              clicks = ${values.clicks},
              updated_at = NOW()
          WHERE platform = 'substack'
        `;
      } else if (platform === 'twitter') {
        await sql`
          UPDATE metrics 
          SET followers = ${values.followers},
              growth = ${values.growth},
              impressions = ${values.impressions},
              engagement = ${values.engagement},
              updated_at = NOW()
          WHERE platform = 'twitter'
        `;
      } else if (platform === 'linkedin') {
        await sql`
          UPDATE metrics 
          SET connections = ${values.connections},
              growth = ${values.growth},
              views = ${values.views},
              engagement = ${values.engagement},
              updated_at = NOW()
          WHERE platform = 'linkedin'
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
