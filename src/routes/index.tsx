import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart, Plus, Trash2, X } from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nossa Árvore do Amor • 08/02/2025" },
      { name: "description", content: "Uma árvore genealógica romântica feita só pra nós dois." },
      { property: "og:title", content: "Nossa Árvore do Amor" },
      { property: "og:description", content: "Cada folha guarda uma lembrança nossa." },
    ],
  }),
  component: Index,
});

// Relationship start: 08/02/2025 (DD/MM/YYYY)
const START_DATE = new Date(2025, 1, 8);

type Memory = {
  id: string;
  image: string; // dataURL
  comment: string;
  date?: string;
};

type SlotData = Record<string, Memory>;

// Fixed slot positions on the SVG (percentages of the tree container)
const SLOTS: { id: string; x: number; y: number; size: number }[] = [
  { id: "s1",  x: 50, y: 12, size: 78 }, // top center (crown)
  { id: "s2",  x: 30, y: 20, size: 64 },
  { id: "s3",  x: 70, y: 20, size: 64 },
  { id: "s4",  x: 18, y: 32, size: 70 },
  { id: "s5",  x: 82, y: 32, size: 70 },
  { id: "s6",  x: 40, y: 30, size: 60 },
  { id: "s7",  x: 60, y: 30, size: 60 },
  { id: "s8",  x: 26, y: 46, size: 68 },
  { id: "s9",  x: 74, y: 46, size: 68 },
  { id: "s10", x: 50, y: 50, size: 72 },
];

const STORAGE_KEY = "love-tree-memories-v1";

async function compressImage(file: File, maxSize = 900, quality = 0.8): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

async function cropImageToDataUrl(
  src: string,
  area: Area,
  outSize = 600,
  quality = 0.82,
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outSize, outSize);
  return canvas.toDataURL("image/jpeg", quality);
}

function Index() {
  const [data, setData] = useState<SlotData>({});
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("Não foi possível salvar (armazenamento cheio):", err);
    }
  }, [data, loaded]);

  const daysTogether = useMemo(() => {
    const ms = Date.now() - START_DATE.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }, []);

  const hearts = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 12,
        size: 0.7 + Math.random() * 1.2,
        key: i,
      })),
    []
  );

  const saveMemory = (slot: string, memory: Memory) => {
    setData((d) => ({ ...d, [slot]: memory }));
  };
  const deleteMemory = (slot: string) => {
    setData((d) => {
      const c = { ...d };
      delete c[slot];
      return c;
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* floating hearts */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {hearts.map((h) => (
          <span
            key={h.key}
            className="heart-float"
            style={{
              left: `${h.left}%`,
              animationDelay: `${h.delay}s`,
              animationDuration: `${h.duration}s`,
              fontSize: `${h.size}rem`,
            }}
          >
            ♥
          </span>
        ))}
      </div>

      <header className="relative z-10 pt-10 pb-6 text-center px-4">
        <p className="font-serif italic text-sm tracking-[0.3em] uppercase text-muted-foreground">
          Desde 08 · 02 · 2025
        </p>
        <h1 className="font-display text-6xl md:text-8xl text-primary mt-2 drop-shadow-sm">
          Nossa Árvore do Amor
        </h1>
        <p className="font-serif text-lg md:text-xl text-foreground/70 mt-3 max-w-xl mx-auto">
          Cada folha é uma lembrança. Passe o mouse para reviver, clique nas vagas vazias
          para plantar uma nova memória.
        </p>
        <div className="mt-5 inline-flex items-center gap-3 bg-card/80 backdrop-blur px-5 py-2 rounded-full border border-rose/30 shadow-sm">
          <Heart className="w-4 h-4 fill-rose text-rose" />
          <span className="font-serif text-sm tracking-wide">
            <strong className="text-rose font-semibold">{daysTogether}</strong> dias juntos
          </span>
          <Heart className="w-4 h-4 fill-rose text-rose" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-3xl sway">
          <TreeSVG />

          {/* Slots overlay */}
          <div className="absolute inset-0">
            {SLOTS.map((s) => {
              const mem = data[s.id];
              return (
                <div
                  key={s.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  onMouseEnter={() => setHoveredSlot(s.id)}
                  onMouseLeave={() => setHoveredSlot(null)}
                >
                  <button
                    onClick={() => setOpenSlot(s.id)}
                    className="heart-node group relative grid place-items-center rounded-full border-[3px] border-rose/80 bg-card overflow-hidden transition-transform hover:scale-110"
                    style={{ width: s.size, height: s.size }}
                    aria-label={mem ? "Ver memória" : "Adicionar memória"}
                  >
                    {mem ? (
                      <img
                        src={mem.image}
                        alt={mem.comment}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-rose/70">
                        <Plus className="w-5 h-5" />
                      </div>
                    )}
                  </button>

                  {/* Hover tooltip */}
                  {mem && hoveredSlot === s.id && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full z-30 w-56 animate-in fade-in zoom-in-95">
                      <div className="bg-popover text-popover-foreground rounded-xl shadow-xl px-4 py-3 border border-rose/40">
                        <div className="flex items-start gap-2">
                          <Heart className="w-3.5 h-3.5 mt-1 shrink-0 fill-rose text-rose" />
                          <p className="font-serif italic text-sm leading-snug">
                            "{mem.comment}"
                          </p>
                        </div>
                        {mem.date && (
                          <p className="font-display text-rose-soft text-base mt-1 text-right">
                            {mem.date}
                          </p>
                        )}
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-popover border-r border-b border-rose/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center font-serif italic text-muted-foreground mt-8 text-sm">
          "Plantamos esse amor em 08 de fevereiro de 2025 — e ele só faz crescer."
        </p>
      </main>

      <MemoryDialog
        slot={openSlot}
        memory={openSlot ? data[openSlot] : undefined}
        onClose={() => setOpenSlot(null)}
        onSave={(m) => openSlot && saveMemory(openSlot, m)}
        onDelete={() => openSlot && deleteMemory(openSlot)}
      />
    </div>
  );
}

function TreeSVG() {
  return (
    <svg
      viewBox="0 0 400 500"
      className="absolute inset-0 w-full h-full"
      aria-hidden
    >
      <defs>
        <radialGradient id="crown" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="oklch(0.82 0.12 15)" />
          <stop offset="55%" stopColor="oklch(0.68 0.18 18)" />
          <stop offset="100%" stopColor="oklch(0.45 0.18 20)" />
        </radialGradient>
        <linearGradient id="bark" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.32 0.05 40)" />
          <stop offset="50%" stopColor="oklch(0.45 0.07 40)" />
          <stop offset="100%" stopColor="oklch(0.3 0.05 40)" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <ellipse cx="200" cy="475" rx="170" ry="14" fill="oklch(0.4 0.08 145 / 0.35)" />

      {/* Trunk */}
      <path
        d="M190 480 Q188 380 175 320 Q170 280 195 240 Q210 210 200 170"
        stroke="url(#bark)"
        strokeWidth="28"
        strokeLinecap="round"
        fill="none"
      />
      {/* Branches */}
      <path d="M195 280 Q140 250 100 220" stroke="url(#bark)" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M195 270 Q260 240 310 215" stroke="url(#bark)" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M198 220 Q150 195 110 170" stroke="url(#bark)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M200 215 Q260 190 305 165" stroke="url(#bark)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M200 180 Q180 130 170 90" stroke="url(#bark)" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M200 180 Q225 130 235 90" stroke="url(#bark)" strokeWidth="9" fill="none" strokeLinecap="round" />

      {/* Foliage clouds (heart-shaped crown) */}
      <g opacity="0.95">
        <circle cx="200" cy="120" r="95" fill="url(#crown)" />
        <circle cx="120" cy="170" r="70" fill="url(#crown)" />
        <circle cx="280" cy="170" r="70" fill="url(#crown)" />
        <circle cx="90" cy="230" r="55" fill="url(#crown)" />
        <circle cx="310" cy="230" r="55" fill="url(#crown)" />
        <circle cx="170" cy="240" r="50" fill="url(#crown)" />
        <circle cx="230" cy="240" r="50" fill="url(#crown)" />
      </g>

      {/* Scattered tiny hearts as petals */}
      {Array.from({ length: 22 }).map((_, i) => {
        const cx = 60 + Math.random() * 280;
        const cy = 60 + Math.random() * 220;
        return (
          <text
            key={i}
            x={cx}
            y={cy}
            fontSize={10 + Math.random() * 8}
            fill="oklch(0.95 0.08 15 / 0.75)"
            textAnchor="middle"
          >
            ♥
          </text>
        );
      })}

      {/* Roots */}
      <path d="M195 478 Q160 478 130 470" stroke="url(#bark)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M195 478 Q230 478 270 470" stroke="url(#bark)" strokeWidth="7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function MemoryDialog({
  slot,
  memory,
  onClose,
  onSave,
  onDelete,
}: {
  slot: string | null;
  memory?: Memory;
  onClose: () => void;
  onSave: (m: Memory) => void;
  onDelete: () => void;
}) {
  const [image, setImage] = useState<string>("");
  const [comment, setComment] = useState("");
  const [date, setDate] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slot) {
      setImage(memory?.image ?? "");
      setComment(memory?.comment ?? "");
      setDate(memory?.date ?? "");
    }
  }, [slot, memory]);

  const handleFile = async (file: File) => {
    try {
      const compressed = await compressImage(file, 900, 0.8);
      setImage(compressed);
    } catch (err) {
      console.error("Falha ao processar imagem:", err);
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const canSave = image && comment.trim().length > 0;

  return (
    <Dialog open={!!slot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-rose/40">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-rose">
            {memory ? "Nossa lembrança" : "Plantar uma memória"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative cursor-pointer rounded-xl border-2 border-dashed border-rose/40 bg-muted/40 aspect-square overflow-hidden grid place-items-center transition hover:border-rose"
          >
            {image ? (
              <img src={image} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground p-6">
                <Heart className="w-10 h-10 mx-auto mb-2 text-rose/60" />
                <p className="font-serif">Clique para escolher uma foto nossa</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="font-serif">Comentário</Label>
            <Textarea
              id="comment"
              placeholder="Aquele dia em que..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="font-serif resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="font-serif">Data (opcional)</Label>
            <Input
              id="date"
              placeholder="ex: 14 fev 2025"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-serif"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              disabled={!canSave}
              onClick={() => {
                onSave({
                  id: slot ?? crypto.randomUUID(),
                  image,
                  comment: comment.trim(),
                  date: date.trim() || undefined,
                });
                onClose();
              }}
              className="flex-1 bg-rose hover:bg-rose/90 text-primary-foreground"
            >
              <Heart className="w-4 h-4 mr-1 fill-current" /> Salvar
            </Button>
            {memory && (
              <Button
                variant="outline"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="border-rose/40 text-rose hover:bg-rose/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
