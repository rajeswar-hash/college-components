import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Category, Condition } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft,
  Cpu,
  FileText,
  ImagePlus,
  MapPin,
  MoreHorizontal,
  Rocket,
  Smartphone,
  Sparkles,
  Upload,
  Wrench,
  X,
} from "lucide-react";

const MAX_IMAGE_BYTES = 600 * 1024;
const MAX_IMAGE_DIMENSION = 1280;

const categoryOptions: { value: Category; label: string; icon: typeof Cpu }[] = [
  { value: "Components", label: "Components", icon: Cpu },
  { value: "Gadgets", label: "Gadgets", icon: Smartphone },
  { value: "Notes", label: "Notes", icon: FileText },
  { value: "Tools", label: "Tools", icon: Wrench },
  { value: "Projects", label: "Projects", icon: Rocket },
  { value: "Others", label: "Others", icon: MoreHorizontal },
];

const conditionOptions: { value: Condition; title: string; note: string }[] = [
  { value: "New", title: "New", note: "Never used" },
  { value: "Like New", title: "Like New", note: "Used once or twice" },
  { value: "Used", title: "Used", note: "Regular use" },
  { value: "Old", title: "Old", note: "Visible wear" },
];

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process image"));
    image.src = dataUrl;
  });
}

async function compressImage(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return originalDataUrl;

  context.drawImage(image, 0, 0, width, height);

  let quality = 0.82;
  let compressed = canvas.toDataURL("image/jpeg", quality);

  while (compressed.length > MAX_IMAGE_BYTES * 1.37 && quality > 0.45) {
    quality -= 0.08;
    compressed = canvas.toDataURL("image/jpeg", quality);
  }

  return compressed;
}

const SellPage = () => {
  const { user, isAuthenticated, supabaseUser } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [images, setImages] = useState<string[]>([]);
  const [locationHint, setLocationHint] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingImages, setProcessingImages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    if (images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setProcessingImages((count) => count + files.length);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setProcessingImages((count) => Math.max(0, count - 1));
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        setProcessingImages((count) => Math.max(0, count - 1));
        continue;
      }

      try {
        const compressed = await compressImage(file);
        setImages((prev) => [...prev, compressed]);
      } catch {
        toast.error(`Could not process ${file.name}`);
      } finally {
        setProcessingImages((count) => Math.max(0, count - 1));
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Please sign in to list an item.</p>
          <AuthModal open={true} onClose={() => navigate("/")} />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || !category || !condition) {
      toast.error("Please fill in all fields");
      return;
    }
    if (processingImages > 0) {
      toast.error("Please wait for image processing to finish.");
      return;
    }
    if (!supabaseUser?.id) {
      toast.error("Your session is not ready. Please sign out and sign back in.");
      return;
    }

    setSubmitting(true);
    try {
      const detailLines = [
        description.trim(),
        locationHint.trim() ? `Location: ${locationHint.trim()}` : "",
        negotiable ? "Price: Negotiable" : "",
      ].filter(Boolean);

      const { error } = await supabase.from("listings").insert({
        title,
        description: detailLines.join("\n\n"),
        price: Number(price),
        category,
        condition,
        images,
        seller_id: supabaseUser.id,
        college: user?.college || "",
        sold: false,
        likes: 0,
      });

      if (error) throw error;
      toast.success("Listing created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(240,253,250,0.9),rgba(255,255,255,1))]">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-5 rounded-xl px-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="animate-fade-in">
          <div className="mb-6 space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Post an Item</h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Post faster with clear details, honest condition, and sharp photos so buyers can trust your listing instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-primary/10 bg-background/95 p-4 shadow-[0_20px_60px_rgba(15,118,110,0.10)] backdrop-blur-sm sm:p-6">
            <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <div>
                <Label className="text-base font-semibold text-foreground">Add Photos (Max 5)</Label>
                <p className="mt-1 text-sm text-muted-foreground">First photo will be cover image</p>
                <p className="mt-1 text-xs font-medium text-primary">Clear photos = faster sale</p>
              </div>

              <div
                className="cursor-pointer rounded-3xl border-2 border-dashed border-primary/25 bg-[linear-gradient(135deg,rgba(20,184,166,0.06),rgba(59,130,246,0.06))] p-6 text-center transition-all hover:border-primary/50 hover:shadow-[0_14px_30px_rgba(34,197,194,0.10)] sm:p-8"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleImageUpload(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-primary/10">
                  <ImagePlus className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Tap to upload item photos</p>
                <p className="mt-1 text-xs text-muted-foreground">JPG or PNG, up to 5MB each. Photos are optimized automatically.</p>
              </div>

              {processingImages > 0 && (
                <p className="text-xs text-muted-foreground">
                  Processing {processingImages} image{processingImages !== 1 ? "s" : ""}...
                </p>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {images.map((img, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted/40">
                      <img src={img} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                      {i === 0 && (
                        <div className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm">
                          Cover
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <Label htmlFor="title" className="text-base font-semibold">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Arduino Uno R3 with USB Cable"
                className="h-12 rounded-2xl border-border/80 bg-background"
              />
              <p className="text-xs leading-5 text-muted-foreground">Include brand + model + key details</p>
            </section>

            <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <Label htmlFor="description" className="text-base font-semibold">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product details and reason for selling..."
                rows={5}
                className="rounded-2xl border-border/80 bg-background"
              />
              <p className="text-xs leading-5 text-muted-foreground">Share product details and why you are selling it.</p>
            </section>

            <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <div>
                <Label className="text-base font-semibold">Category</Label>
                <p className="mt-1 text-xs text-muted-foreground">Choose the best fit so buyers find it quickly</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categoryOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = category === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCategory(option.value)}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-[0_12px_30px_rgba(34,197,194,0.10)]"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "gradient-bg text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <div>
                <Label className="text-base font-semibold">Condition</Label>
                <p className="mt-1 text-xs text-muted-foreground">Choose honestly to build trust</p>
              </div>
              <div className="grid gap-2">
                {conditionOptions.map((option) => {
                  const selected = condition === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCondition(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-[0_12px_30px_rgba(34,197,194,0.08)]"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground">{option.title}</p>
                      <p className="text-xs text-muted-foreground">{option.note}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base font-semibold">Price</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="500"
                    className="h-12 rounded-2xl border-border/80 bg-background pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Set a fair price for faster sale</p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 md:min-w-[220px]">
                <div>
                  <p className="text-sm font-medium text-foreground">Negotiable</p>
                  <p className="text-xs text-muted-foreground">Buyers can discuss price</p>
                </div>
                <Switch checked={negotiable} onCheckedChange={setNegotiable} />
              </div>
            </section>

            <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <Label htmlFor="locationHint" className="text-base font-semibold">Location (Hostel / Department)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="locationHint"
                  value={locationHint}
                  onChange={(e) => setLocationHint(e.target.value)}
                  placeholder="e.g. Hostel B, ECE Department"
                  className="h-12 rounded-2xl border-border/80 bg-background pl-9"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Preview</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
                  {images[0] ? (
                    <img src={images[0]} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {category && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">{category}</span>}
                    {condition && <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">{condition}</span>}
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">{title || "Your item title will appear here"}</p>
                  <p className="mt-1 text-sm font-bold gradient-text">
                    {price ? `₹${price}${negotiable ? " • Negotiable" : ""}` : "Add a price"}
                  </p>
                  {locationHint && <p className="mt-1 text-xs text-muted-foreground">{locationHint}</p>}
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Only visible to students in your college
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-sm">
              Buyers will contact you directly
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting || processingImages > 0}
              className="h-12 w-full rounded-2xl border-0 bg-[linear-gradient(135deg,rgb(20,184,166),rgb(59,130,246))] text-base font-semibold text-primary-foreground shadow-[0_16px_40px_rgba(34,197,194,0.22)] hover:opacity-90"
            >
              {processingImages > 0 ? "Preparing Images..." : submitting ? "Posting..." : "Post Item 🚀"}
            </Button>
          </form>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default SellPage;

