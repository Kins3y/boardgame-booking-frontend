import { Link } from "react-router-dom";
import { patchNotes, type PatchNoteType } from "../data/patchNotes";
import { useI18n } from "../i18n/I18nContext";
import "./PatchNotes.css";

export default function PatchNotes() {
  const { language, t } = useI18n();

  const typeLabels: Record<PatchNoteType, string> = {
    "game-design": t("patchNotes.game-design"),
    backend: t("patchNotes.backend"),
    frontend: t("patchNotes.frontend"),
    system: t("patchNotes.system"),
    balance: t("patchNotes.balance")
  };

  return (
    <div className="patch-notes-page">
      <section className="patch-notes-hero">
        <Link className="patch-notes-back-link" to="/">
          ← {t("patchNotes.back")}
        </Link>

        <p className="patch-notes-kicker">{t("patchNotes.kicker")}</p>

        <h1>{t("patchNotes.title")}</h1>

        <p>{t("patchNotes.description")}</p>
      </section>

      <section className="patch-notes-timeline">
        {[...patchNotes].reverse().map((note) => (
          <article className="patch-note-card" key={note.id}>
            <div className="patch-note-meta">
              <time dateTime={note.date}>{note.date}</time>
              <span>{typeLabels[note.type]}</span>
            </div>

            <h2>{note.title[language]}</h2>

            <p className="patch-note-summary">{note.summary[language]}</p>

            <ul>
              {note.changes.map((change, index) => (
                <li key={`${note.id}-${index}`}>{change[language]}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
