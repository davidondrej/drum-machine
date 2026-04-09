"use client";

interface MachineControlsProps {
  isPlaying: boolean;
  bpm: number;
  userSignedIn: boolean;
  showSave: boolean;
  showLoad: boolean;
  savedCount: number;
  flashMessage: string;
  onTogglePlayback: () => void;
  onBpmChange: (value: number) => void;
  onClear: () => void;
  onToggleSave: () => void;
  onToggleLoad: () => void;
}

export function MachineControls({
  isPlaying,
  bpm,
  userSignedIn,
  showSave,
  showLoad,
  savedCount,
  flashMessage,
  onTogglePlayback,
  onBpmChange,
  onClear,
  onToggleSave,
  onToggleLoad,
}: MachineControlsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        onClick={onTogglePlayback}
        className="rounded-xl px-6 py-2.5 text-sm font-black tracking-[0.25em] transition-all"
        style={{
          backgroundColor: isPlaying ? "#ff335f" : "#00f5a0",
          color: "#050505",
          boxShadow: isPlaying ? "0 0 20px #ff335f60" : "0 0 20px #00f5a060",
        }}
      >
        {isPlaying ? "STOP" : "PLAY"}
      </button>

      <div className="flex items-center gap-3 rounded-full border border-white/8 bg-white/5 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          BPM
        </span>
        <input
          type="range"
          min={60}
          max={200}
          value={bpm}
          onChange={(event) => onBpmChange(Number(event.target.value))}
          className="w-32 accent-cyan-400"
        />
        <span className="w-8 text-right text-sm font-bold text-cyan-300">
          {bpm}
        </span>
      </div>

      <button
        onClick={onClear}
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:text-white"
      >
        Clear All
      </button>

      {userSignedIn ? (
        <>
          <button
            onClick={onToggleSave}
            className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]"
            style={{
              backgroundColor: showSave ? "#d946ef" : "#3a163d",
              color: showSave ? "#050505" : "#f3a8ff",
              border: "1px solid #d946ef55",
            }}
          >
            Save
          </button>
          <button
            onClick={onToggleLoad}
            className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]"
            style={{
              backgroundColor: showLoad ? "#22d3ee" : "#102c38",
              color: showLoad ? "#050505" : "#8be9ff",
              border: "1px solid #22d3ee55",
            }}
          >
            Load {savedCount > 0 ? `(${savedCount})` : ""}
          </button>
        </>
      ) : null}

      {flashMessage ? (
        <span className="text-sm font-semibold text-emerald-300">
          {flashMessage}
        </span>
      ) : null}
    </div>
  );
}
