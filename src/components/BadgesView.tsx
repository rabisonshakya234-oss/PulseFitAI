import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Moon,
  Dumbbell,
  Zap,
  HeartPulse,
  Activity,
  Sparkles,
  Lock,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Badge } from '../types/fitness';

interface BadgesViewProps {
  badges: Badge[];
  onShareBadge: (badge: Badge) => void;
}

export const BadgesView: React.FC<BadgesViewProps> = ({ badges, onShareBadge }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'heart' | 'sleep' | 'gym' | 'streak'>('all');
  const [activeBadgeDetail, setActiveBadgeDetail] = useState<Badge | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Moon':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'Dumbbell':
        return <Dumbbell className="w-5 h-5 text-emerald-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-cyan-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Trophy className="w-5 h-5 text-amber-400" />;
    }
  };

  const filteredBadges =
    selectedCategory === 'all' ? badges : badges.filter((b) => b.category === selectedCategory);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-5 pb-8">
      {/* Trophy Cabinet Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-black border border-amber-500/30 p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Hall of Milestones
              </span>
              <h2 className="text-xl font-black text-white">Biometric Achievement Badges</h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Unlocked</span>
            <span className="text-2xl font-black font-mono text-amber-400">
              {unlockedCount} / {badges.length}
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 mt-5 p-1 bg-black/50 rounded-2xl border border-white/5">
          {(['all', 'heart', 'sleep', 'gym', 'streak'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Badges' : `${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredBadges.map((badge) => {
          const pct = Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => setActiveBadgeDetail(badge)}
              className={`relative cursor-pointer p-4 rounded-2xl border transition-all duration-200 group flex flex-col justify-between ${
                badge.unlocked
                  ? 'bg-slate-900/80 border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800/80 shadow-lg'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-70 hover:opacity-90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      badge.unlocked
                        ? 'bg-slate-800 border border-white/10 shadow-md'
                        : 'bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {badge.unlocked ? (
                      getIcon(badge.icon)
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  {badge.unlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>UNLOCKED</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">
                      {pct}%
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {badge.progress} / {badge.maxProgress}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked ? 'bg-amber-400' : 'bg-slate-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px]">
                  <span className="text-amber-400/90 font-mono font-medium truncate">
                    🎁 {badge.perk}
                  </span>
                  {badge.unlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareBadge(badge);
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1"
                      title="Share Badge"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {activeBadgeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/40 p-6 text-center shadow-2xl relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-xl shadow-amber-500/20">
              {getIcon(activeBadgeDetail.icon)}
            </div>

            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              {activeBadgeDetail.category} Milestone
            </span>
            <h3 className="text-xl font-black text-white mt-1">{activeBadgeDetail.title}</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {activeBadgeDetail.description}
            </p>

            <div className="my-5 p-3.5 rounded-2xl bg-black/50 border border-white/5 text-xs text-left">
              <div className="flex justify-between font-mono text-slate-400 mb-1">
                <span>Unlock Criteria</span>
                <span>
                  {activeBadgeDetail.progress} / {activeBadgeDetail.maxProgress}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeBadgeDetail.progress / activeBadgeDetail.maxProgress) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-amber-300 font-medium">🎁 Perk: {activeBadgeDetail.perk}</p>
              {activeBadgeDetail.unlockedAt && (
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Earned: {activeBadgeDetail.unlockedAt}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveBadgeDetail(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
              {activeBadgeDetail.unlocked && (
                <button
                  onClick={() => {
                    const b = activeBadgeDetail;
                    setActiveBadgeDetail(null);
                    onShareBadge(b);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Badge</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
