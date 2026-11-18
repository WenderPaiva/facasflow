import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return jsonResponse({ error: "Autenticação obrigatória." }, 401);
    }

    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return jsonResponse({ error: "Sessão inválida." }, 401);
    }

    const caller = authData.user;
    const { data: callerProfile } = await supabaseAdmin
      .from("perfis")
      .select("id, empresa_id, role, ativo, deleted_at")
      .eq("id", caller.id)
      .is("deleted_at", null)
      .eq("ativo", true)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin") {
      return jsonResponse(
        { error: "Apenas administradores podem gerenciar membros da empresa." },
        403
      );
    }

    const empresaId = callerProfile.empresa_id;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "create_member") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      const ownerName = String(body.ownerName || "").trim();
      const role = body.role === "admin" ? "admin" : body.role === "cliente" ? "cliente" : "operador";
      const cargo = String(body.jobTitle || "").trim() || (role === "operador" ? "Operador de Produção" : "Administrador");

      if (!email || password.length < 6 || !ownerName) {
        return jsonResponse(
          { error: "Preencha nome, e-mail válido e senha com no mínimo 6 caracteres." },
          400
        );
      }

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { owner_name: ownerName },
        app_metadata: {
          empresa_id: empresaId,
          role,
          cargo,
        },
      });

      if (createErr || !created?.user) {
        return jsonResponse(
          { error: createErr?.message || "Não foi possível criar o usuário." },
          400
        );
      }

      const { data: createdProfile } = await supabaseAdmin
        .from("perfis")
        .select("*")
        .eq("id", created.user.id)
        .maybeSingle();

      return jsonResponse({ member: createdProfile });
    }

    if (action === "update_role") {
      const memberId = String(body.memberId || "");
      const nextRole = body.role === "admin" ? "admin" : body.role === "cliente" ? "cliente" : "operador";
      if (!memberId) return jsonResponse({ error: "memberId obrigatório." }, 400);

      const { data: target } = await supabaseAdmin
        .from("perfis")
        .select("*")
        .eq("id", memberId)
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!target) {
        return jsonResponse({ error: "Membro não encontrado nesta empresa." }, 404);
      }

      await supabaseAdmin.auth.admin.updateUserById(memberId, {
        app_metadata: {
          empresa_id: empresaId,
          role: nextRole,
          cargo: target.cargo,
        },
      });

      const { data: updated, error: upErr } = await supabaseAdmin
        .from("perfis")
        .update({ role: nextRole, updated_by: caller.id })
        .eq("id", memberId)
        .eq("empresa_id", empresaId)
        .select("*")
        .single();

      if (upErr) return jsonResponse({ error: upErr.message }, 500);
      return jsonResponse({ member: updated });
    }

    if (action === "remove_member") {
      const memberId = String(body.memberId || "");
      if (!memberId || memberId === caller.id) {
        return jsonResponse(
          { error: "Não é possível remover sua própria conta por aqui." },
          400
        );
      }

      const { data: target } = await supabaseAdmin
        .from("perfis")
        .select("id")
        .eq("id", memberId)
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!target) {
        return jsonResponse({ error: "Membro não encontrado nesta empresa." }, 404);
      }

      await supabaseAdmin
        .from("perfis")
        .update({
          ativo: false,
          deleted_at: new Date().toISOString(),
          updated_by: caller.id,
        })
        .eq("id", memberId)
        .eq("empresa_id", empresaId);

      await supabaseAdmin.auth.admin.deleteUser(memberId).catch(() => {});
      return jsonResponse({ status: "removed" });
    }

    return jsonResponse({ error: "Ação desconhecida." }, 400);
  } catch (err: any) {
    return jsonResponse({ error: err?.message || "Erro interno." }, 500);
  }
});
