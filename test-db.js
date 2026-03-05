const { createClient } = require('@supabase/supabase-js');
const url = 'https://wtlitcaiboefcujqrmrg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bGl0Y2FpYm9lZmN1anFybXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjksImV4cCI6MjA3OTkwMjUyOX0.uNEVVt9HCCBTnKhdv3hNHDKGrb2rTJAp2wJIA24_EgE';
const supabase = createClient(url, key);

async function run() {
    const { data, error } = await supabase.from('solicitudes').select('*').limit(5).order('created_at', { ascending: false });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Result:', JSON.stringify(data, null, 2));
    }
}
run();
