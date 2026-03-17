import { motion } from "framer-motion";
import { Users, Calendar, Shield, BarChart3, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";

const pendingEvents = [
  { id: "p1", title: "Blockchain Hackathon", organizer: "Alice M.", submitted: "2 hours ago" },
  { id: "p2", title: "UX Research Workshop", organizer: "Bob K.", submitted: "5 hours ago" },
];

const recentUsers = [
  { id: "u1", name: "Sarah Connor", email: "sarah@example.com", role: "organizer", status: "active" },
  { id: "u2", name: "John Doe", email: "john@example.com", role: "user", status: "active" },
  { id: "u3", name: "Jane Smith", email: "jane@example.com", role: "user", status: "banned" },
];

const Admin = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="container space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Platform oversight & management</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value="8,421" change="+124" icon={Users} positive />
            <StatCard label="Total Events" value="342" change="+28" icon={Calendar} positive />
            <StatCard label="Pending Approval" value="2" icon={AlertCircle} />
            <StatCard label="Platform Health" value="99.9%" icon={Shield} positive />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pending Events */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-5 space-y-4"
            >
              <h2 className="text-sm font-semibold">Pending Approvals</h2>
              <div className="space-y-3">
                {pendingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">by {event.organizer} · {event.submitted}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="default" className="h-7 text-xs active-press">
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs active-press">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* User Management */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-5 space-y-4"
            >
              <h2 className="text-sm font-semibold">Recent Users</h2>
              <div className="space-y-2">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {user.role}
                      </span>
                      <span className={`h-2 w-2 rounded-full ${
                        user.status === "active" ? "bg-success" : "bg-destructive"
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
