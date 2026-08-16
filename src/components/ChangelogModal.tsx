import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import changelog from '../../CHANGELOG.md?raw';

function stripHtmlComments(md: string): string {
  return md.replace(/<!--[\s\S]*?-->/g, '');
}

export function ChangelogModal({ onClose }: { onClose: () => void }) {
  const [content] = useState<string>(() => stripHtmlComments(changelog));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 z-10">
          <h2 className="text-white font-bold text-lg">更新紀錄</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="changelog-md text-slate-300 text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
