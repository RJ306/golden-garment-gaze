import { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon, Sparkles, Download, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import Reveal from "@/components/Reveal";

/* ------------------------------------------------------------------ */
/* Configuration — point this to your Flask backend when ready.       */
/* The mock fallback returns the person image so the UI is demo-ready.*/
/* ------------------------------------------------------------------ */
const TRYON_ENDPOINT = import.meta.env.VITE_TRYON_ENDPOINT as string | undefined;
const MAX_FILE_MB = 10;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

type Slot = "person" | "garment";

interface UploadCardProps {
  slot: Slot;
  title: string;
  hint: string;
  file: File | null;
  preview: string | null;
  onFile: (f: File | null) => void;
}

/** Elegant drag-and-drop upload card with preview + remove. */
const UploadCard = ({ slot, title, hint, file, preview, onFile }: UploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const validate = (f: File): boolean => {
    if (!ACCEPTED.includes(f.type)) {
      toast.error("Unsupported file type. Use PNG, JPG or WebP.");
      return false;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File too large (max ${MAX_FILE_MB}MB).`);
      return false;
    }
    return true;
  };

  const handle = (f: File | undefined | null) => {
    if (!f) return;
    if (!validate(f)) return;
    onFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      className={`group relative aspect-[4/5] rounded-2xl border-2 border-dashed transition-all duration-500 ease-elegant overflow-hidden ${
        drag
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border bg-card/60 hover:border-primary/60 hover:bg-card"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {preview ? (
        <>
          <img src={preview} alt={`${slot} preview`} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
          <button
            onClick={() => onFile(null)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all"
            aria-label="Remove"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-0 inset-x-0 p-5 text-primary-foreground">
            <p className="text-xs uppercase tracking-widest opacity-80">{title}</p>
            <p className="font-serif text-lg truncate">{file?.name}</p>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold mb-6 transition-transform duration-500 ease-elegant group-hover:scale-110">
            {slot === "person" ? <ImageIcon className="text-primary-foreground" size={28} /> : <Upload className="text-primary-foreground" size={28} />}
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">{slot === "person" ? "Step 01" : "Step 02"}</p>
          <h3 className="font-serif text-2xl mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-[260px]">{hint}</p>
          <span className="mt-6 text-xs uppercase tracking-widest text-foreground/70 border-b border-primary/60 pb-1">
            Click or drag to upload
          </span>
        </button>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TryOn page                                                         */
/* ------------------------------------------------------------------ */
const TryOn = () => {
  const [person, setPerson] = useState<File | null>(null);
  const [garment, setGarment] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setPersonFile = useCallback((f: File | null) => {
    setPerson(f);
    setPersonPreview(f ? URL.createObjectURL(f) : null);
    setResult(null);
  }, []);
  const setGarmentFile = useCallback((f: File | null) => {
    setGarment(f);
    setGarmentPreview(f ? URL.createObjectURL(f) : null);
    setResult(null);
  }, []);

  const generate = async () => {
    if (!person || !garment) {
      toast.error("Please upload both a person and a garment image.");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      if (TRYON_ENDPOINT) {
        // Real backend path — POST multipart to Flask /tryon
        const fd = new FormData();
        fd.append("person", person);
        fd.append("garment", garment);
        const res = await fetch(TRYON_ENDPOINT, { method: "POST", body: fd });
        if (!res.ok) throw new Error("Inference failed");
        const data = await res.json();
        // Expected: { image_base64: "data:image/png;base64,..." }
        setResult(data.image_base64 || data.image);
      } else {
        // Mock path — simulates network + returns the person image as result.
        await new Promise((r) => setTimeout(r, 2400));
        setResult(personPreview);
      }
      toast.success("Try-on generated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `tryon-${Date.now()}.png`;
    a.click();
  };

  const reset = () => {
    setPersonFile(null);
    setGarmentFile(null);
    setResult(null);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 motif-bg pointer-events-none" />
      <div className="container relative py-16 md:py-24">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">The Studio</p>
            <h1 className="font-serif text-5xl md:text-6xl">
              Virtual <span className="gold-text italic">Try-On</span>
            </h1>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
              Upload a person photo and a garment. Our pipeline will warp, blend and render
              a photorealistic composition.
            </p>
          </div>
        </Reveal>

        {/* Upload grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Reveal>
            <UploadCard
              slot="person"
              title="Person Image"
              hint="A clear, front-facing full-body photo works best."
              file={person}
              preview={personPreview}
              onFile={setPersonFile}
            />
          </Reveal>
          <Reveal delay={120}>
            <UploadCard
              slot="garment"
              title="Garment Image"
              hint="A flat-lay or clean cut-out of the garment."
              file={garment}
              preview={garmentPreview}
              onFile={setGarmentFile}
            />
          </Reveal>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
          <button
            onClick={generate}
            disabled={loading || !person || !garment}
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-full bg-gradient-gold text-primary-foreground shadow-gold hover:shadow-elegant transition-all duration-500 ease-elegant hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Weaving threads…
              </>
            ) : (
              <>
                <Sparkles size={18} /> Generate Try-On
              </>
            )}
          </button>
          {(person || garment || result) && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-border bg-card hover:bg-muted transition-all"
            >
              Reset
            </button>
          )}
        </div>

        {/* Result */}
        <div className="max-w-3xl mx-auto mt-16">
          {loading && (
            <div className="rounded-2xl overflow-hidden shadow-card border border-border">
              <div className="aspect-[4/5] shimmer" />
              <div className="p-6 bg-card text-center text-sm text-muted-foreground">
                Aligning warp mask · Applying ATV smoothing · Rendering…
              </div>
            </div>
          )}

          {result && !loading && (
            <Reveal>
              <div className="rounded-2xl overflow-hidden shadow-elegant border border-border bg-card">
                <div className="relative">
                  <img src={result} alt="Try-on result" className="w-full max-h-[700px] object-contain bg-muted" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest">
                    Result
                  </span>
                </div>
                <div className="p-6 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="font-serif text-xl">Composition complete</p>
                    <p className="text-sm text-muted-foreground">Download or refine and try again.</p>
                  </div>
                  <button
                    onClick={download}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryOn;
