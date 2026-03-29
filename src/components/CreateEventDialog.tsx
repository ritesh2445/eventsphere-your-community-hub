import { useState, useRef } from "react";
import { Plus, Calendar as CalendarIcon, MapPin, Users, Tag, Image as ImageIcon, Loader2, X, Upload, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { saveEvent, uploadImage } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TimePicker } from "@/components/TimePicker";

interface LocalImage {
  file: File;
  preview: string;
}

export interface RegFieldConfig {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "select" | "checkbox";
  required: boolean;
  placeholder: string;
  options?: string[]; // For select type
}

const DEFAULT_REG_FIELDS: RegFieldConfig[] = [
  { id: "fullName", label: "Full Name", type: "text", required: true, placeholder: "e.g. John Doe" },
  { id: "email", label: "Email", type: "email", required: true, placeholder: "e.g. john@example.com" },
  { id: "phone", label: "Phone", type: "tel", required: false, placeholder: "e.g. +91 9876543210" },
];

interface CreateEventDialogProps {
  onEventCreated: () => void;
}

const PRESET_CATEGORIES = ["Technology", "Business", "Design", "Marketing", "Social"];

export const CreateEventDialog = ({ onEventCreated }: CreateEventDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [regFields, setRegFields] = useState<RegFieldConfig[]>([...DEFAULT_REG_FIELDS]);
  const [activeSection, setActiveSection] = useState<"details" | "registration">("details");

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: 100,
    category: "Technology",
    description: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImages: LocalImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) { toast({ title: "Invalid file", description: `${file.name} is not an image.`, variant: "destructive" }); continue; }
      if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: `${file.name} exceeds 5MB.`, variant: "destructive" }); continue; }
      newImages.push({ file, preview: URL.createObjectURL(file) });
    }
    setLocalImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setLocalImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      const filtered = prev.filter((_, i) => i !== index);
      if (index === coverIndex) setCoverIndex(0);
      else if (index < coverIndex) setCoverIndex(coverIndex - 1);
      return filtered;
    });
  };

  const setAsCover = (index: number) => {
    setCoverIndex(index);
    toast({ title: "Cover Updated", description: "This image will be used as the main event photo." });
  };

  const handleCategoryChange = (value: string) => {
    if (value === "__custom__") { setIsCustomCategory(true); setFormData({ ...formData, category: "" }); }
    else { setIsCustomCategory(false); setFormData({ ...formData, category: value }); }
  };

  // Registration field management
  const addRegField = () => {
    setRegFields(prev => [...prev, {
      id: `field_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
      placeholder: "",
    }]);
  };

  const updateRegField = (index: number, updates: Partial<RegFieldConfig>) => {
    setRegFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeRegField = (index: number) => {
    setRegFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.date) { toast({ title: "Date required", description: "Please select a date.", variant: "destructive" }); return; }
    if (!formData.startTime || !formData.endTime) { toast({ title: "Timing required", description: "Please set start and end times.", variant: "destructive" }); return; }
    if (!formData.category.trim()) { toast({ title: "Category required", description: "Please select or enter a category.", variant: "destructive" }); return; }
    if (localImages.length === 0) { toast({ title: "Image required", description: "Please add at least one cover image.", variant: "destructive" }); return; }

    // Validate reg fields
    const validFields = regFields.filter(f => f.label.trim());
    if (validFields.length === 0) { toast({ title: "Registration fields needed", description: "Add at least one registration field.", variant: "destructive" }); return; }

    setLoading(true);
    try {
      // Upload all images
      const uploadedUrls: string[] = [];
      for (const img of localImages) {
        const { url, error } = await uploadImage(img.file);
        if (url) uploadedUrls.push(url);
        else { toast({ title: "Upload Failed", description: `${img.file.name}: ${error}`, variant: "destructive" }); setLoading(false); return; }
      }

      // Reorder so cover is first
      const reordered = [uploadedUrls[coverIndex], ...uploadedUrls.filter((_, i) => i !== coverIndex)];

      // Embed metadata in description
      const meta = {
        timing: { start: formData.startTime, end: formData.endTime },
        endDate: formData.endDate || undefined,
        regFields: validFields,
      };
      const descWithMeta = `${formData.description}\n<!--EVENTSPHERE_META:${JSON.stringify(meta)}-->`;

      await saveEvent({
        ...formData,
        description: descWithMeta,
        image: reordered[0],
        images: reordered,
        capacity: Number(formData.capacity),
      }, user.id);

      toast({ title: "Event Submitted!", description: "Your event is now pending admin approval." });
      setOpen(false);
      onEventCreated();
      localImages.forEach(img => URL.revokeObjectURL(img.preview));
      setLocalImages([]);
      setCoverIndex(0);
      setIsCustomCategory(false);
      setRegFields([...DEFAULT_REG_FIELDS]);
      setActiveSection("details");
      setFormData({ title: "", date: "", endDate: "", startTime: "", endTime: "", location: "", capacity: 100, category: "Technology", description: "" });
    } catch (error: any) {
      console.error("Event creation failed:", error);
      toast({ title: "Error Creating Event", description: error?.message || "Failed to create event.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="active-press gap-2 h-9"><Plus className="h-4 w-4" /> Create Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        {/* Section Tabs */}
        <div className="flex gap-1 border-b border-border pb-1 pt-2">
          <button type="button" onClick={() => setActiveSection("details")} className={cn("px-4 py-2 text-xs font-semibold rounded-t-md transition-colors",
            activeSection === "details" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}>Event Details</button>
          <button type="button" onClick={() => setActiveSection("registration")} className={cn("px-4 py-2 text-xs font-semibold rounded-t-md transition-colors",
            activeSection === "registration" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}>Registration Form</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* ─── EVENT DETAILS TAB ─── */}
          {activeSection === "details" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Event Title</label>
                <Input placeholder="e.g. Web3 Innovation Summit" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 px-3", !formData.date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(new Date(formData.date + "T00:00:00"), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={formData.date ? new Date(formData.date + "T00:00:00") : undefined} onSelect={(d) => setFormData({ ...formData, date: d ? format(d, "yyyy-MM-dd") : "" })} disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">End Date (Optional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 px-3", !formData.endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(new Date(formData.endDate + "T00:00:00"), "PPP") : <span>Optional</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={formData.endDate ? new Date(formData.endDate + "T00:00:00") : undefined} onSelect={(d) => setFormData({ ...formData, endDate: d ? format(d, "yyyy-MM-dd") : "" })} disabled={(d) => d < new Date(formData.date ? formData.date + "T00:00:00" : new Date().setHours(0,0,0,0))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Time</label>
                  <TimePicker value={formData.startTime} onChange={(t) => setFormData({ ...formData, startTime: t })} placeholder="Start time" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">End Time</label>
                  <TimePicker value={formData.endTime} onChange={(t) => setFormData({ ...formData, endTime: t })} placeholder="End time" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Capacity</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" className="pl-10" required value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                      value={isCustomCategory ? "__custom__" : formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      {PRESET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="__custom__">✏️ Custom</option>
                    </select>
                  </div>
                  {isCustomCategory && <Input placeholder="Type custom category" className="mt-1" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} autoFocus />}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="e.g. San Francisco, CA" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea placeholder="Tell us about your event..." className="min-h-[80px] resize-none" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Event Images</label>
                <div className="grid grid-cols-4 gap-2">
                  {localImages.map((img, i) => (
                    <div key={i} className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${i === coverIndex ? "border-primary shadow-md shadow-primary/20" : "border-border"}`}>
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button type="button" onClick={() => removeImage(i)} className="h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
                        {i !== coverIndex && <button type="button" onClick={() => setAsCover(i)} className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center"><ImageIcon className="h-3.5 w-3.5" /></button>}
                      </div>
                      {i === coverIndex && <div className="absolute top-1 left-1 bg-primary text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase">Cover</div>}
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading}
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-1.5 transition-all">
                    <Upload className="h-5 w-5 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground">Add</span>
                  </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              </div>
            </div>
          )}

          {/* ─── REGISTRATION FORM TAB ─── */}
          {activeSection === "registration" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Registration Fields</p>
                  <p className="text-[11px] text-muted-foreground">Configure what attendees need to fill when registering</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={addRegField}>
                  <Plus className="h-3.5 w-3.5" /> Add Field
                </Button>
              </div>

              <div className="space-y-3">
                {regFields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-border p-3 space-y-3 bg-card/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Field {index + 1}</span>
                      </div>
                      <button type="button" onClick={() => removeRegField(index)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-muted-foreground font-medium uppercase">Label</label>
                        <Input className="h-8 text-xs" placeholder="e.g. Full Name" value={field.label} onChange={(e) => updateRegField(index, { label: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-muted-foreground font-medium uppercase">Type</label>
                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                          value={field.type} onChange={(e) => updateRegField(index, { type: e.target.value as any, options: e.target.value === "select" ? [""] : undefined })}>
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="number">Number</option>
                          <option value="select">Dropdown</option>
                          <option value="checkbox">Checkbox</option>
                        </select>
                      </div>
                    </div>

                    {field.type === "select" && (
                      <div className="space-y-2 border-t border-border pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] text-muted-foreground font-medium uppercase">Options</label>
                          <Button type="button" variant="ghost" size="sm" className="h-5 text-[9px] px-1 hover:bg-primary/10" 
                            onClick={() => updateRegField(index, { options: [...(field.options || []), ""] })}>+ Add Option</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {field.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex gap-1 items-center">
                              <Input className="h-7 text-[10px]" placeholder={`Option ${optIdx + 1}`} value={opt} 
                                onChange={(e) => {
                                  const newOpts = [...(field.options || [])];
                                  newOpts[optIdx] = e.target.value;
                                  updateRegField(index, { options: newOpts });
                                }} />
                              <button type="button" onClick={() => {
                                const newOpts = (field.options || []).filter((_, i) => i !== optIdx);
                                updateRegField(index, { options: newOpts.length ? newOpts : [""] });
                              }} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-muted-foreground font-medium uppercase">Placeholder / Example</label>
                        <Input className="h-8 text-xs" placeholder="e.g. John Doe" value={field.placeholder} onChange={(e) => updateRegField(index, { placeholder: e.target.value })} />
                      </div>
                      <div className="flex items-end pb-0.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" checked={field.required} onChange={(e) => updateRegField(index, { required: e.target.checked })}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
                          <span className="text-xs font-medium">Required</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {regFields.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No registration fields yet. Click "Add Field" to get started.
                </div>
              )}

              {/* Preview */}
              {regFields.filter(f => f.label.trim()).length > 0 && (
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preview</p>
                  <div className="rounded-lg border border-dashed border-border p-4 space-y-2.5 bg-muted/30">
                    {regFields.filter(f => f.label.trim()).map(field => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-[11px] font-medium flex items-center gap-2">
                          {field.type === "checkbox" && <input type="checkbox" className="h-3 w-3" disabled />}
                          {field.label} {field.required && <span className="text-destructive">*</span>}
                        </label>
                        {field.type === "select" ? (
                          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs" disabled>
                            <option value="">Select an option...</option>
                            {field.options?.map((opt, i) => <option key={i} value={opt}>{opt || `Option ${i+1}`}</option>)}
                          </select>
                        ) : field.type !== "checkbox" && (
                          <Input className="h-9 text-xs" placeholder={field.placeholder || field.label} disabled />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            {activeSection === "details" ? (
              <Button type="button" className="px-8 active-press" onClick={() => setActiveSection("registration")}>
                Next: Registration Form →
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Button variant="ghost" type="button" onClick={() => setActiveSection("details")}>← Back</Button>
                <Button type="submit" className="flex-1 active-press" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? "Uploading & Submitting..." : "Submit for Approval"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
