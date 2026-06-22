const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://somijzibukbgoedflina.supabase.co', 'sb_publishable_U3RL96IImYu6t9POkf1nsQ_cZy1jJoE', { auth: { persistSession: false } });
s.from('usuario').select('id_usuario, email, rol, activo').then(function(r) { console.log(JSON.stringify(r, null, 2)); });
