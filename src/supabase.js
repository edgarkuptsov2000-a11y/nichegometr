import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jecdcdeuexnxcncphtzq.supabase.co";
const supabaseKey = "sb_publishable_YuodudqRKV9wnAwoVmyzwQ_o0FXx-jj";

export const supabase = createClient(supabaseUrl, supabaseKey);