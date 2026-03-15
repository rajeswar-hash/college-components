import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { addListing } from "@/lib/store";
import { CATEGORIES, CONDITIONS, Category, Condition, Listing } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";

const SellPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    if (images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || !category || !condition) {
      toast.error("Please fill in all fields");
      return;
    }

    const listing: Listing = {
      id: "listing-" + Date.now(),
      title,
      description,
      price: Number(price),
      category: category as Category,
      condition: condition as Condition,
      images: [],
      sellerId: user!.id,
      sellerName: user!.name,
      sellerPhone: user!.phone,
      college: user!.college,
      createdAt: new Date().toISOString(),
      sold: false,
      likes: 0,
    };

    addListing(listing);
    toast.success("Listing created successfully!");
    navigate("/dashboard");
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
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop images or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">(Image upload is simulated in this mockup)</p>
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

            <Button type="submit" size="lg" className="w-full gradient-bg text-primary-foreground border-0 hover:opacity-90">
              Publish Listing
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellPage;
