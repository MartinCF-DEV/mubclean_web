const { createClient } = require('@supabase/supabase-js');
const url = 'https://wtlitcaiboefcujqrmrg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bGl0Y2FpYm9lZmN1anFybXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjksImV4cCI6MjA3OTkwMjUyOX0.uNEVVt9HCCBTnKhdv3hNHDKGrb2rTJAp2wJIA24_EgE';
const supabase = createClient(url, key);

async function check() {
    const { data: sol } = await supabase.from('solicitudes').select('*').limit(2);
    console.log("=== SOLICITUDES ===");
    console.log(JSON.stringify(sol, null, 2));

    const { data: emp } = await supabase.from('empleados_negocio').select('*').limit(2);
    console.log("=== EMPLEADOS_NEGOCIO ===");
    console.log(JSON.stringify(emp, null, 2));
}

check();
