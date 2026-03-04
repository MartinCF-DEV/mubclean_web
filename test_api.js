const supabaseUrl = 'https://wtlitcaiboefcujqrmrg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bGl0Y2FpYm9lZmN1anFybXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjksImV4cCI6MjA3OTkwMjUyOX0.uNEVVt9HCCBTnKhdv3hNHDKGrb2rTJAp2wJIA24_EgE';

async function fetchDb() {
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/solicitudes?select=id,estado&order=created_at.desc&limit=3`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const reqs = await res.json();
        console.log('Recent Requests:', reqs);

        const ids = reqs.map(r => r.id).join(',');
        const res2 = await fetch(`${supabaseUrl}/rest/v1/items_solicitud?select=*&solicitud_id=in.(${ids})`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const items = await res2.json();
        console.log('Items for those requests:', items);
    } catch (err) {
        console.error(err);
    }
}
fetchDb();
