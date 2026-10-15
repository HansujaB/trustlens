import { useState } from "react";
import { ArrowUpRight, Link2, LockKeyhole } from "lucide-react";

export default function InvestigationForm({ onPreview }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const input = value.trim();
    let valid = /^0x[a-fA-F0-9]{40}$/.test(input);
    try {
      const url = new URL(input.includes("://") ? input : `https://${input}`);
      valid ||=
        ["https:", "http:"].includes(url.protocol) &&
        url.hostname.includes(".") &&
        !url.username &&
        !url.password;
    } catch {
      /* Show inline validation below. */
    }
    if (!valid) {
      setError(
        "Enter a project website (such as example.com) or a 42-character EVM contract address.",
      );
      return;
    }
    setError("");
    onPreview(input);
  }
  return (
    <section className="investigate-section" id="investigate">
      <div className="container">
        <div className="eyebrow">
          <span className="live-dot" /> YOUR NEXT QUESTION STARTS HERE
        </div>
        <h2>
          Big promises?
          <br />
          <em>Look a little closer.</em>
        </h2>
        <p>Start with a link. Follow the evidence.</p>
        <form className="investigation-form" onSubmit={submit} noValidate>
          <label className="sr-only" htmlFor="project-input">
            Project website or contract address
          </label>
          <Link2 size={19} aria-hidden="true" />
          <input
            id="project-input"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError("");
            }}
            placeholder="Project link or contract address"
            autoComplete="off"
            spellCheck="false"
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? "input-error preview-note" : "preview-note"
            }
          />
          <button type="submit">
            Take a closer look <ArrowUpRight size={18} />
          </button>
        </form>
        {error && (
          <p className="input-error" id="input-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-notes" id="preview-note">
          <span>
            <LockKeyhole size={12} /> No wallet required
          </span>
          <span>UI preview · Live checks coming later</span>
        </div>
        <button
          className="sample-shortcut"
          onClick={() => {
            setValue("atlas.example");
            setError("");
            onPreview("atlas.example");
          }}
        >
          Just curious? Try the illustrative example <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}
