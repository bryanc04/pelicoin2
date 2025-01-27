import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://osxxxbsxrkhkxtshibsi.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zeHh4YnN4cmtoa3h0c2hpYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0ODEyMTYsImV4cCI6MjA1MjA1NzIxNn0.v5O4dkG15UqbIIQZ42edRU60Q1RMHam-Vgrg47ajqXM";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
