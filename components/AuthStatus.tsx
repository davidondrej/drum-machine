"use client";

import type { User } from "@supabase/supabase-js";

interface AuthStatusProps {
  authLoading: boolean;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void | Promise<void>;
}

export function AuthStatus({
  authLoading,
  user,
  onSignIn,
  onSignOut,
}: AuthStatusProps) {
  if (authLoading) {
    return null;
  }

  if (!user) {
    return (
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={onSignIn}
          className="rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-white/30 hover:bg-white/15 hover:text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-4 top-4 z-10">
      <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
        {user.user_metadata.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            className="h-6 w-6 rounded-full"
          />
        ) : null}
        <span className="max-w-36 truncate text-xs text-zinc-400">
          {user.user_metadata.user_name || user.email}
        </span>
        <button
          onClick={onSignOut}
          className="px-1 text-lg leading-none text-zinc-600 transition-colors hover:text-white"
          aria-label="Sign out"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
