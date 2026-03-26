import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Calendar, Users, BarChart3, Ticket, ArrowRight, Star, Search, Loader2, Eye, X, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { getOrganizerEvents, getUserRegistrations, getEventRegistrations, Event, EventRegistrant } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Registrations viewer state
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [registrants, setRegistrants] = useState<EventRegistrant[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let data: Event[] = [];
      if (userRole === "organizer") {
        data = await getOrganizerEvents(user.id);
      } else if (userRole === "attendee") {
        data = await getUserRegistrations(user.id);
      } else if (userRole === "admin") {
        data = await getOrganizerEvents(user.id); 
      }
      setEvents(data);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, userRole]);

  const handleViewRegistrations = async (event: Event) => {
    setViewingEvent(event);
    setLoadingRegs(true);
    try {
      const regs = await getEventRegistrations(event.id);
      setRegistrants(regs);
    } catch (err) {
      console.error("Failed to load registrations:", err);
      setRegistrants([]);
    } finally {
      setLoadingRegs(false);
    }
  };

  const filteredEvents = (events || []).filter(e => {
    const title = e.title || "";
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || e.status === filter;
    return matchesSearch && matchesFilter;
  });

  const isOrganizer = userRole === "organizer" || userRole === "admin";
  const isAttendee = userRole === "attendee";


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="container space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isOrganizer ? "Organizer Dashboard" : "My Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isOrganizer 
                  ? "Manage your events and track performance" 
                  : "Track your registrations and upcoming experiences"}
              </p>
            </div>
            {isOrganizer && <CreateEventDialog onEventCreated={loadData} />}
            {isAttendee && (
              <Link to="/events">
                <Button variant="outline" size="sm" className="h-9 gap-2 w-full sm:w-auto">
                  Browse Events <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`grid grid-cols-2 ${isOrganizer ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}
          >
            {isOrganizer ? (
              <>
                <StatCard label="Total Events" value={events.length.toString()} icon={Calendar} positive />
                <StatCard label="Total Attendees" value={events.reduce((acc, curr) => acc + curr.attendees, 0).toLocaleString()} icon={Users} positive />
                <StatCard label="Live Events" value={events.filter(e => e.status === "live").length.toString()} icon={Ticket} />
                <StatCard label="Pending Approval" value={events.filter(e => e.status === "pending").length.toString()} icon={BarChart3} />
              </>
            ) : (
              <>
                <StatCard label="Events Joined" value={events.length.toString()} icon={Star} positive />
                <StatCard label="Upcoming" value={events.filter(e => e.status === "upcoming").length.toString()} icon={Calendar} />
                <StatCard label="Live Now" value={events.filter(e => e.status === "live").length.toString()} icon={Ticket} />
              </>
            )}
          </motion.div>

          {/* Events List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                {isOrganizer ? "Your Hosted Events" : "My Registrations"}
              </h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-9 h-9 text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="live">Live</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="sold-out">Sold Out</option>
                  <option value="past">Past</option>
                  {isOrganizer && <option value="pending">Pending</option>}
                </select>
              </div>
            </div>
            
            {
              [
                { title: isOrganizer ? "Active Events" : "Upcoming & Live Events", data: filteredEvents.filter(e => e.status !== "past") },
                { title: isOrganizer ? "Past Hosted Events" : "Events registered previously", data: filteredEvents.filter(e => e.status === "past") }
              ].filter(section => section.data.length > 0 || section.title.includes("Active") || section.title.includes("Upcoming")).map((section, idx) => (
                <div key={idx} className="space-y-3 mt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground ml-1">{section.title}</h3>
                  <div className={`rounded-xl border border-border bg-card overflow-hidden shadow-sm ${section.title.includes("Past") || section.title.includes("previously") ? "opacity-75" : ""}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Event</th>
                            <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden sm:table-cell">Date</th>
                            <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden md:table-cell">
                              {isOrganizer ? "Attendees" : "Location"}
                            </th>
                            <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
                            {isOrganizer && (
                              <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {loading ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-20 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/40" />
                              </td>
                            </tr>
                          ) : section.data.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                {events.length === 0 
                                  ? (isOrganizer ? "No events found. Start by creating one!" : "You haven't registered for any events yet.")
                                  : "No matching events found in this category."}
                              </td>
                            </tr>
                          ) : (
                            section.data.map((event) => (
                              <tr key={event.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-4 py-4">
                                  <Link to={`/event/${event.id}`} className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-2">
                                    {event.title}
                                  </Link>
                                </td>
                                <td className="px-4 py-4 text-[11px] text-muted-foreground font-medium hidden sm:table-cell">
                                  {event.date}
                                </td>
                                <td className="px-4 py-4 text-[11px] text-muted-foreground hidden md:table-cell">
                                  {isOrganizer ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-primary" 
                                          style={{ width: `${event.capacity > 0 ? (event.attendees / event.capacity) * 100 : 0}%` }}
                                        />
                                      </div>
                                      <span>{event.attendees}/{event.capacity}</span>
                                    </div>
                                  ) : event.location}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                                    event.status === "live"
                                      ? "bg-success/10 text-success border border-success/20"
                                      : event.status === "sold-out"
                                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                                      : event.status === "pending"
                                      ? "bg-warning/10 text-warning border border-warning/20"
                                      : event.status === "past"
                                      ? "bg-muted text-muted-foreground border border-border line-through"
                                      : "bg-primary/10 text-primary border border-primary/20"
                                  }`}>
                                    {event.status}
                                  </span>
                                </td>
                                {isOrganizer && (
                                  <td className="px-4 py-4 text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 gap-1.5 text-xs"
                                      onClick={() => handleViewRegistrations(event)}
                                    >
                                      <Eye className="h-3.5 w-3.5" /> Registrations
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))
            }
          </motion.div>
        </div>
      </main>

      {/* Registrations Dialog */}
      <Dialog open={!!viewingEvent} onOpenChange={(open) => { if (!open) setViewingEvent(null); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Registrations — {viewingEvent?.title}
            </DialogTitle>
          </DialogHeader>

          {loadingRegs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
            </div>
          ) : registrants.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <User className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No registrations yet for this event.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{registrants.length} registered attendee{registrants.length !== 1 ? "s" : ""}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {viewingEvent && viewingEvent.capacity > 0 ? Math.round((registrants.length / viewingEvent.capacity) * 100) : 0}% filled
                </span>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2.5">#</th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2.5">Name</th>
                      <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {registrants.map((reg, i) => (
                      <tr key={reg.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                              {reg.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{reg.fullName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                          {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "Unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
