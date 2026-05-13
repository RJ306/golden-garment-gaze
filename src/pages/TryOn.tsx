import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, ImageIcon, Sparkles, Download, RefreshCw, X, Check } from "lucide-react";
import { toast } from "sonner";
import Reveal from "@/components/Reveal";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_MB = 10;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const STABLEVITON_BASE = "https://splendid-throat-unflawed.ngrok-free.dev";

type Slot = "person" | "garment";
type Backend = "ootd" | "stableviton";

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
/*  Selectable image tile (StableVITON gallery)                       */
/* ------------------------------------------------------------------ */
interface TileProps {
  src: string;
  name: string;
  selected: boolean;
  onClick: () => void;
}
const Tile = ({ src, name, selected, onClick }: TileProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(src, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((r) => r.blob())
      .then((blob) => {
        if (active) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        // fallback to direct src if fetch fails
        if (active) setBlobUrl(src);
      });
    return () => {
      active = false;
      if (blobUrl && blobUrl.startsWith("blob:")) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        selected ? "border-primary shadow-gold scale-[1.02]" : "border-border hover:border-primary/60"
      }`}
    >
      {blobUrl ? (
        <img src={blobUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-muted animate-pulse" />
      )}
      {selected && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check size={14} />
        </div>
      )}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  TryOn page                                                         */
/* ------------------------------------------------------------------ */
const TryOn = () => {
  const [backend, setBackend] = useState<Backend>("ootd");

  // OOTDiffusion state
  const [person, setPerson] = useState<File | null>(null);
  const [garment, setGarment] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);

  // StableVITON state
  const [svPersonList, setSvPersonList] = useState<string[]>([]);
  const [svClothList, setSvClothList] = useState<string[]>([]);
  const [svPerson, setSvPerson] = useState<string | null>(null);
  const [svCloth, setSvCloth] = useState<string | null>(null);
  const [svListLoading, setSvListLoading] = useState(false);

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

  // Fetch StableVITON image lists when that backend is selected.
  useEffect(() => {
    if (backend !== "stableviton") return;
    if (svPersonList.length || svClothList.length) return;
    setSvListLoading(true);
    fetch(`${STABLEVITON_BASE}/images`, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((r) => r.json())
      .then((d) => {
        setSvPersonList(d.person_images ?? []);
        setSvClothList(d.cloth_images ?? []);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Could not reach StableVITON server.");
      })
      .finally(() => setSvListLoading(false));
  }, [backend, svPersonList.length, svClothList.length]);

  /** Read a File as a base64 data URL. */
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const generateOOTD = async () => {
    if (!person || !garment) {
      toast.error("Please upload both a person and a garment image.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const [personImage, garmentImage] = await Promise.all([
        fileToDataUrl(person),
        fileToDataUrl(garment),
      ]);
      const { data, error } = await supabase.functions.invoke("tryon-generate", {
        body: { personImage, garmentImage },
      });
      if (error) {
        const ctx = (error as { context?: { status?: number } }).context;
        if (ctx?.status === 429) toast.error("Too many requests. Please wait and retry.");
        else if (ctx?.status === 402) toast.error("AI credits exhausted.");
        else toast.error(error.message || "Generation failed.");
        return;
      }
      if (!data?.image) {
        toast.error("The model did not return an image.");
        return;
      }
      setResult(data.image);
      toast.success("Try-on generated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateStableVITON = async () => {
    if (!svPerson || !svCloth) {
      toast.error("Please select a person and a cloth image.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${STABLEVITON_BASE}/tryon`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ person: svPerson, cloth: svCloth }),
      });
      if (!res.ok) {
        toast.error(`StableVITON failed (${res.status}).`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult(url);
      toast.success("Try-on generated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Could not reach StableVITON server.");
    } finally {
      setLoading(false);
    }
  };

  const generate = () => (backend === "ootd" ? generateOOTD() : generateStableVITON());

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
    setSvPerson(null);
    setSvCloth(null);
    setResult(null);
  };

  const canGenerate =
    backend === "ootd" ? !!(person && garment) : !!(svPerson && svCloth);

  return (
    <div className="relative">
      <div className="absolute inset-0 motif-bg pointer-events-none" />
      <div className="container relative py-16 md:py-24">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">The Studio</p>
            <h1 className="font-serif text-5xl md:text-6xl">
              Virtual <span className="gold-text italic">Try-On</span>
            </h1>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
              Choose a model backend, then compose your photorealistic try-on.
            </p>
          </div>
        </Reveal>

        {/* Backend toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 rounded-full border border-border bg-card">
            {([
              { id: "ootd", label: "OOTDiffusion" },
              { id: "stableviton", label: "StableVITON" },
            ] as { id: Backend; label: string }[]).map((b) => (
              <button
                key={b.id}
                onClick={() => { setBackend(b.id); setResult(null); }}
                className={`px-6 py-2.5 rounded-full text-sm uppercase tracking-widest transition-all ${
                  backend === b.id
                    ? "bg-gradient-gold text-primary-foreground shadow-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* OOTDiffusion: upload grid */}
        {backend === "ootd" && (
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
        )}

        {/* StableVITON: gallery picker */}
        {backend === "stableviton" && (
          <div className="max-w-6xl mx-auto space-y-12">
            {svListLoading && (
              <p className="text-center text-muted-foreground">Loading gallery from RTX 3090…</p>
            )}

            {!svListLoading && (
              <>
                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="font-serif text-2xl">Select a person</h3>
                    {svPerson && (
                      <span className="text-xs uppercase tracking-widest text-primary">{svPerson}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {svPersonList.map((name) => (
                      <Tile
                        key={name}
                        src={`${STABLEVITON_BASE}/person/${name}`}
                        name={name}
                        selected={svPerson === name}
                        onClick={() => { setSvPerson(name); setResult(null); }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="font-serif text-2xl">Select a garment</h3>
                    {svCloth && (
                      <span className="text-xs uppercase tracking-widest text-primary">{svCloth}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {svClothList.map((name) => (
                      <Tile
                        key={name}
                        src={`${STABLEVITON_BASE}/cloth/${name}`}
                        name={name}
                        selected={svCloth === name}
                        onClick={() => { setSvCloth(name); setResult(null); }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
          <button
            onClick={generate}
            disabled={loading || !canGenerate}
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
          {(person || garment || result || svPerson || svCloth) && (
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
                {backend === "stableviton"
                  ? "Running StableVITON on RTX 3090…"
                  : "Aligning warp mask · Applying ATV smoothing · Rendering…"}
              </div>
            </div>
          )}

          {result && !loading && (
            <Reveal>
              <div className="rounded-2xl overflow-hidden shadow-elegant border border-border bg-card">
                <div className="relative">
                  <img src={result} alt="Try-on result" className="w-full max-h-[700px] object-contain bg-muted" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest">
                    {backend === "stableviton" ? "StableVITON" : "OOTDiffusion"}
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
