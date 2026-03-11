const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wtlitcaiboefcujqrmrg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bGl0Y2FpYm9lZmN1anFybXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjksImV4cCI6MjA3OTkwMjUyOX0.uNEVVt9HCCBTnKhdv3hNHDKGrb2rTJAp2wJIA24_EgE');

async function test() {
  const { data: firstRow, error: e1 } = await supabase.from('solicitudes').select('id, estado').limit(1).single();
  console.log('PRIMERA FILA:', firstRow);

  if (firstRow) {
    const { data: updateData, error: updateError } = await supabase
      .from('solicitudes')
      .update({ estado: 'cotizada' })
      .eq('id', firstRow.id);
    console.log('UPDATE A COTIZADA (ROW EXISTENTE) ERROR:', updateError);
    
    // Y luego a 'cotizado'
    const { data: updateData2, error: updateError2 } = await supabase
      .from('solicitudes')
      .update({ estado: 'cotizado' })
      .eq('id', firstRow.id);
    console.log('UPDATE A COTIZADO (ROW EXISTENTE) ERROR:', updateError2);
    
    // Restore
    await supabase.from('solicitudes').update({estado: firstRow.estado}).eq('id', firstRow.id);
  }
}
test();
