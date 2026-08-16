import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, ExternalLink, Settings, Shield, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav, type TabId } from '@/components/BottomNav';
import { ResultsView } from '@/views/ResultsView';
import { H2HView } from '@/views/H2HView';
import { StatsView } from '@/views/StatsView';
import { PlayerManagement } from '@/views/PlayerManagement';
import { TournamentsView } from '@/views/TournamentsView';
import { TeamsView } from '@/views/TeamsView';
import { AttendancePage } from '@/views/AttendancePage';
import { DeleteMatchModal } from '@/components/DeleteMatchModal';
import { EditMatchModal } from '@/components/EditMatchModal';
import { LogMatchModal } from '@/components/LogMatchModal';
import { TournamentEditorModal } from '@/components/TournamentEditorModal';
import { AdminPanel } from '@/components/AdminPanel';
import { useMatches } from '@/hooks/useMatches';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { useTournaments } from '@/hooks/useTournaments';
import { ThemeSelector, hasChosenTheme } from '@/lib/theme';
import { ChangelogModal } from '@/components/ChangelogModal';
import type { MatchWithPerformances, Tournament } from '@/lib/types';

const titles: Record<TabId, string> = {
  results: '最新賽果',
  tournaments: '盃賽管理',
  h2h: '對戰紀錄庫',
  stats: '個人排行榜',
  players: '球員管理',
  teams: '球隊管理',
};

function App() {
  const [tab, setTab] = useState<TabId>('results');
  const { teams, loading: tLoading, reload: reloadTeams } = useTeams();
  const [teamIds, setTeamIds] = useState<Set<string>>(new Set());
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<MatchWithPerformances | null>(null);
  const [editTarget, setEditTarget] = useState<MatchWithPerformances | null>(null);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [logTournament, setLogTournament] = useState<Tournament | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareName, setShareName] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Hash routing for public attendance page: #/attendance/<tournamentId>
  const [hashRoute, setHashRoute] = useState<string | null>(null);
  useEffect(() => {
    function check() {
      const h = window.location.hash;
      const m = h.match(/^#\/attendance\/([\da-fA-F-]{36})$/);
      setHashRoute(m ? m[1] : null);
    }
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  const effectiveTeamIds = useMemo(() => {
    if (teamIds.size > 0) return Array.from(teamIds);
    return teams.map((t) => t.id);
  }, [teamIds, teams]);

  const filterLabel =
    teamIds.size === 0
      ? '全部球隊'
      : teamIds.size === 1
        ? teams.find((t) => teamIds.has(t.id))?.name ?? '1 支球隊'
        : `${teamIds.size} 支球隊`;

  function toggleTeamFilter(id: string) {
    setTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const {
    matches,
    loading: mLoading,
    error: mError,
    reload: reloadMatches,
  } = useMatches(effectiveTeamIds);
  const { players, loading: pLoading, error: pError, reload: reloadPlayers } = usePlayers();
  const { tournaments, loading: tourLoading, reload: reloadTournaments } = useTournaments(effectiveTeamIds);

  function reloadAll() {
    reloadMatches();
    reloadTournaments();
  }

  const [showThemeSelector, setShowThemeSelector] = useState(!hasChosenTheme());

  // Public attendance page — render standalone, no app chrome
  if (hashRoute) {
    return <AttendancePage tournamentId={hashRoute} />;
  }

  if (showThemeSelector) {
    return <ThemeSelector onChoose={() => setShowThemeSelector(false)} />;
  }

  const showTeamFilter = tab !== 'teams' && tab !== 'players';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header onOpenChangelog={() => setChangelogOpen(true)} />
      <main className="max-w-md mx-auto px-4 pt-4 pb-20">
        {showTeamFilter && teams.length > 1 && (
          <div className="relative mb-4">
            <button
              onClick={() => setTeamMenuOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white text-sm font-semibold active:scale-[0.98] transition-transform"
            >
              <span className="truncate flex items-center gap-1.5">
                <Shield size={14} className="text-sky-400" />
                {filterLabel}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${
                  teamMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {teamMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden z-20">
                <button
                  onClick={() => {
                    setTeamIds(new Set());
                    setTeamMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm active:bg-slate-700 transition-colors ${
                    teamIds.size === 0 ? 'text-emerald-400 font-semibold' : 'text-slate-200'
                  }`}
                >
                  全部球隊
                  {teamIds.size === 0 && <Check size={15} />}
                </button>
                {teams.map((t) => {
                  const on = teamIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTeamFilter(t.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm active:bg-slate-700 transition-colors ${
                        on ? 'text-emerald-400 font-semibold' : 'text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {t.slug && <span className="text-sky-500/70 font-mono text-xs">{t.slug}</span>}
                        {t.name}
                      </span>
                      {on && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <h2 className="text-slate-400 text-xs font-semibold tracking-widest uppercase mb-3">
          {titles[tab]}
        </h2>

        {tab === 'results' && (
          <ResultsView
            matches={matches}
            tournaments={tournaments}
            teams={teams}
            loading={mLoading}
            error={mError}
            onDelete={(m) => setDelTarget(m)}
            onEdit={(m) => setEditTarget(m)}
            onEditTournament={(t) => setEditTournament(t)}
            onLogMatch={(t) => setLogTournament(t)}
          />
        )}
        {tab === 'tournaments' && (
          <TournamentsView
            tournaments={tournaments}
            teams={teams}
            loading={tourLoading}
            teamId={effectiveTeamIds[0] ?? null}
            onEdit={(t) => setEditTournament(t)}
            onShare={(t) => {
              const url = `${window.location.origin}${window.location.pathname}#/attendance/${t.id}`;
              setShareUrl(url);
              setShareName(t.name);
            }}
            onCreate={reloadTournaments}
          />
        )}
        {tab === 'h2h' && (
          <H2HView
            matches={matches}
            tournaments={tournaments}
            teams={teams}
            loading={mLoading}
            error={mError}
          />
        )}
        {tab === 'stats' && (
          <StatsView matches={matches} loading={mLoading} error={mError} />
        )}
        {tab === 'players' && (
          <PlayerManagement
            players={players}
            loading={pLoading}
            error={pError}
            onReload={reloadPlayers}
            teams={teams}
          />
        )}
        {tab === 'teams' && (
          <TeamsView
            teams={teams}
            players={players}
            onReloadTeams={reloadTeams}
            onReloadPlayers={reloadPlayers}
            onAdminOpen={() => setAdminOpen(true)}
          />
        )}
      </main>
      <BottomNav active={tab} onChange={setTab} />

      {delTarget && (
        <DeleteMatchModal
          matchId={delTarget.id}
          teamName={teams.find((t) => t.id === delTarget.team_id)?.name ?? '球隊'}
          onClose={() => setDelTarget(null)}
          onDeleted={reloadAll}
        />
      )}
      {editTarget && (
        <EditMatchModal
          match={editTarget}
          players={players}
          tournament={
            editTarget.tournament_id
              ? tournaments.find((t) => t.id === editTarget.tournament_id) ?? null
              : null
          }
          onClose={() => setEditTarget(null)}
          onSaved={reloadAll}
        />
      )}
      {logTournament && (
        <LogMatchModal
          tournament={logTournament}
          players={players}
          teamId={logTournament.team_id}
          onClose={() => setLogTournament(null)}
          onSaved={reloadAll}
        />
      )}
      {editTournament && (
        <TournamentEditorModal
          tournament={editTournament}
          players={players}
          teams={teams}
          onClose={() => setEditTournament(null)}
          onSaved={reloadAll}
        />
      )}
      {adminOpen && (
        <AdminPanel teams={teams} onClose={() => setAdminOpen(false)} />
      )}
      {changelogOpen && (
        <ChangelogModal onClose={() => setChangelogOpen(false)} />
      )}
      {shareUrl && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShareUrl(null)}>
          <div
            className="w-full sm:max-w-sm bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-base">出席回報連結</h3>
              <button
                onClick={() => setShareUrl(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-slate-400 text-xs mb-2">{shareName}</p>
            <div className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2.5 mb-3">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-slate-300 text-xs outline-none truncate"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    // clipboard API blocked — user can manually select & copy
                  }
                }}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 active:scale-95 transition-transform"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? '已複製' : '複製'}
              </button>
            </div>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold text-sm active:scale-[0.98] transition-transform"
            >
              <ExternalLink size={16} /> 開啟連結
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
