import { useState } from 'react';
import { Loader2, Settings, Shield, X } from 'lucide-react';
import { setAdminPassword, setTeamPassword } from '@/lib/teamAuth';
import type { Team } from '@/lib/types';

export function AdminPanel({
  teams,
  onClose,
}: {
  teams: Team[];
  onClose: () => void;
}) {
  const [adminOld, setAdminOld] = useState('');
  const [adminNew, setAdminNew] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const [selTeam, setSelTeam] = useState<string>(teams[0]?.id ?? '');
  const [teamPw, setTeamPw] = useState('');
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamMsg, setTeamMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const inputCls =
    'w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30';

  async function saveAdmin() {
    if (!adminOld || !adminNew) {
      setAdminMsg({ ok: false, text: '請填寫舊密碼與新密碼' });
      return;
    }
    setAdminBusy(true);
    setAdminMsg(null);
    try {
      await setAdminPassword(adminOld, adminNew);
      setAdminMsg({ ok: true, text: '總管密碼已更新' });
      setAdminOld('');
      setAdminNew('');
    } catch (e) {
      setAdminMsg({
        ok: false,
        text: e instanceof Error ? e.message : '更新失敗',
      });
    } finally {
      setAdminBusy(false);
    }
  }

  async function saveTeamPw() {
    if (!selTeam || !teamPw) {
      setTeamMsg({ ok: false, text: '請選擇球隊並輸入新密碼' });
      return;
    }
    if (!adminOld) {
      setTeamMsg({ ok: false, text: '請先在上方輸入總管密碼' });
      return;
    }
    setTeamBusy(true);
    setTeamMsg(null);
    try {
      await setTeamPassword(selTeam, teamPw, adminOld);
      setTeamMsg({ ok: true, text: '球隊密碼已更新' });
      setTeamPw('');
    } catch (e) {
      setTeamMsg({
        ok: false,
        text: e instanceof Error ? e.message : '更新失敗',
      });
    } finally {
      setTeamBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col sm:items-center sm:justify-center sm:bg-black/60 sm:backdrop-blur-sm">
      <div className="flex flex-col w-full h-full bg-slate-800 sm:h-auto sm:max-h-[90dvh] sm:max-w-sm sm:rounded-2xl sm:border sm:border-slate-700 sm:shadow-2xl">
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Settings size={18} className="text-emerald-400" /> 管理設定
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">

        <section className="mb-6">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-3">
            <Shield size={15} className="text-amber-400" /> 總管密碼
          </div>
          <p className="text-slate-500 text-xs mb-3">
            總管密碼用於設定各球隊密碼。預設為
            <span className="text-amber-400 font-mono mx-1">admin</span>，建議盡快更改。
          </p>
          <div className="space-y-2 mb-3">
            <input
              type="password"
              value={adminOld}
              onChange={(e) => setAdminOld(e.target.value)}
              placeholder="目前總管密碼"
              className={inputCls}
            />
            <input
              type="password"
              value={adminNew}
              onChange={(e) => setAdminNew(e.target.value)}
              placeholder="新總管密碼"
              className={inputCls}
            />
          </div>
          {adminMsg && (
            <p
              className={`text-xs mb-2 ${
                adminMsg.ok ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {adminMsg.text}
            </p>
          )}
          <button
            onClick={saveAdmin}
            disabled={adminBusy}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-900 font-bold text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {adminBusy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 更新中…
              </>
            ) : (
              '更新總管密碼'
            )}
          </button>
        </section>

        <section>
          <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-3">
            <Shield size={15} className="text-emerald-400" /> 球隊密碼
          </div>
          <p className="text-slate-500 text-xs mb-3">
            設定各球隊的刪除密碼（需上方已輸入總管密碼）。
          </p>
          <div className="space-y-2 mb-3">
            <select
              value={selTeam}
              onChange={(e) => setSelTeam(e.target.value)}
              className={inputCls}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="password"
              value={teamPw}
              onChange={(e) => setTeamPw(e.target.value)}
              placeholder="新球隊密碼"
              className={inputCls}
            />
          </div>
          {teamMsg && (
            <p
              className={`text-xs mb-2 ${
                teamMsg.ok ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {teamMsg.text}
            </p>
          )}
          <button
            onClick={saveTeamPw}
            disabled={teamBusy}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-900 font-bold text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {teamBusy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 更新中…
              </>
            ) : (
              '更新球隊密碼'
            )}
          </button>
        </section>
        </div>
      </div>
    </div>
  );
}
