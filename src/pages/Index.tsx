import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, Wand2 } from "lucide-react";
import heroModel from "@/assets/hero-model.jpg";
import garment1 from "@/assets/garment-1.jpg";
import garment2 from "@/assets/garment-2.jpg";
import garment3 from "@/assets/garment-3.jpg";
import Reveal from "@/components/Reveal";

/**
 * Landing page — sets the editorial tone of the project.
 * Sections: Hero, Overview, Contributions, Showcase, Team.
 */
const Index = () => {
  return (
    <div className="overflow-hidden">
      {/* HERO ------------------------------------------------------------- */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-hero">
        <div className="absolute inset-0 motif-bg pointer-events-none" />
        <div className="container relative grid md:grid-cols-2 gap-12 items-center py-20">
          <div className="animate-fade-in space-y-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles size={14} className="text-primary" />
              Final Year Project · 2025
            </span>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] font-medium">
              Digital Threads
              <br />
              of <span className="gold-text italic">Tradition</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              An AI-powered virtual try-on, refined for the intricate embroidery,
              flowing drapes, and cultural nuance of Eastern garments.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/tryon"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-gold text-primary-foreground shadow-gold hover:shadow-elegant transition-all duration-500 ease-elegant hover:scale-[1.03]"
              >
                Enter the Studio
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border bg-card/60 backdrop-blur text-foreground hover:bg-card transition-all duration-300"
              >
                Explore the Pipeline
              </Link>
            </div>

            <div className="flex gap-10 pt-6 border-t border-border/60 max-w-md">
              <div>
                <div className="font-serif text-3xl gold-text">98<span className="text-base">%</span></div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Cloth Fidelity</div>
              </div>
              <div>
                <div className="font-serif text-3xl gold-text">2.4<span className="text-base">s</span></div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Inference</div>
              </div>
              <div>
                <div className="font-serif text-3xl gold-text">12k+</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Eastern Samples</div>
              </div>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="absolute -inset-6 bg-gradient-gold opacity-20 blur-3xl rounded-full" />
            <div className="relative rounded-3xl overflow-hidden shadow-elegant border border-border/60">
              <img
                src={heroModel}
                alt="Model wearing a cream and gold embroidered Eastern shalwar kameez"
                width={1080}
                height={1620}
                className="w-full h-[640px] object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-foreground/60 to-transparent">
                <p className="text-primary-foreground/90 font-serif italic text-lg">
                  "Every thread, faithfully rendered."
                </p>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-card animate-float">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Powered by</div>
              <div className="font-serif text-lg">StableVITON · ATV</div>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW --------------------------------------------------------- */}
      <section className="container py-28">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">The Vision</p>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">
              A try-on engine that <span className="gold-text italic">honours</span> tradition.
            </h2>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
              Mainstream virtual try-on excels at western silhouettes but fails on the rich
              embroidery, layered dupattas and intricate drapes of Eastern wear. We rebuild
              the warp pipeline from first principles to preserve every detail.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CONTRIBUTIONS ---------------------------------------------------- */}
      <section className="bg-gradient-cream relative">
        <div className="absolute inset-0 motif-bg pointer-events-none" />
        <div className="container relative py-28">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">Contributions</p>
              <h2 className="font-serif text-4xl md:text-5xl">Two pillars of our research</h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Layers,
                title: "Cloth Warp Mask",
                desc: "A structure-aware mask that aligns the garment's geometry with the body, preserving embroidery, pleats and dupatta folds with sub-pixel precision.",
                tag: "Geometric Module",
              },
              {
                icon: Wand2,
                title: "ATV Loss (simplified)",
                desc: "Adaptive Total Variation loss that smooths fabric drape while keeping intricate motifs sharp — a delicate balance crucial for couture textiles.",
                tag: "Loss Function",
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 120}>
                <div className="group relative h-full p-10 rounded-2xl glass shadow-card hover:shadow-elegant transition-all duration-500 ease-elegant hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                      <c.icon className="text-primary-foreground" size={26} />
                    </div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.tag}</span>
                  </div>
                  <h3 className="font-serif text-2xl mb-3">{c.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE --------------------------------------------------------- */}
      <section className="container py-28">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Curated Garments</p>
              <h2 className="font-serif text-4xl md:text-5xl">The collection</h2>
            </div>
            <Link to="/results" className="text-sm uppercase tracking-widest text-foreground border-b border-primary pb-1 hover:opacity-70 transition">
              View Gallery
            </Link>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { src: garment1, name: "Bridal Lehenga", region: "South Asian Couture" },
            { src: garment2, name: "Anarkali Kurta", region: "Mughal Heritage" },
            { src: garment3, name: "Royal Sherwani", region: "Zardozi Embroidery" },
          ].map((g, i) => (
            <Reveal key={g.name} delay={i * 100}>
              <div className="group relative overflow-hidden rounded-2xl shadow-card hover:shadow-elegant transition-all duration-700 ease-elegant">
                <img
                  src={g.src}
                  alt={g.name}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="w-full h-[480px] object-cover transition-transform duration-1000 ease-elegant group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent opacity-90" />
                <div className="absolute bottom-0 inset-x-0 p-6 text-primary-foreground">
                  <p className="text-xs uppercase tracking-widest opacity-80">{g.region}</p>
                  <h3 className="font-serif text-2xl mt-1">{g.name}</h3>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TEAM ------------------------------------------------------------- */}
      <section className="bg-gradient-cream">
        <div className="container py-28">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">The Atelier</p>
              <h2 className="font-serif text-4xl md:text-5xl">Crafted by</h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Aisha Rahman", role: "Research Lead", initials: "AR" },
              { name: "Daniyal Ahmed", role: "ML Engineer", initials: "DA" },
              { name: "Saira Khan", role: "Frontend & UX", initials: "SK" },
            ].map((m, i) => (
              <Reveal key={m.name} delay={i * 120}>
                <div className="group p-8 rounded-2xl bg-card border border-border shadow-card hover:shadow-gold transition-all duration-500 ease-elegant hover:-translate-y-1 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-serif text-2xl shadow-gold">
                    {m.initials}
                  </div>
                  <h3 className="font-serif text-xl mt-5">{m.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">{m.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA -------------------------------------------------------------- */}
      <section className="container py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-12 md:p-20 text-center shadow-elegant">
            <div className="absolute inset-0 motif-bg opacity-[0.08]" />
            <div className="relative">
              <h2 className="font-serif text-4xl md:text-5xl">
                Ready to drape <span className="gold-text italic">tradition</span> in pixels?
              </h2>
              <p className="mt-6 text-background/70 max-w-2xl mx-auto">
                Step into the studio and see your garments brought to life by our research-grade pipeline.
              </p>
              <Link
                to="/tryon"
                className="inline-flex items-center gap-2 mt-10 px-8 py-4 rounded-full bg-gradient-gold text-primary-foreground shadow-gold hover:scale-[1.03] transition-all duration-500 ease-elegant"
              >
                Open Try-On Studio <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default Index;
