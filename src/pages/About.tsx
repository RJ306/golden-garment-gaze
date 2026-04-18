import Reveal from "@/components/Reveal";
import { ScanFace, PersonStanding, Scissors, Layers, Wand2, Image as ImageIc } from "lucide-react";

const steps = [
  { icon: ScanFace, title: "OpenPose", desc: "Estimates 2D body keypoints to anchor garment alignment." },
  { icon: PersonStanding, title: "DensePose", desc: "Maps every pixel of the body to a 3D surface for accurate warping." },
  { icon: Scissors, title: "Cloth Segmentation", desc: "Isolates the garment from its background with pixel-level precision." },
  { icon: Layers, title: "Cloth Warp Mask", desc: "Our contribution — geometry-aware warp preserving embroidery and folds." },
  { icon: Wand2, title: "ATV Loss Refinement", desc: "Smooths drape while keeping intricate motifs sharp." },
  { icon: ImageIc, title: "StableVITON Render", desc: "Diffusion-based composition for photoreal final output." },
];

const About = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 motif-bg pointer-events-none" />
      <div className="container relative py-20 md:py-28">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">The Pipeline</p>
            <h1 className="font-serif text-5xl md:text-6xl">
              From pixels to <span className="gold-text italic">poetry</span>
            </h1>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
              Our six-stage pipeline transforms a person and a garment image into a
              photorealistic try-on, faithful to every embroidered detail.
            </p>
          </div>
        </Reveal>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />

          {steps.map((s, i) => {
            const left = i % 2 === 0;
            return (
              <Reveal key={s.title} delay={i * 80}>
                <div className={`relative flex items-center mb-12 md:mb-20 ${left ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  {/* Marker */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-gold shadow-gold flex items-center justify-center">
                      <s.icon className="text-primary-foreground" size={24} />
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`ml-28 md:ml-0 md:w-[44%] ${left ? "md:pr-16" : "md:pl-16"}`}>
                    <div className="p-7 rounded-2xl glass shadow-card hover:shadow-elegant transition-all duration-500 ease-elegant hover:-translate-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">
                        Stage {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3 className="font-serif text-2xl mb-2">{s.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Technical strip */}
        <Reveal>
          <div className="mt-24 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { k: "Backbone", v: "StableVITON Diffusion" },
              { k: "Loss Functions", v: "L1 + Perceptual + ATV" },
              { k: "Dataset", v: "Eastern Garments Corpus" },
            ].map((m) => (
              <div key={m.k} className="p-6 rounded-2xl bg-card border border-border shadow-card text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{m.k}</p>
                <p className="font-serif text-xl mt-2">{m.v}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default About;
