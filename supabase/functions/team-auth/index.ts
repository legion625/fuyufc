import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Perf = {
  player_id: string;
  attended: boolean;
  played: boolean;
  goals: number;
  assists: number;
};

type TournamentAtt = {
  player_id: string;
  attended: boolean;
};

type Body = {
  action:
    | "delete-match"
    | "set-team-password"
    | "set-admin-password"
    | "update-match"
    | "update-tournament"
    | "set-tournament-attendance"
    | "set-tournament-frozen"
    | "delete-tournament"
    | "change-tournament-team";
  matchId?: string;
  tournamentId?: string;
  teamId?: string;
  password?: string;
  newPassword?: string;
  adminPassword?: string;
  oldPassword?: string;
  matchDate?: string;
  opponent?: string;
  ourScore?: number;
  oppScore?: number;
  stage?: number;
  notes?: string;
  performances?: Perf[];
  tournamentName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  finalRank?: number | null;
  attendances?: TournamentAtt[];
  frozen?: boolean;
  playerName?: string;
  playerJersey?: number | null;
  playerId?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = (await req.json()) as Body;

    // --- delete match (requires team password) ---
    if (body.action === "delete-match") {
      const { matchId, password } = body;
      if (!matchId || !password) return json({ ok: false, error: "缺少參數" }, 400);
      const { data: match, error: mErr } = await supabase
        .from("matches").select("team_id, tournament_id")
        .eq("id", matchId).maybeSingle();
      if (mErr || !match) return json({ ok: false, error: "找不到比賽" }, 404);
      // check tournament frozen
      if (match.tournament_id) {
        const { data: t } = await supabase
          .from("tournaments").select("frozen").eq("id", match.tournament_id).maybeSingle();
        if (t?.frozen) return json({ ok: false, error: "盃賽已鎖定，無法刪除" }, 403);
      }
      const { data: valid, error: vErr } = await supabase.rpc("verify_team_password", {
        p_team: match.team_id, p_password: password,
      });
      if (vErr || !valid) return json({ ok: false, error: "密碼錯誤" }, 403);
      const { error: dErr } = await supabase.from("matches").delete().eq("id", matchId);
      if (dErr) return json({ ok: false, error: "刪除失敗：" + dErr.message }, 500);
      return json({ ok: true });
    }

    // --- update match (NO password — open editing) ---
    if (body.action === "update-match") {
      const { matchId, matchDate, opponent, ourScore, oppScore, pkOur, pkOpp, stage, notes, performances } = body;
      if (!matchId) return json({ ok: false, error: "缺少 matchId" }, 400);
      const { data: match, error: mErr } = await supabase
        .from("matches").select("tournament_id").eq("id", matchId).maybeSingle();
      if (mErr || !match) return json({ ok: false, error: "找不到比賽" }, 404);
      if (match.tournament_id) {
        const { data: t } = await supabase
          .from("tournaments").select("frozen").eq("id", match.tournament_id).maybeSingle();
        if (t?.frozen) return json({ ok: false, error: "盃賽已鎖定，無法編輯" }, 403);
      }
      const update: Record<string, unknown> = {};
      if (matchDate !== undefined) update.match_date = matchDate;
      if (opponent !== undefined) update.opponent = opponent;
      if (ourScore !== undefined) update.our_score = ourScore;
      if (oppScore !== undefined) update.opp_score = oppScore;
      if (pkOur !== undefined) update.pk_our = pkOur;
      if (pkOpp !== undefined) update.pk_opp = pkOpp;
      if (stage !== undefined) update.stage = stage;
      if (notes !== undefined) update.notes = notes;

      if (Object.keys(update).length > 0) {
        const { error: uErr } = await supabase.from("matches").update(update).eq("id", matchId);
        if (uErr) return json({ ok: false, error: "更新失敗：" + uErr.message }, 500);
      }

      if (performances !== undefined) {
        const { error: dErr } = await supabase
          .from("match_performances").delete().eq("match_id", matchId);
        if (dErr) return json({ ok: false, error: "清除舊表現失敗：" + dErr.message }, 500);
        if (performances.length > 0) {
          const rows = performances.map((p) => ({
            match_id: matchId, player_id: p.player_id,
            attended: p.attended, played: p.played, goals: p.goals, assists: p.assists,
          }));
          const { error: pErr } = await supabase.from("match_performances").insert(rows);
          if (pErr) return json({ ok: false, error: "寫入表現失敗：" + pErr.message }, 500);
        }
      }
      return json({ ok: true });
    }

    // --- update tournament (NO password — open editing) ---
    if (body.action === "update-tournament") {
      const { tournamentId, tournamentName, startDate, endDate, location, finalRank } = body;
      if (!tournamentId) return json({ ok: false, error: "缺少 tournamentId" }, 400);
      const { data: t } = await supabase
        .from("tournaments").select("frozen").eq("id", tournamentId).maybeSingle();
      if (t?.frozen) return json({ ok: false, error: "盃賽已鎖定，無法編輯" }, 403);
      const update: Record<string, unknown> = {};
      if (tournamentName !== undefined) update.name = tournamentName;
      if (startDate !== undefined) update.start_date = startDate || null;
      if (endDate !== undefined) update.end_date = endDate || null;
      if (location !== undefined) update.location = location || null;
      if (finalRank !== undefined) update.final_rank = finalRank;
      const { error } = await supabase.from("tournaments").update(update).eq("id", tournamentId);
      if (error) return json({ ok: false, error: "更新失敗：" + error.message }, 500);
      return json({ ok: true });
    }

    // --- set tournament attendance (NO password — open editing) ---
    if (body.action === "set-tournament-attendance") {
      const { tournamentId, attendances } = body;
      if (!tournamentId) return json({ ok: false, error: "缺少 tournamentId" }, 400);
      const { data: t } = await supabase
        .from("tournaments").select("frozen").eq("id", tournamentId).maybeSingle();
      if (t?.frozen) return json({ ok: false, error: "盃賽已鎖定" }, 403);
      const { error: dErr } = await supabase
        .from("tournament_attendances").delete().eq("tournament_id", tournamentId);
      if (dErr) return json({ ok: false, error: "清除出席失敗：" + dErr.message }, 500);
      if (attendances && attendances.length > 0) {
        const rows = attendances.map((a) => ({
          tournament_id: tournamentId, player_id: a.player_id, attended: a.attended,
        }));
        const { error: iErr } = await supabase.from("tournament_attendances").insert(rows);
        if (iErr) return json({ ok: false, error: "寫入出席失敗：" + iErr.message }, 500);
      }
      return json({ ok: true });
    }

    // --- lock/unlock tournament (requires admin password) ---
    if (body.action === "set-tournament-frozen") {
      const { tournamentId, frozen, adminPassword } = body;
      if (!tournamentId || !adminPassword) return json({ ok: false, error: "缺少參數" }, 400);
      const { data, error } = await supabase.rpc("set_tournament_frozen", {
        p_tournament: tournamentId, p_frozen: frozen ?? false, p_admin_password: adminPassword,
      });
      if (error || !data) return json({ ok: false, error: "總管密碼錯誤" }, 403);
      return json({ ok: true });
    }

    // --- delete tournament (requires admin password) ---
    if (body.action === "delete-tournament") {
      const { tournamentId, adminPassword } = body;
      if (!tournamentId || !adminPassword) return json({ ok: false, error: "缺少參數" }, 400);
      const { data: valid } = await supabase.rpc("verify_admin_password", { p_password: adminPassword });
      if (!valid) return json({ ok: false, error: "總管密碼錯誤" }, 403);
      const { error } = await supabase.from("tournaments").delete().eq("id", tournamentId);
      if (error) return json({ ok: false, error: "刪除失敗：" + error.message }, 500);
      return json({ ok: true });
    }

    // --- change tournament team (requires admin password) ---
    if (body.action === "change-tournament-team") {
      const { tournamentId, teamId, adminPassword } = body;
      if (!tournamentId || !teamId || !adminPassword)
        return json({ ok: false, error: "缺少參數" }, 400);
      const { data: valid } = await supabase.rpc("verify_admin_password", { p_password: adminPassword });
      if (!valid) return json({ ok: false, error: "總管密碼錯誤" }, 403);
      const { data: t } = await supabase
        .from("tournaments").select("frozen, team_id").eq("id", tournamentId).maybeSingle();
      if (!t) return json({ ok: false, error: "找不到盃賽" }, 404);
      if (t.frozen) return json({ ok: false, error: "盃賽已鎖定，無法變更球隊" }, 403);
      if (t.team_id === teamId) return json({ ok: false, error: "新球隊與目前球隊相同" }, 400);
      const { error: tErr } = await supabase
        .from("tournaments").update({ team_id: teamId }).eq("id", tournamentId);
      if (tErr) return json({ ok: false, error: "更新盃賽失敗：" + tErr.message }, 500);
      const { error: mErr } = await supabase
        .from("matches").update({ team_id: teamId }).eq("tournament_id", tournamentId);
      if (mErr) return json({ ok: false, error: "更新比賽紀錄失敗：" + mErr.message }, 500);

      // Clean up attendance records for players who:
      //  - did not attend (attended = false), AND
      //  - have no membership (active or inactive) with the new team
      const { data: newTeamMems } = await supabase
        .from("player_team_memberships")
        .select("player_id")
        .eq("team_id", teamId);
      const newTeamPlayerIds = (newTeamMems ?? []).map((m) => m.player_id);
      let attErr: { message: string } | null = null;
      if (newTeamPlayerIds.length > 0) {
        const r = await supabase
          .from("tournament_attendances")
          .delete()
          .eq("tournament_id", tournamentId)
          .eq("attended", false)
          .not("player_id", "in", `(${newTeamPlayerIds.join(",")})`);
        attErr = r.error;
      } else {
        const r = await supabase
          .from("tournament_attendances")
          .delete()
          .eq("tournament_id", tournamentId)
          .eq("attended", false);
        attErr = r.error;
      }
      if (attErr) return json({ ok: false, error: "清理出席紀錄失敗：" + attErr.message }, 500);

      return json({ ok: true });
    }

    // --- set team password (admin) ---
    if (body.action === "set-team-password") {
      const { teamId, newPassword, adminPassword } = body;
      if (!teamId || !newPassword || !adminPassword) return json({ ok: false, error: "缺少參數" }, 400);
      const { data, error } = await supabase.rpc("set_team_password", {
        p_team: teamId, p_password: newPassword, p_admin_password: adminPassword,
      });
      if (error || !data) return json({ ok: false, error: "總管密碼錯誤或更新失敗" }, 403);
      return json({ ok: true });
    }

    // --- set admin password ---
    if (body.action === "set-admin-password") {
      const { oldPassword, newPassword } = body;
      if (!oldPassword || !newPassword) return json({ ok: false, error: "缺少參數" }, 400);
      const { data, error } = await supabase.rpc("set_admin_password", {
        p_old: oldPassword, p_new: newPassword,
      });
      if (error || !data) return json({ ok: false, error: "舊總管密碼錯誤" }, 403);
      return json({ ok: true });
    }

    return json({ ok: false, error: "未知 action" }, 400);
  } catch (err) {
    return json(
      { ok: false, error: err instanceof Error ? err.message : "未知錯誤" },
      500
    );
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
