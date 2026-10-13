import React, { useState } from 'react';
import {
  Users,
  Trophy,
  Heart,
  MessageCircle,
  Flame,
  Moon,
  Send,
  Plus,
  Watch,
  Share2,
} from 'lucide-react';
import { CommunityPost } from '../types/fitness';
import { triggerHaptic } from '../utils/audioAlerts';

interface CommunityFeedViewProps {
  posts: CommunityPost[];
  onLikePost: (postId: string) => void;
  onAddPost: (postText: string) => void;
  onOpenShareModal: () => void;
}

export const CommunityFeedView: React.FC<CommunityFeedViewProps> = ({
  posts,
  onLikePost,
  onAddPost,
  onOpenShareModal,
}) => {
  const [newPostText, setNewPostText] = useState<string>('');

  const leaderboardUsers = [
    { rank: 1, name: 'Elena Rostova', strain: 16.8, sleepAvg: 92, streak: 14, avatar: 'ER' },
    { rank: 2, name: 'You (Athlete)', strain: 14.5, sleepAvg: 89, streak: 7, avatar: 'ME', isSelf: true },
    { rank: 3, name: 'Sofia Al-Mansoor', strain: 13.9, sleepAvg: 94, streak: 11, avatar: 'SA' },
    { rank: 4, name: 'Marcus Chen', strain: 12.2, sleepAvg: 86, streak: 5, avatar: 'MC' },
  ];

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    triggerHaptic();
    onAddPost(newPostText.trim());
    setNewPostText('');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Community Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-black border border-indigo-500/30 p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                PulseFit Network
              </span>
              <h2 className="text-xl font-black text-white">Community & Leaderboard</h2>
            </div>
          </div>

          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Create Share Card</span>
          </button>
        </div>
      </div>

      {/* Weekly Strain Leaderboard */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Weekly Strain Leaderboard
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Resets in 2 days</span>
        </div>

        <div className="space-y-2">
          {leaderboardUsers.map((user) => (
            <div
              key={user.rank}
              className={`p-3 rounded-xl flex items-center justify-between border transition-all ${
                user.isSelf
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                    user.rank === 1
                      ? 'bg-amber-400 text-black'
                      : user.rank === 2
                      ? 'bg-slate-300 text-black'
                      : user.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {user.rank}
                </span>

                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                  {user.avatar}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {user.name}
                    {user.isSelf && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500 text-white">
                        YOU
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    🔥 {user.streak}-Day Streak • 🌙 {user.sleepAvg}% Sleep
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-mono font-black text-amber-400">
                  {user.strain}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">Strain / 21</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Post Box */}
      <form onSubmit={handlePostSubmit} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Share a gym PR, heart rate milestone, or sleep recovery victory..."
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!newPostText.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post</span>
        </button>
      </form>

      {/* Community Feed Stream */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Athlete Activity Stream
        </h3>

        {posts.map((post) => (
          <div
            key={post.id}
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={post.userAvatar}
                  alt={post.userName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{post.userName}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>{post.timeAgo}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{post.deviceUsed}</span>
                  </div>
                </div>
              </div>

              {post.badgeUnlocked && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🏆 {post.badgeUnlocked}
                </span>
              )}
            </div>

            {/* Post Content */}
            <div>
              <h5 className="text-sm font-bold text-slate-100">{post.workoutTitle}</h5>
            </div>

            {/* Metrics Snapshot Bar */}
            <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-semibold block">Duration</span>
                <span className="text-xs font-mono font-bold text-white">{post.durationMin}m</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-semibold block">Calories</span>
                <span className="text-xs font-mono font-bold text-orange-400">{post.calories}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-semibold block">Avg HR</span>
                <span className="text-xs font-mono font-bold text-rose-400">{post.avgHr}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-semibold block">Sleep</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{post.sleepScore}%</span>
              </div>
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <button
                onClick={() => {
                  triggerHaptic();
                  onLikePost(post.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  post.hasLiked
                    ? 'text-rose-500 bg-rose-500/10'
                    : 'hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-rose-500' : ''}`} />
                <span>{post.likes} Fist-bumps</span>
              </button>

              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{post.commentCount} comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
