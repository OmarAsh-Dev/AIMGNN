// supabaseClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://pcaiuorgyybjupibnqxu.supabase.co";  // Replace with your Supabase URL
const supabaseAnonKey = "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWl1b3JneXlianVwaWJucXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjc2MTUsImV4cCI6MjA1OTgwMzYxNX0.7sPShr6J4oa7nQ-MFjXmVUghB-ORNW5n97l3rHWMAls";                // Replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
