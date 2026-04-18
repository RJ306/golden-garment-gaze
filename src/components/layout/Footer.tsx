import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="relative mt-32 border-t border-border bg-gradient-cream">
      <div className="absolute inset-0 motif-bg pointer-events-none" />
      <div className="container relative py-16 grid gap-12 md:grid-cols-3">
        <div>
          <h3 className="font-serif text-2xl">
            Digital <span className="gold-text">Threads</span>
          </h3>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
            An AI-powered virtual try-on platform crafted for the rich textures
            and intricate embroidery of Eastern cultural garments.
          </p>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
            <li><Link to="/tryon" className="hover:text-foreground transition-colors">Try-On Studio</Link></li>
            <li><Link to="/about" className="hover:text-foreground transition-colors">Pipeline</Link></li>
            <li><Link to="/results" className="hover:text-foreground transition-colors">Gallery</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-4">Final Year Project</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Built with React, Tailwind & Flask. Powered by a research-grade
            virtual try-on pipeline featuring Cloth Warp Mask and ATV Loss.
          </p>
        </div>
      </div>
      <div className="gold-divider" />
      <div className="container py-6 text-center text-xs tracking-widest uppercase text-muted-foreground">
        © {new Date().getFullYear()} Digital Threads of Tradition — All rights reserved
      </div>
    </footer>
  );
};

export default Footer;
