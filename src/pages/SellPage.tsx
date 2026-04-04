import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Category, Condition } from "@/lib/types";
import { canonicalInstitutionName } from "@/lib/institutions";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Cpu,
  FileText,
  ImagePlus,  MoreHorizontal,
  Rocket,
  PenTool,
  Smartphone,
  Sparkles,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_IMAGE_BYTES = 600 * 1024;
const MAX_IMAGE_DIMENSION = 1280;
const MAX_LISTING_PRICE = 10000;

function hasValidWhatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length >= 10;
}

const categoryOptions: { value: Category; label: string; icon: typeof Cpu }[] = [
  { value: "Hand Writing Service", label: "Hand Writing Service", icon: PenTool },
  { value: "Components", label: "Components", icon: Cpu },
  { value: "Gadgets", label: "Gadgets", icon: Smartphone },
  { value: "Books", label: "Books", icon: BookOpen },
  { value: "Notes & Question Papers", label: "Notes & Question Papers", icon: FileText },
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
  const [images, setImages] = useState<string[]>([]);  const [submitting, setSubmitting] = useState(false);
  const [processingImages, setProcessingImages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasValidSellerPhone = hasValidWhatsappNumber(user?.phone || "");
  const postingCollege = canonicalInstitutionName(user?.college || "");

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
    if (Number(price) > MAX_LISTING_PRICE) {
      toast.error("CampusKart currently supports listings up to ₹10,000. Please post items within this range.");
      return;
    }
    if (!hasValidSellerPhone) {
      toast.error("Add a valid WhatsApp number in Edit Profile before posting an item.");
      navigate("/dashboard");
      return;
    }
    if (!postingCollege) {
      toast.error("Add your college in Edit Profile before posting an item.");
      navigate("/dashboard");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("listings").insert({
        title,
        description: description.trim(),
        price: Number(price),
        category,
        condition,
        images,
        seller_id: supabaseUser.id,
        college: postingCollege,
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

          {!hasValidSellerPhone && (
            <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 shadow-sm">
              Add a valid WhatsApp number in your dashboard profile before posting. Buyers contact sellers directly through WhatsApp.
            </div>
          )}

          <div className="mb-5 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-foreground shadow-sm">
            This item will be listed only in: <span className="font-semibold">{postingCollege || "Add your college in profile"}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-primary/10 bg-background/95 p-4 shadow-[0_20px_60px_rgba(15,118,110,0.10)] backdrop-blur-sm sm:p-6">
            <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <div>
                <Label className="text-base font-semibold">Category</Label>
                <p className="mt-1 text-xs text-muted-foreground">Choose a category first so buyers find it faster</p>
              </div>

              <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                <SelectTrigger className="h-12 rounded-2xl border-border/80 bg-background px-4">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {categoryOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value} className="rounded-xl py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </section>

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
                <Label className="text-base font-semibold">Condition</Label>
                <p className="mt-1 text-xs text-muted-foreground">Choose honestly to build trust</p>
              </div>
              <Select value={condition} onValueChange={(value) => setCondition(value as Condition)}>
                <SelectTrigger className="h-12 rounded-2xl border-border/80 bg-background px-4">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {conditionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="rounded-xl py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{option.title}</span>
                        <span className="text-xs text-muted-foreground">{option.note}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

                        <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <Label htmlFor="price" className="text-base font-semibold">Price</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  max={MAX_LISTING_PRICE}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500"
                  className="h-12 rounded-2xl border-border/80 bg-background pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">Set a fair price for faster sale. Items above ₹10,000 are not allowed on CampusKart.</p>
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
                    {price ? `₹${price}` : "Add a price"}
                  </p>                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Only visible to students in your college
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-sm">
              Buyers will contact you directly through WhatsApp
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting || processingImages > 0 || !hasValidSellerPhone}
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


