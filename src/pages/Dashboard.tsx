import { motion } from "framer-motion";
import { Calendar, Users, BarChart3, Plus, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { mockEvents } from "@/lib/mockData";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="container space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, Organizer</p>
            </div>
            <Button className="active-press gap-2" size="sm">
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard label="Total Events" value="12" change="+3 this month" icon={Calendar} positive />
            <StatCard label="Total Attendees" value="2,847" change="+18%" icon={Users} positive />
            <StatCard label="Active Tickets" value="1,203" icon={Ticket} />
            <StatCard label="Engagement" value="94%" change="+5%" icon={BarChart3} positive />
          </motion.div>

          {/* My Events */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold tracking-tight">Your Events</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Event</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Date</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Attendees</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/event/${event.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                          {event.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono-data hidden sm:table-cell">
                        {event.date}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono-data hidden md:table-cell">
                        {event.attendees}/{event.capacity}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          event.status === "live"
                            ? "bg-success/10 text-success"
                            : event.status === "sold-out"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
