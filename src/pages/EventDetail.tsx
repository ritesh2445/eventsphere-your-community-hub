import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft, Share2, Clock, Loader2, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getEvents, Event, registerForEvent, getRegistrations, cancelRegistration, calculateStatus } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import LivePolls from "@/components/events/LivePolls";

interface RegFieldConfig {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "number";
  required: boolean;
  placeholder: string;
}

interface EventMeta {
  timing?: { start: string; end: string };
  endDate?: string;
  regFields?: RegFieldConfig[];
}

// Parse metadata embedded in description
function parseEventMeta(description: string): { cleanDesc: string; meta: EventMeta } {
  const metaMatch = description.match(/<!--EVENTSPHERE_META:(.*?)-->/s);
  let meta: EventMeta = {};
  let cleanDesc = description;

  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1]);
    } catch { /* ignore parse errors */ }
    cleanDesc = description.replace(/\n?<!--EVENTSPHERE_META:.*?-->/s, "").trim();
  }

  return { cleanDesc, meta };
}

// Format 24h time to 12h AM/PM
function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

const AUTO_SLIDE_INTERVAL = 4000;

const DEFAULT_REG_FIELDS: RegFieldConfig[] = [
  { id: "fullName", label: "Full Name", type: "text", required: true, placeholder: "e.g. John Doe" },
  { id: "email", label: "Email", type: "email", required: true, placeholder: "e.g. john@example.com" },
  { id: "phone", label: "Phone", type: "tel", required: false, placeholder: "e.g. +91 9876543210" },
];

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [regFormValues, setRegFormValues] = useState<Record<string, string>>({});

  const images = event?.images && event.images.length > 0 ? event.images : (event?.image ? [event.image] : []);

  // Parse metadata
  const { cleanDesc, meta } = event?.description ? parseEventMeta(event.description) : { cleanDesc: "", meta: {} };
  const regFields = meta.regFields && meta.regFields.length > 0 ? meta.regFields : DEFAULT_REG_FIELDS;

  // Auto-slide
  useEffect(() => {
    if (images.length <= 1 || paused) return;
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, AUTO_SLIDE_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [images.length, paused]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const allEvents = await getEvents();
      const found = allEvents.find((e) => e.id === id);
      setEvent(found || null);

      if (user && id) {
        const regs = await getRegistrations();
        setIsRegistered(regs.some(r => r.eventId === id && r.userId === user.id));
        // Pre-fill email if available
        setRegFormValues(prev => ({ ...prev, email: user.email || "", fullName: user.user_metadata?.full_name || "" }));
      }
    } catch (error) {
      console.error("EventDetail load error:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, user]);

  const handleRegister = async () => {
    if (!user) { toast({ title: "Sign in required", description: "Please sign in to register.", variant: "destructive" }); return; }
    if (!id) return;

    // Validate required fields
    for (const field of regFields) {
      if (field.required && !regFormValues[field.id]?.trim()) {
        toast({ title: `${field.label} is required`, description: `Please fill in the ${field.label} field.`, variant: "destructive" });
        return;
      }
    }

    setRegistering(true);
    const result = await registerForEvent(id, user.id);
    setRegistering(false);

    if (result.success) {
      toast({ title: "Registration successful! 🎉", description: "You're registered. See you there!" });
      setIsRegistered(true);
      setEvent(prev => {
        if (!prev) return prev;
        const newAttendees = prev.attendees + 1;
        const newStatus = prev.status !== "pending" ? calculateStatus({ ...prev, attendees: newAttendees }) : prev.status;
        return { ...prev, attendees: newAttendees, status: newStatus };
      });
    } else {
      toast({ title: "Registration failed", description: result.error, variant: "destructive" });
    }
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-14"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-14">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Event not found</p>
            <Link to="/events"><Button variant="outline" size="sm">Back to Events</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const ticketsLeft = event.capacity - event.attendees;

  const eventDate = event.date ? new Date(event.date) : new Date();
  const now = new Date();
  eventDate.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isCancelable = diffDays >= 2;

  const handleCancel = async () => {
    if (!user || !id) return;
    setCanceling(true);
    const result = await cancelRegistration(id, user.id);
    setCanceling(false);

    if (result.success) {
      toast({ title: "Registration cancelled", description: "You have successfully cancelled your registration." });
      setIsRegistered(false);
      setEvent(prev => {
        if (!prev) return prev;
        const newAttendees = Math.max(0, prev.attendees - 1);
        const newStatus = prev.status !== "pending" ? calculateStatus({ ...prev, attendees: newAttendees }) : prev.status;
        return { ...prev, attendees: newAttendees, status: newStatus };
      });
    } else {
      toast({ title: "Cancellation failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-14">
        {/* Image Banner / Carousel */}
        <div
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[500px] overflow-hidden group bg-black"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={event.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full object-contain"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
          
          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50">
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCurrentImageIndex(i)} className={`h-2 rounded-full transition-all ${i === currentImageIndex ? "w-8 bg-primary" : "w-2 bg-white/50 hover:bg-white/80"}`} />
                ))}
              </div>
              <div className="absolute top-4 right-4 bg-background/30 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="container pb-16 pt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
            <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to events
            </Link>

            {/* Title & Tags */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary px-2 py-1 rounded bg-primary/10">{event.category}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                  event.status === "live" ? "bg-success/10 text-success" : event.status === "sold-out" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
                }`}>{event.status}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter">{event.title}</h1>
            </div>

            {/* Event Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Calendar className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">Date</p>
                  <p className="text-sm font-semibold">
                    {event.date}
                    {meta.endDate && ` — ${new Date(meta.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                  </p>
                </div>
              </div>
              {meta.timing && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-primary" /></div>
                  <div><p className="text-[10px] text-muted-foreground font-medium uppercase">Time</p><p className="text-sm font-semibold">{formatTime(meta.timing.start)} – {formatTime(meta.timing.end)}</p></div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-primary" /></div>
                <div><p className="text-[10px] text-muted-foreground font-medium uppercase">Location</p><p className="text-sm font-semibold">{event.location}</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Users className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0"><p className="text-[10px] text-muted-foreground font-medium uppercase">Spots</p><p className="text-sm font-semibold">{ticketsLeft > 0 ? `${ticketsLeft} left` : "Sold Out"}</p></div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight">About this event</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {cleanDesc}
              </div>
            </div>

            {/* Live Polls */}
            <div className="space-y-4 border-t border-border pt-6">
               <LivePolls eventId={event.id} isOrganizer={user?.id === event.organizerId} />
            </div>

            {/* Registration Section with dynamic fields */}
            <div className="space-y-4 border-t border-border pt-6">
              <h2 className="text-xl font-bold tracking-tight">Registration</h2>
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">Free Registration</p>
                    <p className="text-sm text-muted-foreground">
                      {event.attendees} attending · {ticketsLeft > 0 ? `${ticketsLeft} spots remaining` : "No spots remaining"}
                    </p>
                  </div>
                  {isRegistered && (
                    <div className="flex items-center gap-1.5 text-success bg-success/10 px-3 py-1.5 rounded-full text-sm font-semibold">
                      <CheckCircle className="h-4 w-4" /> Registered
                    </div>
                  )}
                </div>

                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${event.capacity > 0 ? (event.attendees / event.capacity) * 100 : 0}%` }}
                    className={`h-full ${event.status === "sold-out" ? "bg-destructive" : "bg-primary"}`} />
                </div>

                {/* Dynamic Registration Form */}
                {!isRegistered && event.status !== "sold-out" && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {regFields.map(field => (
                        <div key={field.id} className="space-y-1">
                          <label className="text-[11px] font-medium">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </label>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder || field.label}
                            className="h-11"
                            value={regFormValues[field.id] || ""}
                            onChange={(e) => setRegFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  {isRegistered ? (
                    <Button size="lg" className="flex-1 text-base font-semibold h-12"
                      variant="destructive"
                      disabled={!isCancelable || canceling}
                      onClick={handleCancel}
                      title={!isCancelable ? "Cancellation is only allowed 2 or more days before the event" : ""}
                    >
                      {canceling ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cancel Registration"}
                    </Button>
                  ) : (
                    <Button size="lg" className="flex-1 active-press text-base font-semibold h-12"
                      disabled={event.status === "sold-out" || event.status === "past" || registering}
                      onClick={handleRegister}>
                      {registering ? <Loader2 className="h-5 w-5 animate-spin" />
                        : event.status === "sold-out" ? "Sold Out"
                        : event.status === "past" ? "Event Ended"
                        : "Register Now"}
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="gap-2 h-12" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link copied!", description: "Share this event with your network." });
                  }}>
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  {isRegistered && !isCancelable 
                    ? "You can only cancel your registration 2 or more days before the event."
                    : "By registering, you agree to share your details with the event organizer."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;
