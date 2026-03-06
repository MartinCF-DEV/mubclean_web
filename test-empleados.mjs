import { createClient } from '@supabase/supabase-js';
const url = 'https://wtlitcaiboefcujqrmrg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bGl0Y2FpYm9lZmN1anFybXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjksImV4cCI6MjA3OTkwMjUyOX0.uNEVVt9HCCBTnKhdv3hNHDKGrb2rTJAp2wJIA24_EgE';
const supabase = createClient(url, key);

async function run() {
    const { data: emps, error: err1 } = await supabase.from('empleados_negocio').select('*').limit(2);
    console.log("Empleados:", JSON.stringify(emps, null, 2));

    const { data: reqs, error: err2 } = await supabase.from('solicitudes').select('id, tecnico_asignado_id, estado').limit(2);
    console.log("Solicitudes:", JSON.stringify(reqs, null, 2));
}
run();
