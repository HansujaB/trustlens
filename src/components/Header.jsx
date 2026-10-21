import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./ui";

const links = [
  ["How it works", "#how-it-works"],
  ["The evidence", "#evidence"],
  ["Capabilities", "#capabilities"],
];
export default function Header() {
  const [open, setOpen] = useState(false);
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
        <a href="#investigate" className="nav-cta">
          Open workspace <ArrowUpRight size={15} />
        </a>
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
            Try the sample <ArrowUpRight size={16} />
          </a>
        </nav>
      )}
    </header>
  );
}
