import { Link } from "react-router-dom";
import { patchNotes, type PatchNoteType } from "../data/patchNotes";
import "./PatchNotes.css";

const TYPE_LABELS: Record<PatchNoteType, string> = {
  "game-design": "Game design",
  backend: "Backend",
  frontend: "Frontend",
  system: "System",
  balance: "Balance"
};

export default function PatchNotes() {
  return (
    <div className="patch-notes-page">
      <section className="patch-notes-hero">
        <Link className="patch-notes-back-link" to="/">
          ← Back to Home page
        </Link>

        <p className="patch-notes-kicker">ARCHONT development log</p>

        <h1>Patch Notes</h1>

        <p>
          A public chronological record of gameplay decisions, system changes,
          development milestones and design direction.
        </p>
      </section>

      <section className="patch-notes-timeline">
        {patchNotes.map((note) => (
          <article className="patch-note-card" key={note.id}>
            <div className="patch-note-meta">
              <time dateTime={note.date}>{note.date}</time>
              <span>{TYPE_LABELS[note.type]}</span>
            </div>

            <h2>{note.title}</h2>

            <p className="patch-note-summary">{note.summary}</p>

            <ul>
              {note.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
