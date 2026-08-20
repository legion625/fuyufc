import { useState } from 'react';
import { Loader2, Lock, Trash2, X } from 'lucide-react';
import { deleteMatch } from '@/lib/teamAuth';

export function DeleteMatchModal({
  matchId,
  teamName,
  onClose,
  onDeleted,
}: {
  matchId: string;
  teamName: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!password) {
      setError('請輸入球隊密碼');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteMatch(matchId, password);
      onDeleted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '刪除失敗');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-rose-400 font-semibold">
            <Trash2 size={18} /> 刪除比賽
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-300 text-sm mb-4">
          此操作無法復原。請輸入
          <span className="text-emerald-400 font-semibold mx-1">
            {teamName}
          </span>
          的球隊密碼以確認刪除。
        </p>

        <div className="relative mb-3">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
            placeholder="球隊密碼"
            autoFocus
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30"
          />
        </div>

        {error && (
          <p className="text-rose-400 text-xs mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-200 font-medium text-sm active:scale-95 transition-transform"
          >
            取消
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 刪除中…
              </>
            ) : (
              '確認刪除'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
