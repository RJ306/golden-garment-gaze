import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/tryon", label: "Try-On" },
  { to: "/about", label: "Pipeline" },
  { to: "/results", label: "Gallery" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-elegant ${
        scrolled ? "glass shadow-soft" : "bg-transparent"
      }`}
    >
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <span className="font-serif text-xl md:text-2xl font-semibold tracking-tight">
            Digital <span className="gold-text">Threads</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative text-sm tracking-wide uppercase transition-colors duration-300 ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                } after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-px after:bg-primary after:transition-all after:duration-300 ${
                  pathname === l.to ? "after:w-full" : "after:w-0 hover:after:w-full"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/tryon"
          className="hidden md:inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium tracking-wide bg-gradient-gold text-primary-foreground shadow-gold hover:shadow-elegant transition-all duration-500 ease-elegant hover:scale-[1.03]"
        >
          Try It Now
        </Link>

        <button
          aria-label="Menu"
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-border animate-fade-in-down">
          <div className="container py-6 flex flex-col gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `text-sm uppercase tracking-wide py-2 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/tryon"
              className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium bg-gradient-gold text-primary-foreground shadow-gold"
            >
              Try It Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
