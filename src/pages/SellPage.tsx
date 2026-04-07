import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Category, Condition } from "@/lib/types";
import { canonicalInstitutionName } from "@/lib/institutions";
import { CATEGORY_RULES, countWords, hasYearSubjectBranch, isGoogleDriveLink, normalizeListingTitle } from "@/lib/listingRules";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Cpu,
  ExternalLink,
  FileQuestion,
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
const MAX_FILES = 5;
const MAX_DAILY_UPLOADS = 7;
const UPLOAD_COOLDOWN_MS = 30 * 1000;
const HANDWRITING_TITLE_EMOJI = "✍️";
const MAX_TITLE_LENGTH = 52;

function hasValidWhatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length >= 10;
}

function getMissingColumnName(message: string) {
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
}

function isSchemaCacheColumnError(message: string) {
  return /Could not find the '.*' column of 'listings' in the schema cache/i.test(message);
}

const categoryOptions: { value: Category; label: string; icon: typeof Cpu }[] = [
  { value: "Handwriting Service", label: "Handwriting Service", icon: PenTool },
  { value: "Notes", label: "Notes", icon: FileText },
  { value: "Question Papers", label: "Question Papers", icon: FileQuestion },
  { value: "Components", label: "Components", icon: Cpu },
  { value: "Gadgets", label: "Gadgets", icon: Smartphone },
  { value: "Books", label: "Books", icon: BookOpen },
  { value: "Tools", label: "Tools", icon: Wrench },
  { value: "Projects", label: "Projects", icon: Rocket },
  { value: "Others", label: "Others", icon: MoreHorizontal },
];

const conditionLabelMap: Record<Condition, string> = {
  New: "New",
  "Like New": "Like New",
  Fair: "Fair",
  Used: "Used",
};

const conditionNoteMap: Record<Condition, string> = {
  New: "Never used",
  "Like New": "Used once or twice",
  Fair: "Clearly used but still usable",
  Used: "Regular use",
};

const categoryContentMap: Partial<Record<Category, {
  titlePlaceholder: string;
  titleHint: string;
  descriptionPlaceholder: string;
  descriptionHint: string;
  pricePlaceholder: string;
  priceHint: string;
}>> = {
  "Handwriting Service": {
    titlePlaceholder: "e.g. Handwritten assignments, files, and notes service",
    titleHint: "Make it clear that you can write assignments, files, records, or notes neatly on request.",
    descriptionPlaceholder: "Explain the kind of files, notes, assignments, or record work you can complete, your handwriting quality, turnaround time, language, and how you charge according to the work...",
    descriptionHint: "Minimum 10 words. Tell buyers what work you can do and how the service will be handled.",
    pricePlaceholder: "15",
    priceHint: "Max ₹20 per page. Keep the rate student-friendly and clear.",
  },
  Notes: {
    titlePlaceholder: "e.g. DBMS Semester 4 Notes PDF",
    titleHint: "Include subject, semester, branch, and format in the title.",
    descriptionPlaceholder: "Mention subject, semester, branch, year, topics covered, file format, and what will be shared after payment...",
    descriptionHint: "Minimum 10 words. Include year, subject, and branch info clearly.",
    pricePlaceholder: "49",
    priceHint: "Max ₹100 for digital notes.",
  },
  "Question Papers": {
    titlePlaceholder: "e.g. 2023-2024 OOP Question Papers",
    titleHint: "Mention year, subject, and exam type clearly.",
    descriptionPlaceholder: "Mention subject, branch, semester, year, exam type, and how many papers are included in the drive folder...",
    descriptionHint: "Minimum 10 words. Include year, subject, and branch info clearly.",
    pricePlaceholder: "39",
    priceHint: "Max ₹100 for question papers.",
  },
  Components: {
    titlePlaceholder: "e.g. Arduino Uno with jumper wires",
    titleHint: "Include the exact component name and key included accessories.",
    descriptionPlaceholder: "Mention working condition, brand, quantity, included wires/modules, usage history, and reason for selling...",
    descriptionHint: "Minimum 10 words. Explain the exact component condition and what is included.",
    pricePlaceholder: "450",
    priceHint: "Max ₹5000 for components.",
  },
  Gadgets: {
    titlePlaceholder: "e.g. Casio scientific calculator fx-991ES",
    titleHint: "Include the gadget brand, model, and important included accessories.",
    descriptionPlaceholder: "Mention brand, model, condition, battery or charger details, usage history, and reason for selling...",
    descriptionHint: "Minimum 10 words. Explain the gadget condition and accessories clearly.",
    pricePlaceholder: "1200",
    priceHint: "Max ₹5000 for gadgets.",
  },
  Tools: {
    titlePlaceholder: "e.g. Soldering iron kit with stand",
    titleHint: "Include the tool name and any kit parts included with it.",
    descriptionPlaceholder: "Mention tool condition, brand, included bits or stand, how often it was used, and reason for selling...",
    descriptionHint: "Minimum 10 words. Help buyers understand the working condition and kit contents.",
    pricePlaceholder: "850",
    priceHint: "Max ₹5000 for tools.",
  },
  Books: {
    titlePlaceholder: "e.g. Engineering Mathematics textbook by B.S. Grewal",
    titleHint: "Mention the book title, author, and edition if possible.",
    descriptionPlaceholder: "Mention author, edition, semester relevance, page condition, highlighting or notes, and reason for selling...",
    descriptionHint: "Minimum 10 words. Explain the book condition and academic relevance clearly.",
    pricePlaceholder: "250",
    priceHint: "Max ₹500 for books.",
  },
  Projects: {
    titlePlaceholder: "e.g. Line follower robot project kit",
    titleHint: "Include the project name and what stage it is in.",
    descriptionPlaceholder: "Mention project type, components included, working status, documentation availability, and why you are selling it...",
    descriptionHint: "Minimum 10 words. Explain what the buyer gets and the current project status.",
    pricePlaceholder: "2500",
    priceHint: "Max ₹5000 for projects.",
  },
  Others: {
    titlePlaceholder: "e.g. Lab coat and drawing sheet set",
    titleHint: "Use a title that clearly tells buyers what the item is.",
    descriptionPlaceholder: "Describe the item clearly, mention condition, quantity, what is included, and why you are selling it...",
    descriptionHint: "Minimum 10 words. Help buyers quickly understand the item and condition.",
    pricePlaceholder: "300",
    priceHint: "Max ₹5000 for this category.",
  },
};

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
  const sourceSize = Math.min(image.width, image.height);
  const cropX = Math.max(0, Math.floor((image.width - sourceSize) / 2));
  const cropY = Math.max(0, Math.floor((image.height - sourceSize) / 2));
  const outputSize = Math.max(1, Math.round(Math.min(sourceSize, MAX_IMAGE_DIMENSION)));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) return originalDataUrl;

  context.drawImage(
    image,
    cropX,
    cropY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize
  );

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
  const [resourceLink, setResourceLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [processingImages, setProcessingImages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastAutoTitleRef = useRef("");
  const hasValidSellerPhone = hasValidWhatsappNumber(user?.phone || "");
  const postingCollege = canonicalInstitutionName(user?.college || "");
  const selectedRule = category ? CATEGORY_RULES[category] : null;
  const descriptionWordCount = countWords(description);
  const trimmedTitle = title.trim();
  const normalizedTitle = normalizeListingTitle(trimmedTitle);
  const parsedPrice = Number(price || 0);
  const isDigitalCategory = category === "Notes" || category === "Question Papers";
  const canUploadImages = !!selectedRule && !isDigitalCategory;
  const conditionOptions = selectedRule?.allowsConditionOptions ?? [];
  const categoryContent = category ? categoryContentMap[category] : null;
  const formLocked = !category;
  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "Student";
  const handwritingDefaultTitle = `${HANDWRITING_TITLE_EMOJI} Handwriting Service by ${firstName}`.slice(0, MAX_TITLE_LENGTH);

  const handleCategoryChange = (value: Category) => {
    const nextCategory = value as Category;
    setCategory(nextCategory);
    setTitle("");
    setDescription("");
    setPrice("");
    setCondition("");
    setImages([]);
    setResourceLink("");
    lastAutoTitleRef.current = "";
  };

  useEffect(() => {
    if (!selectedRule?.requiresCondition) {
      setCondition("");
      return;
    }
    if (condition && !selectedRule.allowsConditionOptions.includes(condition)) {
      setCondition("");
    }
  }, [condition, selectedRule]);

  useEffect(() => {
    if (isDigitalCategory) {
      setImages([]);
    }
  }, [isDigitalCategory]);

  useEffect(() => {
    if (category !== "Handwriting Service") return;

    const currentTitle = title.trim();
    const canAutofill = !currentTitle || currentTitle === lastAutoTitleRef.current;
    if (!canAutofill) return;

    setTitle(handwritingDefaultTitle);
    lastAutoTitleRef.current = handwritingDefaultTitle;
  }, [category, handwritingDefaultTitle, title]);

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (!category) {
      messages.push("Select a category first.");
      return messages;
    }

    if (trimmedTitle.length < 5) messages.push("Title must be at least 5 characters.");
    if (title.length > MAX_TITLE_LENGTH) messages.push(`Title cannot exceed ${MAX_TITLE_LENGTH} characters.`);
    if (descriptionWordCount < 10) messages.push("Description must be at least 10 words.");
    if (!price || parsedPrice <= 0) messages.push("Enter a valid price.");
    if (selectedRule && parsedPrice > selectedRule.maxPrice) messages.push(`Max allowed is ₹${selectedRule.maxPrice}.`);
    if (selectedRule?.requiresCondition && !condition) messages.push("Select a condition.");
    if (selectedRule?.requiresImages && images.length < selectedRule.imageMinimum) messages.push(selectedRule.imageHint);
    if (selectedRule?.requiresDriveLink && !resourceLink.trim()) messages.push("Add a Google Drive link.");
    if (selectedRule?.requiresDriveLink && resourceLink.trim() && !isGoogleDriveLink(resourceLink.trim())) messages.push("Use a valid Google Drive link.");
    if (selectedRule?.requiresYearSubjectBranch && !hasYearSubjectBranch(description)) messages.push("Include year, subject, and branch info.");

    return messages;
  }, [category, condition, description, descriptionWordCount, images.length, parsedPrice, price, resourceLink, selectedRule, trimmedTitle]);

  const handleImageUpload = async (incomingFiles: File[] | FileList | null) => {
    if (!incomingFiles) return;
    if (!selectedRule) {
      toast.error("Select a category first.");
      return;
    }
    if (!canUploadImages) {
      toast.error("This category uses a Google Drive link instead of images.");
      return;
    }
    const files = Array.from(incomingFiles);
    if (files.length === 0) return;
    if (images.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} images allowed`);
      return;
    }

    setProcessingImages((count) => count + files.length);
    for (const file of files) {
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

  useEffect(() => {
    if (!canUploadImages || formLocked) return;

    const handlePaste = (event: ClipboardEvent) => {
      const clipboardFiles = Array.from(event.clipboardData?.items || [])
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter((file): file is File => !!file && file.type.startsWith("image/"));

      if (clipboardFiles.length === 0) return;
      event.preventDefault();
      void handleImageUpload(clipboardFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [canUploadImages, formLocked, images.length, selectedRule]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getFriendlyListingError = (errorMessage: string, missingColumn?: string | null) => {
    if (missingColumn === "ai_verification_status" || missingColumn === "moderation_status" || missingColumn === "report_count") {
      return "The item could not be posted because marketplace moderation setup is not finished in the database yet. Please ask the admin to complete the latest database update and try again.";
    }
    if (missingColumn === "resource_link") {
      return "This item category needs the latest database setup before it can be posted. Please ask the admin to complete the update and try again.";
    }
    if (/duplicate key value/i.test(errorMessage)) {
      return "You already have a similar listing saved. Change the title slightly and try again.";
    }
    if (/row-level security/i.test(errorMessage)) {
      return "You do not have permission to post this item right now. Please sign in again and try once more.";
    }
    if (/invalid input syntax/i.test(errorMessage)) {
      return "Some listing details are not in the expected format. Please review the form and try again.";
    }
    return errorMessage || "The item could not be listed right now. Please review the form and try again.";
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

  const runCommonChecks = async () => {
    if (!supabaseUser?.id) {
      throw new Error("Your session is not ready. Please sign out and sign back in.");
    }
    if (!hasValidSellerPhone) {
      navigate("/dashboard");
      throw new Error("Add a valid WhatsApp number in Edit Profile before posting an item.");
    }
    if (!postingCollege) {
      navigate("/dashboard");
      throw new Error("Add your college in Edit Profile before posting an item.");
    }
    if (!category || !selectedRule) {
      throw new Error("Please select a category.");
    }
    if (trimmedTitle.length < 5) throw new Error("Title must be at least 5 characters.");
    if (title.length > MAX_TITLE_LENGTH) throw new Error(`Title cannot exceed ${MAX_TITLE_LENGTH} characters including spaces.`);
    if (descriptionWordCount < 10) throw new Error("Description must be at least 10 words.");
    if (!price || parsedPrice <= 0) throw new Error("Please enter a valid price.");
    if (parsedPrice > selectedRule.maxPrice) throw new Error(`This category allows listings only up to ₹${selectedRule.maxPrice}.`);
    if (selectedRule.requiresCondition && !condition) throw new Error("Select the condition before posting.");
    if (selectedRule.requiresImages && images.length < selectedRule.imageMinimum) throw new Error(selectedRule.imageHint);
    if (selectedRule.requiresDriveLink) {
      if (!resourceLink.trim()) throw new Error("Add a Google Drive link.");
      if (!isGoogleDriveLink(resourceLink.trim())) throw new Error("Use a valid Google Drive link.");
    }
    if (selectedRule.requiresYearSubjectBranch && !hasYearSubjectBranch(description)) {
      throw new Error("Description must include year, subject, and branch info.");
    }

    const { data: sellerListings, error: sellerListingsError } = await supabase
      .from("listings")
      .select("title, created_at")
      .eq("seller_id", supabaseUser.id)
      .order("created_at", { ascending: false });

    if (sellerListingsError) {
      throw new Error("Could not validate your upload limits right now.");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayListings = (sellerListings || []).filter((listing) => new Date(listing.created_at).getTime() >= startOfDay.getTime());
    if (todayListings.length >= MAX_DAILY_UPLOADS) {
      throw new Error(`You can post up to ${MAX_DAILY_UPLOADS} items per day.`);
    }

    const latestListing = sellerListings?.[0];
    if (latestListing && Date.now() - new Date(latestListing.created_at).getTime() < UPLOAD_COOLDOWN_MS) {
      throw new Error("Please wait 30 seconds before posting another item.");
    }

    const duplicateListing = sellerListings?.find((listing) => normalizeListingTitle(listing.title) === normalizedTitle);
    if (duplicateListing) {
      throw new Error("You already posted an item with the same title.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processingImages > 0) {
      toast.error("Please wait for image processing to finish.");
      return;
    }

    setSubmitting(true);
    try {
      await runCommonChecks();

      let aiVerificationStatus = "manual_review";
      let moderationStatus = "pending_review";

      const listingPayload = {
        title: trimmedTitle,
        description: description.trim(),
        price: parsedPrice,
        category,
        condition: selectedRule?.requiresCondition ? condition : "",
        images: canUploadImages ? images : [],
        seller_id: supabaseUser.id,
        college: postingCollege,
        sold: false,
        likes: 0,
        resource_link: resourceLink.trim() || null,
        moderation_status: moderationStatus,
        report_count: 0,
        ai_verification_status: aiVerificationStatus,
      };

      const legacyPayload = {
        title: trimmedTitle,
        description: description.trim(),
        price: parsedPrice,
        category,
        condition: selectedRule?.requiresCondition ? condition : "",
        images: canUploadImages ? images : [],
        seller_id: supabaseUser.id,
        college: postingCollege,
        sold: false,
        likes: 0,
      };

      let insertError: Error | null = null;
      let usedLegacyFallback = false;

      const { error } = await supabase.from("listings").insert(listingPayload);
      if (error) {
        const missingColumn = getMissingColumnName(error.message || "");
        const canFallbackToLegacy = isSchemaCacheColumnError(error.message || "") && missingColumn !== "resource_link";

        if (canFallbackToLegacy) {
          const legacyInsert = await supabase.from("listings").insert(legacyPayload);
          if (legacyInsert.error) {
            insertError = legacyInsert.error;
          } else {
            usedLegacyFallback = true;
          }
        } else {
          insertError = error;
        }
      }

      if (insertError) {
        const missingColumn = getMissingColumnName(insertError.message || "");
        throw new Error(getFriendlyListingError(insertError.message || "", missingColumn));
      }

      toast.success(
        usedLegacyFallback
          ? "Sent for manual review. It will go live after approval, usually within 12 hours."
          : "Sent for manual review. It will go live after approval, usually within 12 hours."
      );
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "The item could not be listed right now. Please review the form and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(240,253,250,0.9),rgba(255,255,255,1))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.98))]">
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
            <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
              Add a valid WhatsApp number in your dashboard profile before posting. Buyers contact sellers directly through WhatsApp.
            </div>
          )}

          <div className="mb-5 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-foreground shadow-sm dark:border-primary/20 dark:bg-primary/10 dark:text-slate-100">
            This item will be listed only in: <span className="font-semibold">{postingCollege || "Add your college in profile"}</span>
          </div>

          <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
            Put details correctly. Every listing goes under manual verification. If you post unwanted or misleading content, your account may be banned.
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-primary/10 bg-background/95 p-4 shadow-[0_20px_60px_rgba(15,118,110,0.10)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/92 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)] sm:p-6">
            <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <div>
                <Label className="text-base font-semibold">Category</Label>
                <p className="mt-1 text-xs text-muted-foreground">Select a category first. The form updates instantly.</p>
              </div>

              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-12 rounded-2xl border-border/80 bg-background px-4 dark:border-white/10 dark:bg-slate-950">
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

              {selectedRule && (
                <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground dark:border-primary/20 dark:bg-primary/10 dark:text-slate-300">
                  {selectedRule.helper}
                </div>
              )}
            </section>

            {selectedRule?.requiresDriveLink && (
              <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
                <Label htmlFor="resourceLink" className="text-base font-semibold">Google Drive link</Label>
                <div className="relative">
                  <ExternalLink className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="resourceLink"
                    value={resourceLink}
                    onChange={(e) => setResourceLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="h-12 rounded-2xl border-border/80 bg-background pl-10 dark:border-white/10 dark:bg-slate-950"
                    disabled={formLocked}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Upload Google Drive link. Seller must grant access after payment.</p>
              </section>
            )}

            {category === "Projects" && (
              <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
                <Label htmlFor="resourceLink" className="text-base font-semibold">Optional demo / drive link</Label>
                <Input
                  id="resourceLink"
                  value={resourceLink}
                  onChange={(e) => setResourceLink(e.target.value)}
                  placeholder="Optional demo, video, or drive link"
                  className="h-12 rounded-2xl border-border/80 bg-background dark:border-white/10 dark:bg-slate-950"
                  disabled={formLocked}
                />
                <p className="text-xs text-muted-foreground">Images or demo links are optional but recommended for projects.</p>
              </section>
            )}

            {canUploadImages && (
            <section className={`space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 ${formLocked ? "pointer-events-none opacity-60" : ""}`}>
              <div>
                <Label className="text-base font-semibold text-foreground">{selectedRule?.imageLabel || "Upload images"}</Label>
                <p className="mt-1 text-sm text-muted-foreground">{selectedRule?.imageHint || "Upload at least one image if required"}</p>
                <p className="mt-1 text-xs font-medium text-primary">
                  {category === "Handwriting Service"
                    ? "Max ₹20 per page"
                    : selectedRule
                      ? `Max ₹${selectedRule.maxPrice} for this category`
                      : ""}
                </p>
              </div>

              <div
                className="cursor-pointer rounded-3xl border-2 border-dashed border-primary/25 bg-[linear-gradient(135deg,rgba(20,184,166,0.06),rgba(59,130,246,0.06))] p-6 text-center transition-all hover:border-primary/50 hover:shadow-[0_14px_30px_rgba(34,197,194,0.10)] dark:border-primary/20 dark:bg-[linear-gradient(135deg,rgba(20,184,166,0.08),rgba(15,23,42,0.96),rgba(59,130,246,0.08))] dark:hover:shadow-[0_14px_30px_rgba(2,6,23,0.3)] sm:p-8"
                onClick={() => fileInputRef.current?.click()}
                onPaste={(e) => {
                  const clipboardFiles = Array.from(e.clipboardData?.items || [])
                    .filter((item) => item.kind === "file")
                    .map((item) => item.getAsFile())
                    .filter((file): file is File => !!file && file.type.startsWith("image/"));
                  if (clipboardFiles.length === 0) return;
                  e.preventDefault();
                  void handleImageUpload(clipboardFiles);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleImageUpload(e.dataTransfer.files);
                }}
                tabIndex={0}
                role="button"
                aria-label="Upload listing images by click, drag and drop, or paste"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-primary/10 dark:bg-slate-950 dark:ring-white/10">
                  <ImagePlus className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {category === "Handwriting Service" ? "Tap to upload handwriting samples" : "Tap to upload item photos"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">JPG or PNG, up to 5MB each. Photos are optimized automatically.</p>
                <p className="mt-1 text-xs text-muted-foreground">Non-square photos are automatically center-cropped to a 1:1 square for cleaner listings.</p>
              </div>

              {processingImages > 0 && (
                <p className="text-xs text-muted-foreground">
                  Processing {processingImages} image{processingImages !== 1 ? "s" : ""}...
                </p>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {images.map((img, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted/40 dark:border-white/10 dark:bg-slate-950/70">
                      <img src={img} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                      {i === 0 && (
                          <div className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm dark:bg-slate-950/90">
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
            )}

            <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <Label htmlFor="title" className="text-base font-semibold">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder={categoryContent?.titlePlaceholder || "Select a category to see a better title example"}
                className="h-12 rounded-2xl border-border/80 bg-background dark:border-white/10 dark:bg-slate-950"
                maxLength={MAX_TITLE_LENGTH}
                disabled={formLocked}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {categoryContent?.titleHint || "Minimum 5 characters. Keep it clear and specific."} Max {MAX_TITLE_LENGTH} characters.
              </p>
            </section>

            <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <Label htmlFor="description" className="text-base font-semibold">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={categoryContent?.descriptionPlaceholder || "Select a category to see the right description format"}
                rows={5}
                className="rounded-2xl border-border/80 bg-background dark:border-white/10 dark:bg-slate-950"
                disabled={formLocked}
              />
              <p className="text-xs leading-5 text-muted-foreground">{categoryContent?.descriptionHint || "Minimum 10 words. Explain the item or service clearly."}</p>
            </section>

            {selectedRule?.requiresCondition && (
            <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <div>
                <Label className="text-base font-semibold">Condition</Label>
                <p className="mt-1 text-xs text-muted-foreground">Choose honestly to build trust</p>
              </div>
              <Select value={condition} onValueChange={(value) => setCondition(value as Condition)} disabled={formLocked}>
                <SelectTrigger className="h-12 rounded-2xl border-border/80 bg-background px-4 dark:border-white/10 dark:bg-slate-950">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {conditionOptions.map((option) => (
                    <SelectItem key={option} value={option} className="rounded-xl py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{conditionLabelMap[option]}</span>
                        <span className="text-xs text-muted-foreground">{conditionNoteMap[option]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
            )}

            <section className="space-y-2 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <Label htmlFor="price" className="text-base font-semibold">
                {category === "Handwriting Service" ? "Price per page" : "Price"}
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  max={selectedRule?.maxPrice || 5000}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={categoryContent?.pricePlaceholder || "Enter price"}
                  className="h-12 rounded-2xl border-border/80 bg-background pl-9 dark:border-white/10 dark:bg-slate-950"
                  disabled={formLocked}
                />
              </div>
              <p className="text-xs text-muted-foreground">{categoryContent?.priceHint || (selectedRule ? `Max ₹${selectedRule.maxPrice} for this category.` : "Choose a category to see the price rule.")}</p>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Live validation</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {validationMessages.length === 0 ? (
                  <Badge className="gradient-bg border-0 text-primary-foreground">Ready to post</Badge>
                ) : (
                  validationMessages.map((message) => (
                    <Badge key={message} variant="secondary" className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                      {message}
                    </Badge>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Preview</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted dark:bg-slate-950/80">
                  {images[0] ? (
                    <img src={images[0]} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {category && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">{category}</span>}
                      {condition && <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground dark:border-white/10 dark:bg-slate-950/70">{condition}</span>}
                    {selectedRule?.requiresDriveLink && resourceLink && (
                      <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground dark:border-white/10 dark:bg-slate-950/70">Drive link attached</span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">{title || "Your item title will appear here"}</p>
                  <p className="mt-1 text-sm font-bold gradient-text">
                    {price ? `₹${price}` : "Add a price"}
                  </p>                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground dark:border-primary/20 dark:bg-primary/10 dark:text-slate-300">
              Only visible to students in your college
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300">
              Buyers will contact you directly through WhatsApp
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={formLocked || submitting || processingImages > 0 || !hasValidSellerPhone}
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


