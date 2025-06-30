import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fcqvzjwskiqpkposftet.supabase.co'; // replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcXZ6andza2lxcGtwb3NmdGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MTE0MTIsImV4cCI6MjA2Mzk4NzQxMn0.VWpm22PHYzQSFCP7Vqzv96EHn-Q2AwUj9luPA1LtOGA'; // replace with your anon/public key
export const supabase = createClient(supabaseUrl, supabaseKey);
