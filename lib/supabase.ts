import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qmtkddyjlwqkpdmcetgj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdGtkZHlqbHdxa3BkbWNldGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDM3ODAsImV4cCI6MjA4NzI3OTc4MH0.GzGhPfx7X9-0aCjOTrPTXzbY-d45xORPMWgaVzncZ9w";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface ContactRow {
  id: number;
  category_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  college: string;
  email: string;
  clearances: string[];
}

export interface ContactCategoryRow {
  id: number;
  title: string;
  sort_order: number;
  contacts: ContactRow[];
}
