import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./ui";
import { useWalletAuth } from "../lib/WalletAuth";

const links = [
  ["How it works", "#how-it-works"],
  ["The evidence", "#evidence"],
  ["Questions", "#faq"],
];
export default function Header() {
  const [open, setOpen] = useState(false);
  const { wallet, busy, error, login, logout, dismissError } = useWalletAuth();
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a href="#investigate" className="nav-cta">
            Open workspace <ArrowUpRight size={15} />
          </a>
          <button
            type="button"
            className="nav-sign-in"
            disabled={busy}
            onClick={wallet ? logout : login}
            title={
              wallet
                ? `Signed in as ${wallet}. Sign out.`
                : "Sign in with your Solana wallet using a login message"
            }
          >
            {busy ? "Please wait…" : wallet ? "Sign out" : "Sign in"}
          </button>
          <button
            className="menu-toggle"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {error && (
        <div className="container nav-auth-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Dismiss sign-in message"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
              <ArrowUpRight size={16} />
            </a>
          ))}
          <a href="#investigate" onClick={() => setOpen(false)}>
            Open workspace <ArrowUpRight size={16} />
          </a>
        </nav>
      )}
    </header>
  );
}
