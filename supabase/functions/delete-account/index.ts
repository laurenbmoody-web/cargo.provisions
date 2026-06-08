// supabase/functions/delete-account/index.ts
//
// GDPR right-to-erasure endpoint. Verifies the caller with their own JWT
// (anon-scoped client), then deletes the auth user with the SERVICE ROLE.
// ON DELETE CASCADE removes the profile, orders, items and analytics rows.
//
// Secrets (auto-present in the project's functions runtime):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// The service-role key MUST never reach the browser.
import { createClient } from "npm:@supabase/supabase-js@2";

// Allow the app origin(s) to call this function. Set ALLOWED_ORIGIN as a
// function secret (e.g. https://provisions.cargotechnology.co.uk). Falls back
// to "*" only if unset, which is fine for a verified-JWT-gated endpoint.
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const auth = req.headers.get("Authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;

  // Verify the caller with the anon-scoped client + their JWT.
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();
  if (error || !user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  // Delete with the service role. Cascade handles the rest.
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    return new Response(delErr.message, { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
