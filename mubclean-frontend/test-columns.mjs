import { createClient } from '@supabase/supabase-js';
const url = 'https://wtlitcaiboefcujqrmrg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bGl0Y2FpYm9lZmN1anFybXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjksImV4cCI6MjA3OTkwMjUyOX0.uNEVVt9HCCBTnKhdv3hNHDKGrb2rTJAp2wJIA24_EgE';
const supabase = createClient(url, key);

async function run() {
    console.log("Testing column 'servicio_catalogo_id'...");
    const { data: items1, error: err1 } = await supabase.from('items_solicitud').select('servicio_catalogo_id').limit(1);
    if (err1) console.error("ERR 1:", err1.message);
    else console.log("Success 1");

    console.log("Testing column 'catalogo_servicio_id'...");
    const { data: items2, error: err2 } = await supabase.from('items_solicitud').select('catalogo_servicio_id').limit(1);
    if (err2) console.error("ERR 2:", err2.message);
    else console.log("Success 2");
}
run();
