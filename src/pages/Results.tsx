import { useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import personBefore from "@/assets/person-before.jpg";
import personAfter from "@/assets/person-after.jpg";
import g1 from "@/assets/garment-1.jpg";
import g2 from "@/assets/garment-2.jpg";
import g3 from "@/assets/garment-3.jpg";
import hero from "@/assets/hero-model.jpg";

/* ------------------------------------------------------------------ */
/*  Before/After comparison slider                                     */
/* ------------------------------------------------------------------ */
const Compare = ({ before, after }: { before: string; after: string }) => {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.min(100, Math.max(0, p)));
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-elegant border border-border select-none cursor-ew-resize"
      onMouseDown={(e) => { dragging.current = true; move(e.clientX); }}
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchStart={(e) => { dragging.current = true; move(e.touches[0].clientX); }}
      onTouchMove={(e) => dragging.current && move(e.touches[0].clientX)}
      onTouchEnd={() => (dragging.current = false)}
    >
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${(100 / pos) * 100}%`, maxWidth: "none" }} />
      </div>
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest">Before</div>
      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-gold text-primary-foreground text-xs uppercase tracking-widest shadow-gold">After</div>
      <div className="absolute top-0 bottom-0 w-px bg-primary-foreground/90 shadow-gold" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-gold shadow-gold flex items-center justify-center">
          <div className="flex gap-1">
            <span className="w-1 h-4 bg-primary-foreground rounded" />
            <span className="w-1 h-4 bg-primary-foreground rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

const gallery = [
  { src: hero, title: "Cream Chikankari", region: "Lucknowi" },
  { src: g1, title: "Bridal Lehenga", region: "Bridal Couture" },
  { src: personAfter, title: "Royal Red Bridal", region: "Heritage" },
  { src: g2, title: "Teal Anarkali", region: "Mughal Era" },
  { src: g3, title: "Emerald Sherwani", region: "Zardozi" },
  { src: personBefore, title: "Soft Cotton", region: "Everyday" },
];

const Results = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 motif-bg pointer-events-none" />
      <div className="container relative py-20 md:py-28">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">The Gallery</p>
            <h1 className="font-serif text-5xl md:text-6xl">
              Results that <span className="gold-text italic">drape beautifully</span>
            </h1>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
              Curated outputs from our virtual try-on engine across a range of Eastern silhouettes.
            </p>
          </div>
        </Reveal>

        {/* Compare */}
        <Reveal>
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto items-center mb-24">
            <Compare before={personBefore} after={personAfter} />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">Before · After</p>
              <h2 className="font-serif text-4xl mb-5">Drag to reveal the transformation</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our cloth warp mask preserves embroidery placement while the ATV loss
                ensures the fabric drapes naturally across the body's contours — even on
                complex bridal couture.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8 max-w-sm">
                <div>
                  <div className="font-serif text-3xl gold-text">SSIM 0.92</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Structural Similarity</div>
                </div>
                <div>
                  <div className="font-serif text-3xl gold-text">LPIPS 0.08</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Perceptual Distance</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Gallery grid */}
        <Reveal>
          <h2 className="font-serif text-3xl md:text-4xl mb-10 text-center">Curated outputs</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {gallery.map((g, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="group relative overflow-hidden rounded-2xl shadow-card hover:shadow-elegant transition-all duration-700 ease-elegant">
                <img
                  src={g.src}
                  alt={g.title}
                  loading="lazy"
                  className="w-full h-[420px] object-cover transition-transform duration-1000 ease-elegant group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent opacity-90" />
                <div className="absolute bottom-0 inset-x-0 p-5 text-primary-foreground translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-elegant">
                  <p className="text-xs uppercase tracking-widest opacity-80">{g.region}</p>
                  <h3 className="font-serif text-xl mt-1">{g.title}</h3>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Results;
