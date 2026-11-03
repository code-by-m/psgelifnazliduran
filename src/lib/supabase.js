import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseAdminEmail = import.meta.env.VITE_SUPABASE_ADMIN_EMAIL;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = isSupabaseConfigured && Boolean(supabaseAdminEmail);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function uploadPortfolioImage(file) {
  if (!supabase) {
    throw new Error("Supabase henüz yapılandırılmadı.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user.app_metadata?.role !== "admin") {
    throw new Error("Görsel yüklemek için yönetici hesabıyla giriş yapın.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "img";
  const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const contentType = file.type || (extension === "ico" ? "image/x-icon" : undefined);
  const { error } = await supabase.storage
    .from("portfolio-assets")
    .upload(path, file, {
      cacheControl: "3600",
      contentType,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("portfolio-assets").getPublicUrl(path);
  return data.publicUrl;
}
