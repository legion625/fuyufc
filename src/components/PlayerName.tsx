import type { Player } from '@/lib/types';

export function playerDisplayName(p: Player): string {
  return p.jersey_name?.trim() ? p.jersey_name.trim() : p.name;
}

export function playerHasJerseyName(p: Player): boolean {
  const jn = p.jersey_name?.trim();
  return !!jn && jn !== p.name;
}

type PlayerNameVariant = 'match-compact' | 'match' | 'admin' | 'card';

export function PlayerName({
  player,
  variant,
  className = '',
  hideNumber = false,
  accentClass = 'text-emerald-400',
}: {
  player: Player;
  variant: PlayerNameVariant;
  className?: string;
  hideNumber?: boolean;
  accentClass?: string;
}) {
  const shown = playerDisplayName(player);
  const real = player.name;
  const hasJName = playerHasJerseyName(player);
  const num = hideNumber ? null : player.jersey_number;

  // [Situation A — compact] 現場對照視角（極窄按鈕 / 小卡片）
  // 重點：背號 + 球衣姓名；本名隱藏
  if (variant === 'match-compact') {
    return (
      <span className={`inline-flex items-baseline gap-1 ${className}`}>
        {num != null && <span className="font-bold tabular-nums">#{num}</span>}
        <span className="font-semibold">{shown}</span>
      </span>
    );
  }

  // [Situation A — full] 現場對照視角（賽果登錄 / 賽事卡片）
  // 主標題：#10 K. CHAO（大字、加粗）
  // 副標題：(趙敏樺)（小字、淺灰、帶括號）
  if (variant === 'match') {
    return (
      <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
        {num != null && <span className="font-bold tabular-nums">#{num}</span>}
        <span className="font-semibold">{shown}</span>
        {hasJName && (
          <span className="text-slate-500 text-xs font-normal">({real})</span>
        )}
      </span>
    );
  }

  // [Situation B] 行政管理視角（出席點名 / 隊務 / 球員管理）
  // 主標題：趙敏樺（大字、加粗）
  // 副標題：#10 (K. CHAO)（小字、淺灰）
  if (variant === 'admin') {
    const subParts: string[] = [];
    if (num != null) subParts.push(`#${num}`);
    if (hasJName) subParts.push(`(${shown})`);
    return (
      <div className={className}>
        <span className="font-bold text-sm block leading-tight">{real}</span>
        {subParts.length > 0 && (
          <span className="text-slate-500 text-xs">{subParts.join(' ')}</span>
        )}
      </div>
    );
  }

  // [Situation C] 排行榜 / 個人球員卡（榮譽與社群分享視角）
  // 頂部顯眼背號「10」，中央大字「K. CHAO」，角落小字「趙敏樺」
  return (
    <div
      className={`relative rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 px-3 py-2.5 text-center overflow-hidden ${className}`}
    >
      {num != null && (
        <div className={`text-2xl font-black tabular-nums leading-none ${accentClass}`}>
          {num}
        </div>
      )}
      <div className="text-sm font-bold text-white tracking-wide truncate mt-1">
        {shown}
      </div>
      {hasJName && (
        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{real}</div>
      )}
    </div>
  );
}
