import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jecdcdeuexnxcncphtzq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY2RjZGV1ZXhueGNuY3BodHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDA1MDIsImV4cCI6MjA4NzUxNjUwMn0.qsF63HwE6GZQJMMtv-4qXWiZAhppeC2rB0bJCxWAL3g"; // publishable anon key


export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "nichegometr-auth",
  },
});