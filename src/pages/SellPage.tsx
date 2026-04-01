import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CONDITIONS, Category, Condition } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";

const MAX_IMAGE_BYTES = 600 * 1024;
const MAX_IMAGE_DIMENSION = 1280;

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
      } catch (error) {
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
          <p className="text-muted-foreground text-lg">Please sign in to list an item.</p>
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
      const { error } = await supabase.from("listings").insert({
        title,
        description,
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="animate-fade-in">
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">Sell a Component</h1>
          <p className="text-muted-foreground mb-8">List your unused components for other students on campus.</p>

          <form onSubmit={handleSubmit} className="space-y-6 glass rounded-xl p-6">
            <div>
              <Label>Photos (up to 5)</Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer mt-2"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(e.dataTransfer.files); }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop images or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB each, optimized automatically</p>
              </div>
              {processingImages > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Processing {processingImages} image{processingImages !== 1 ? "s" : ""}...
                </p>
              )}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                      <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Arduino Uno R3" />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the component, its condition, what's included..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" />
            </div>

            <Button type="submit" size="lg" disabled={submitting || processingImages > 0} className="w-full gradient-bg text-primary-foreground border-0 hover:opacity-90">
              {processingImages > 0 ? "Preparing Images..." : submitting ? "Publishing..." : "Publish Listing"}
            </Button>
          </form>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default SellPage;
