import { createClient } from '@supabase/supabase-js';
const url = 'https://wtlitcaiboefcujqrmrg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bGl0Y2FpYm9lZmN1anFybXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjksImV4cCI6MjA3OTkwMjUyOX0.uNEVVt9HCCBTnKhdv3hNHDKGrb2rTJAp2wJIA24_EgE';
const supabase = createClient(url, key);

async function run() {
    console.log("Fetching items_solicitud select * limit 1...");
    const { data: items, error: err1 } = await supabase.from('items_solicitud').select('*').limit(1);
    if (err1) console.error("ERR ITEMS:", err1);
    else console.log("Items (*):", JSON.stringify(items, null, 2));
}
run();
