import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft, Share2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { mockEvents } from "@/lib/mockData";

const EventDetail = () => {
  const { id } = useParams();
  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-14">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Event not found</p>
            <Link to="/explore">
              <Button variant="outline" size="sm">Back to Explore</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ticketsLeft = event.capacity - event.attendees;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="container -mt-16 relative z-10 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl space-y-6"
          >
            <Link to="/explore" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to events
            </Link>

            <div className="space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                {event.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">{event.title}</h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-mono-data">
                <Calendar className="h-4 w-4" /> {event.date}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {event.location}
              </span>
              <span className="flex items-center gap-1.5 font-mono-data">
                <Users className="h-4 w-4" /> {event.attendees}/{event.capacity}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> 9:00 AM – 6:00 PM
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="active-press"
                disabled={event.status === "sold-out"}
              >
                {event.status === "sold-out" ? "Sold Out" : `Register · ${ticketsLeft} spots left`}
              </Button>
              <Button variant="outline" size="lg" className="active-press">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Join industry leaders, practitioners, and enthusiasts for an immersive experience. 
                Expect keynote sessions, hands-on workshops, networking opportunities, and exclusive 
                access to cutting-edge demos and previews.
              </p>
            </div>

            {/* Schedule */}
            <div className="border-t border-border pt-6 space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Schedule</h2>
              <div className="space-y-2">
                {[
                  { time: "09:00", title: "Registration & Check-in", duration: "30 min" },
                  { time: "09:30", title: "Opening Keynote", duration: "45 min" },
                  { time: "10:30", title: "Workshop Track A", duration: "90 min" },
                  { time: "12:00", title: "Lunch & Networking", duration: "60 min" },
                  { time: "13:00", title: "Panel Discussion", duration: "60 min" },
                  { time: "14:30", title: "Workshop Track B", duration: "90 min" },
                  { time: "16:30", title: "Closing & Awards", duration: "30 min" },
                ].map((item) => (
                  <div key={item.time} className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
                    <span className="text-xs font-semibold font-mono-data text-primary w-12">{item.time}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono-data">{item.duration}</span>
                  </div>
                ))}
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
