import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Users, ExternalLink, Calendar, MapPin, Tag, Clock, Loader2, Trash2, Eye, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { getEvents, updateEventStatus, deleteEvent, Event, getPlatformStats } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface EventMeta {
  timing?: { start: string; end: string };
  regFields?: { id: string; label: string; type: string; required: boolean; placeholder: string }[];
}

function parseEventMeta(description: string): { cleanDesc: string; meta: EventMeta } {
  const metaMatch = description.match(/<!--EVENTSPHERE_META:(.*?)-->/s);
  let meta: EventMeta = {};
  let cleanDesc = description;
  if (metaMatch) {
    try { meta = JSON.parse(metaMatch[1]); } catch { /* ignore */ }
    cleanDesc = description.replace(/\n?<!--EVENTSPHERE_META:.*?-->/s, "").trim();
  }
  return { cleanDesc, meta };
}

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

const Admin = () => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ users: 0, events: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [all, pStats] = await Promise.all([getEvents(), getPlatformStats()]);
      setAllEvents(all);
      setStats(pStats);
    } catch (error) {
      console.error("Admin load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const pendingEvents = allEvents.filter(e => e.status === "pending");
  const displayEvents = activeTab === "pending" ? pendingEvents : allEvents;

  const handleStatusUpdate = async (id: string, status: "live" | "upcoming" | "sold-out" | "pending") => {
    try {
      await updateEventStatus(id, status);
      toast({ title: "Event Approved", description: "Event is now visible to users." });
      setSelectedEvent(null);
      await loadEvents();
    } catch (error) {
      toast({ title: "Update failed", description: "Could not update event status.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      toast({ title: "Event Deleted", description: "Event has been permanently removed." });
      setSelectedEvent(null);
      setConfirmDeleteId(null);
      await loadEvents();
    } catch (error) {
      toast({ title: "Delete failed", description: "Could not delete event.", variant: "destructive" });
    }
  };

  const selectedMeta = selectedEvent?.description ? parseEventMeta(selectedEvent.description) : { cleanDesc: "", meta: {} };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="container space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" /> Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">Platform oversight, event approvals & management</p>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Pending Approvals" value={pendingEvents.length.toString()} icon={Clock} positive={pendingEvents.length > 0} />
            <StatCard label="Total Events" value={allEvents.length.toString()} icon={Tag} />
            <StatCard label="Platform Users" value={stats.users.toString()} icon={Users} />
            <StatCard label="System Status" value="Healthy" icon={CheckCircle} positive />
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-none">
            <button onClick={() => setActiveTab("pending")}
              className={`px-3 sm:px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px shrink-0 ${activeTab === "pending" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Pending {pendingEvents.length > 0 && <span className="ml-1 bg-destructive/10 text-destructive text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingEvents.length}</span>}
            </button>
            <button onClick={() => setActiveTab("all")}
              className={`px-3 sm:px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px shrink-0 ${activeTab === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              All Events <span className="ml-1 text-[10px] text-muted-foreground">({allEvents.length})</span>
            </button>
          </div>

          {/* Events Table */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Event</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden sm:table-cell">Date</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden md:table-cell">Attendance</th>
                      <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
                      <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr><td colSpan={5} className="px-4 py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/40" /></td></tr>
                    ) : displayEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-20 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-3 opacity-60">
                            <CheckCircle className="h-10 w-10 text-success" />
                            <p className="font-medium">{activeTab === "pending" ? "All caught up! No pending approvals." : "No events on the platform yet."}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={event.image} alt="" className="h-10 w-16 rounded-md object-cover border border-border shadow-sm shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold group-hover:text-primary transition-colors truncate">{event.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                  <span>{event.category}</span><span>•</span><span className="truncate">{event.location}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{event.date}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${event.capacity > 0 ? (event.attendees / event.capacity) * 100 : 0}%` }} />
                              </div>
                              <span className="text-[11px] text-muted-foreground">{event.attendees}/{event.capacity}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                              event.status === "live" ? "bg-success/10 text-success border border-success/20"
                              : event.status === "sold-out" ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : event.status === "pending" ? "bg-warning/10 text-warning border border-warning/20"
                              : "bg-primary/10 text-primary border border-primary/20"
                            }`}>{event.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Details */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setSelectedEvent(event)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Event Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedEvent && (
                                    <div className="space-y-5 pt-2">
                                      {/* Cover image */}
                                      <div className="relative rounded-xl overflow-hidden border border-border bg-black">
                                        <img src={selectedEvent.image} alt="" className="w-full max-h-[300px] object-contain mx-auto" />
                                        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-widest">
                                          {selectedEvent.category}
                                        </div>
                                        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                                          selectedEvent.status === "pending" ? "bg-yellow-500/80 text-black" : selectedEvent.status === "live" ? "bg-green-500/80 text-white" : "bg-white/60 text-black backdrop-blur-md"
                                        }`}>{selectedEvent.status}</div>
                                      </div>

                                      {/* All images */}
                                      {selectedEvent.images && selectedEvent.images.length > 1 && (
                                        <div className="space-y-2">
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">All Images ({selectedEvent.images.length})</p>
                                          <div className="grid grid-cols-3 gap-2">
                                            {selectedEvent.images.map((img, i) => (
                                              <div key={i} className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video">
                                                <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-contain" />
                                                {i === 0 && <div className="absolute top-1 left-1 bg-primary text-[7px] text-white px-1 py-0.5 rounded font-bold uppercase">Cover</div>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Info Grid */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title</p><p className="text-sm font-semibold">{selectedEvent.title}</p></div>
                                        <div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Capacity</p><p className="text-sm font-semibold">{selectedEvent.attendees} / {selectedEvent.capacity} Attendees</p></div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5 shrink-0" /> {selectedEvent.date}</div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /> {selectedEvent.location}</div>
                                      </div>

                                      {/* Timing */}
                                      {selectedMeta.meta.timing && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-primary" /></div>
                                          <div><p className="text-[10px] text-muted-foreground font-medium uppercase">Event Timing</p><p className="text-sm font-semibold">{formatTime(selectedMeta.meta.timing.start)} — {formatTime(selectedMeta.meta.timing.end)}</p></div>
                                        </div>
                                      )}

                                      {/* Clean Description */}
                                      <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedMeta.cleanDesc}</p>
                                      </div>

                                      {/* Registration Fields */}
                                      {selectedMeta.meta.regFields && selectedMeta.meta.regFields.length > 0 && (
                                        <div className="space-y-2">
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registration Fields ({selectedMeta.meta.regFields.length})</p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {selectedMeta.meta.regFields.map((f, i) => (
                                              <span key={i} className={`text-[10px] px-2 py-0.5 rounded border ${f.required ? "bg-primary/10 text-primary border-primary/20 font-semibold" : "bg-muted text-muted-foreground border-border"}`}>
                                                {f.label}{f.required ? " *" : ""}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Organizer */}
                                      <div className="flex items-center gap-3 pt-3 border-t border-border">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">ORG</div>
                                        <div className="flex-1">
                                          <p className="text-[11px] font-bold">Organizer</p>
                                          <p className="text-[10px] text-muted-foreground font-mono">ID: {selectedEvent.organizerId || "Unknown"}</p>
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <DialogFooter className="flex gap-2 pt-3">
                                        {selectedEvent.status === "pending" && (
                                          <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => handleStatusUpdate(selectedEvent.id, "upcoming")}>
                                            <CheckCircle className="h-4 w-4 mr-1.5" /> Approve
                                          </Button>
                                        )}
                                        <Button variant="ghost" className="flex-1 text-destructive hover:bg-destructive/5" onClick={() => setConfirmDeleteId(selectedEvent.id)}>
                                          <Trash2 className="h-4 w-4 mr-1.5" /> Delete Event
                                        </Button>
                                      </DialogFooter>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {/* Quick Delete */}
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={() => setConfirmDeleteId(event.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete this event? This action cannot be undone and will remove all associated registrations.
          </p>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
