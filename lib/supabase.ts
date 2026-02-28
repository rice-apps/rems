import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://qmtkddyjlwqkpdmcetgj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdGtkZHlqbHdxa3BkbWNldGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDM3ODAsImV4cCI6MjA4NzI3OTc4MH0.GzGhPfx7X9-0aCjOTrPTXzbY-d45xORPMWgaVzncZ9w";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Dev emails that are always allowed access
const DEV_ALLOWLIST = ["ag332@rice.edu", "hc103@rice.edu"];

export async function isEmailAuthorized(email: string): Promise<boolean> {
  const lower = email.toLowerCase();

  if (DEV_ALLOWLIST.includes(lower)) return true;

  const { count } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .ilike("email", lower);

  return (count ?? 0) > 0;
}

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
