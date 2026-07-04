import { useState } from "react";
import { ChevronDown, StickyNote } from "lucide-react";
import { useProgressStore } from "../../store/progressStore";

// Personal notes for a lesson, persisted locally with the rest of the progress.
// Collapsed by default unless the learner already wrote something.
export default function LessonNotes({ lessonId }: { lessonId: string }) {
  const note = useProgressStore((s) => s.notes[lessonId] ?? "");
  const setNote = useProgressStore((s) => s.setNote);
  const [open, setOpen] = useState(note.length > 0);

  return (
    <div className="glass mt-8 overflow-hidden">
      <button
        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <StickyNote className="h-4 w-4 text-amber-300" />
        My notes
        {note.length > 0 && !open && (
          <span className="pill border-white/10 bg-white/5 text-[10px] text-slate-400">
            saved
          </span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-white/10 p-3">
          <textarea
            value={note}
            onChange={(e) => setNote(lessonId, e.target.value)}
            placeholder="Jot down what you want to remember from this lesson… (saved automatically)"
            rows={5}
            className="w-full resize-y rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-white/25"
            aria-label="Lesson notes"
          />
        </div>
      )}
    </div>
  );
}
