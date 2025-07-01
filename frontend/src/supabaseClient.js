import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntcsljlsxmekjdsjesri.supabase.co'; // replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3NsamxzeG1la2pkc2plc3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNzQwMDYsImV4cCI6MjA2Njg1MDAwNn0.vR5_Fhvks-57r-J7qOQdvpvkBL8_7vIiQ8r7dJx8T_k'; // replace with your anon/public key
export const supabase = createClient(supabaseUrl, supabaseKey);
