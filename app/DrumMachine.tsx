"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthStatus } from "@/components/AuthStatus";
import { DrumPadGrid } from "@/components/DrumPadGrid";
import { FreesoundPanel } from "@/components/FreesoundPanel";
import { MachineControls } from "@/components/MachineControls";
import { PatternPanels } from "@/components/PatternPanels";
import { ProducerCoachPanel } from "@/components/ProducerCoachPanel";
import { SequencerGrid } from "@/components/SequencerGrid";
import { SynthKeyboard } from "@/components/SynthKeyboard";
import { useDrumMachineState } from "@/hooks/useDrumMachineState";
import { useProducerCoach } from "@/hooks/useProducerCoach";
import {
  DEFAULT_COACH_MODEL,
  isCoachModelSlug,
  type CoachModelSlug,
} from "@/lib/coachModels";
import { DRUM_SOUNDS } from "@/lib/audioEngine";
import { buildMachineSnapshot } from "@/lib/producerCoach";

const WAVE_COLORS = {
  sine: "#00d2ff",
  sawtooth: "#ff4fd8",
  square: "#ffd54a",
} as const;
const COACH_MODEL_STORAGE_KEY = "producer-coach-model";

export default function DrumMachine() {
  const machine = useDrumMachineState();
  const userSignedIn = Boolean(machine.patternLibrary.user);
  const [coachModel, setCoachModel] = useState<CoachModelSlug>(DEFAULT_COACH_MODEL);

  useEffect(() => {
    const stored = window.localStorage.getItem(COACH_MODEL_STORAGE_KEY);
    if (isCoachModelSlug(stored)) {
      setCoachModel(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COACH_MODEL_STORAGE_KEY, coachModel);
  }, [coachModel]);

  const snapshot = useMemo(
    () =>
      buildMachineSnapshot({
        bpm: machine.bpm,
        drumPattern: machine.drumPattern,
        melodyPattern: machine.melodyPattern,
        synthWave: machine.synthWave,
      }),
    [machine.bpm, machine.drumPattern, machine.melodyPattern, machine.synthWave]
  );
  const coach = useProducerCoach(snapshot, userSignedIn, coachModel);
  const selectedPadSound = DRUM_SOUNDS[machine.selectedPad];

  return (
    <div className="dj-shell relative min-h-screen px-4 py-8 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="ambient-orb ambient-orb-left" />
        <div className="ambient-orb ambient-orb-right" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <AuthStatus
          authLoading={machine.patternLibrary.authLoading}
          user={machine.patternLibrary.user}
          onSignIn={machine.patternLibrary.handleSignIn}
          onSignOut={machine.patternLibrary.handleSignOut}
        />

        <header className="px-2 pb-8 pt-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.45em] text-zinc-500">
            Neon Performance Rig
          </p>
          <h1 className="bg-gradient-to-r from-rose-500 via-cyan-400 to-lime-300 bg-clip-text text-5xl font-black tracking-[0.3em] text-transparent">
            DRUM MACHINE
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.3em] text-zinc-400">
            16 drum voices, live synth lead, and an AI producer in the room
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <ProducerCoachPanel
            authLoading={machine.patternLibrary.authLoading}
            feedback={coach.feedback}
            error={coach.error}
            hasAnalyzed={coach.hasAnalyzed}
            isLoading={coach.isLoading}
            isStale={coach.isStale}
            remainingToday={coach.remainingToday}
            selectedModel={coachModel}
            userSignedIn={userSignedIn}
            onModelChange={setCoachModel}
            onRefresh={coach.refresh}
            onSignIn={machine.patternLibrary.handleSignIn}
          />

          <div className="flex min-w-0 flex-col items-center gap-6">
            <DrumPadGrid
              activePads={machine.activePads}
              selectedPad={machine.selectedPad}
              sampleAssignments={machine.sampleAssignments}
              onPadClick={machine.triggerSelectedPad}
            />

            <FreesoundPanel
              selectedPadColor={selectedPadSound.color}
              selectedPadName={selectedPadSound.name}
              selectedPadSample={machine.sampleAssignments[machine.selectedPad]}
              isAssigningSample={machine.isAssigningSample}
              sampleError={machine.sampleError}
              onAssignSample={machine.assignSampleToPad}
            />

            <SynthKeyboard
              waveform={machine.synthWave}
              isRecording={machine.isRecording}
              selectedStep={machine.selectedMelodyStep}
              selectedNote={machine.melodyPattern[machine.selectedMelodyStep]}
              activeMidi={machine.activeMidi}
              onWaveformChange={machine.setSynthWave}
              onToggleRecording={machine.toggleRecording}
              onClearSelectedStep={machine.clearSelectedMelodyStep}
              onStartNote={machine.handleSynthStart}
              onStopNote={machine.stopPreviewNote}
            />

            <section className="glass-panel w-full max-w-5xl rounded-[2rem] p-4 md:p-6">
              <MachineControls
                isPlaying={machine.isPlaying}
                bpm={machine.bpm}
                userSignedIn={Boolean(machine.patternLibrary.user)}
                showSave={machine.patternLibrary.showSave}
                showLoad={machine.patternLibrary.showLoad}
                savedCount={machine.patternLibrary.savedPatterns.length}
                flashMessage={machine.patternLibrary.flashMessage}
                onTogglePlayback={machine.togglePlayback}
                onBpmChange={machine.setBpm}
                onClear={machine.clearPattern}
                onToggleSave={machine.patternLibrary.toggleSavePanel}
                onToggleLoad={machine.patternLibrary.toggleLoadPanel}
              />

              <PatternPanels
                showSave={machine.patternLibrary.showSave}
                showLoad={machine.patternLibrary.showLoad}
                userSignedIn={Boolean(machine.patternLibrary.user)}
                saveName={machine.patternLibrary.saveName}
                savedPatterns={machine.patternLibrary.savedPatterns}
                saveInputRef={machine.patternLibrary.saveInputRef}
                onSaveNameChange={machine.patternLibrary.setSaveName}
                onSave={machine.patternLibrary.handleSave}
                onCloseSave={machine.patternLibrary.closeSavePanel}
                onLoad={machine.patternLibrary.handleLoad}
                onOverwrite={machine.patternLibrary.handleOverwrite}
                onDelete={machine.patternLibrary.handleDelete}
              />

              <SequencerGrid
                drumPattern={machine.drumPattern}
                melodyPattern={machine.melodyPattern}
                currentStep={machine.currentStep}
                isPlaying={machine.isPlaying}
                selectedMelodyStep={machine.selectedMelodyStep}
                melodyColor={WAVE_COLORS[machine.synthWave]}
                onToggleDrumStep={machine.toggleDrumStep}
                onSelectMelodyStep={machine.setSelectedMelodyStep}
              />
            </section>

            <p className="text-center text-xs uppercase tracking-[0.25em] text-zinc-600">
              Tap pads for drums. Arm REC to punch notes into the synth lane while the loop runs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
