"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { SynthWaveform } from "@/lib/synthEngine";
import { createClient } from "@/utils/supabase/client";
import { normalizePattern, serializePattern } from "@/lib/sequencer";

export interface SavedPatternRow {
  id: string;
  name: string;
  pattern: unknown;
  bpm: number;
  created_at: string;
}

interface LoadedPatternPayload {
  bpm: number;
  drums: boolean[][];
  melody: Array<number | null>;
  synthWave: SynthWaveform;
}

interface UsePatternLibraryArgs {
  bpm: number;
  drumPattern: boolean[][];
  melodyPattern: Array<number | null>;
  synthWave: SynthWaveform;
  onLoadPattern: (pattern: LoadedPatternPayload) => void;
}

export function usePatternLibrary({
  bpm,
  drumPattern,
  melodyPattern,
  synthWave,
  onLoadPattern,
}: UsePatternLibraryArgs) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [savedPatterns, setSavedPatterns] = useState<SavedPatternRow[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [flashMessage, setFlashMessage] = useState("");
  const saveInputRef = useRef<HTMLInputElement>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((message: string) => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlashMessage(message);
    flashTimeoutRef.current = setTimeout(() => setFlashMessage(""), 2000);
  }, []);

  useEffect(() => {
    let ignore = false;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignore) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [flash, supabase]);

  useEffect(() => {
    if (!user) {
      setSavedPatterns([]);
      return;
    }

    let ignore = false;

    async function fetchPatterns() {
      const { data } = await supabase
        .from("patterns")
        .select("*")
        .order("created_at", { ascending: false });

      if (!ignore && data) {
        setSavedPatterns(data as SavedPatternRow[]);
      }
    }

    void fetchPatterns();

    return () => {
      ignore = true;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (showSave && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [showSave]);

  const handleSignIn = useCallback(() => {
    void supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSavedPatterns([]);
    setShowSave(false);
    setShowLoad(false);
  }, [supabase]);

  const handleSave = useCallback(async () => {
    const name = saveName.trim();
    if (!name || !user) return;

    const pattern = serializePattern(
      { drums: drumPattern, melody: melodyPattern },
      synthWave
    );
    const { data, error } = await supabase
      .from("patterns")
      .insert({ user_id: user.id, name, pattern, bpm })
      .select()
      .single();

    if (error) {
      flash("Save failed");
      return;
    }

    setSavedPatterns((prev) => [data as SavedPatternRow, ...prev]);
    setSaveName("");
    setShowSave(false);
    flash(`Saved "${name}"`);
  }, [bpm, drumPattern, flash, melodyPattern, saveName, supabase, synthWave, user]);

  const handleLoad = useCallback(
    (savedPattern: SavedPatternRow) => {
      const loaded = normalizePattern(savedPattern.pattern);
      onLoadPattern({
        bpm: savedPattern.bpm,
        drums: loaded.pattern.drums,
        melody: loaded.pattern.melody,
        synthWave: loaded.synthWave,
      });
      setShowLoad(false);
      flash(`Loaded "${savedPattern.name}"`);
    },
    [flash, onLoadPattern]
  );

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const { error } = await supabase.from("patterns").delete().eq("id", id);

      if (error) {
        flash("Delete failed");
        return;
      }

      setSavedPatterns((prev) => prev.filter((pattern) => pattern.id !== id));
      flash(`Deleted "${name}"`);
    },
    [flash, supabase]
  );

  const handleOverwrite = useCallback(
    async (id: string, name: string) => {
      const pattern = serializePattern(
        { drums: drumPattern, melody: melodyPattern },
        synthWave
      );
      const { error } = await supabase
        .from("patterns")
        .update({ pattern, bpm })
        .eq("id", id);

      if (error) {
        flash("Update failed");
        return;
      }

      setSavedPatterns((prev) =>
        prev.map((savedPattern) =>
          savedPattern.id === id ? { ...savedPattern, pattern, bpm } : savedPattern
        )
      );
      flash(`Updated "${name}"`);
    },
    [bpm, drumPattern, flash, melodyPattern, supabase, synthWave]
  );

  return {
    authLoading,
    flashMessage,
    handleDelete,
    handleLoad,
    handleOverwrite,
    handleSave,
    handleSignIn,
    handleSignOut,
    saveInputRef,
    saveName,
    savedPatterns,
    setSaveName,
    showLoad,
    showSave,
    toggleLoadPanel: () => {
      setShowLoad((prev) => !prev);
      setShowSave(false);
    },
    toggleSavePanel: () => {
      setShowSave((prev) => !prev);
      setShowLoad(false);
    },
    closeSavePanel: () => setShowSave(false),
    user,
  };
}
