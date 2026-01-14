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
    
    // GET - fetch all tasks
    if (method === 'GET') {
      const tasks = await sql`
        SELECT id, title, category, platform, week, 
               TO_CHAR(due_date, 'YYYY-MM-DD') as "dueDate", priority, completed, recurring,
               recurring_frequency as "recurringFrequency",
               recurring_include_weekends as "recurringIncludeWeekends",
               recurring_weekend_handling as "recurringWeekendHandling",
               recurring_end_type as "recurringEndType",
               recurring_end_count as "recurringEndCount",
               TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as "recurringEndDate"
        FROM tasks 
        ORDER BY due_date ASC, priority DESC
      `;
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks)
      };
    }
    
    // POST - create new task
    if (method === 'POST') {
      const data = JSON.parse(event.body);
      const result = await sql`
        INSERT INTO tasks (title, category, platform, week, due_date, priority, completed, recurring,
                          recurring_frequency, recurring_include_weekends, recurring_weekend_handling,
                          recurring_end_type, recurring_end_count, recurring_end_date)
        VALUES (${data.title}, ${data.category}, ${data.platform}, ${data.week}, 
                ${data.dueDate}, ${data.priority}, ${data.completed || false}, ${data.recurring || false},
                ${data.recurringFrequency || 'weekly'}, ${data.recurringIncludeWeekends || false}, ${data.recurringWeekendHandling || 'next-monday'},
                ${data.recurringEndType || 'never'}, ${data.recurringEndCount || 10}, ${data.recurringEndDate || null})
        RETURNING id, title, category, platform, week, TO_CHAR(due_date, 'YYYY-MM-DD') as "dueDate", priority, completed, recurring,
                  recurring_frequency as "recurringFrequency", recurring_include_weekends as "recurringIncludeWeekends", recurring_weekend_handling as "recurringWeekendHandling",
                  recurring_end_type as "recurringEndType", recurring_end_count as "recurringEndCount", TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as "recurringEndDate"
      `;
      
      return {
        statusCode: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result[0])
      };
    }
    
    // PUT - update task
    if (method === 'PUT') {
      const data = JSON.parse(event.body);
      const result = await sql`
        UPDATE tasks 
        SET title = ${data.title},
            category = ${data.category},
            platform = ${data.platform},
            week = ${data.week},
            due_date = ${data.dueDate},
            priority = ${data.priority},
            completed = ${data.completed},
            recurring = ${data.recurring},
            recurring_frequency = ${data.recurringFrequency || 'weekly'},
            recurring_include_weekends = ${data.recurringIncludeWeekends || false},
            recurring_weekend_handling = ${data.recurringWeekendHandling || 'next-monday'},
            recurring_end_type = ${data.recurringEndType || 'never'},
            recurring_end_count = ${data.recurringEndCount || 10},
            recurring_end_date = ${data.recurringEndDate || null},
            updated_at = NOW()
        WHERE id = ${data.id}
        RETURNING id, title, category, platform, week, TO_CHAR(due_date, 'YYYY-MM-DD') as "dueDate", priority, completed, recurring,
                  recurring_frequency as "recurringFrequency", recurring_include_weekends as "recurringIncludeWeekends", recurring_weekend_handling as "recurringWeekendHandling",
                  recurring_end_type as "recurringEndType", recurring_end_count as "recurringEndCount", TO_CHAR(recurring_end_date, 'YYYY-MM-DD') as "recurringEndDate"
      `;
      
      if (result.length === 0) {
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Task not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result[0])
      };
    }
    
    // DELETE - remove task
    if (method === 'DELETE') {
      const data = JSON.parse(event.body);
      await sql`DELETE FROM tasks WHERE id = ${data.id}`;
      
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
    console.error('Tasks API error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
