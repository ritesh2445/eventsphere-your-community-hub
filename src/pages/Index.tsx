import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { getEvents, Event } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Live attendee counts, instant notifications, and real-time poll results powered by subscriptions.",
  },
  {
    icon: Shield,
    title: "QR Check-In",
    description: "Frictionless entry with secure QR codes. Scan, verify, admit — in under 2 seconds.",
  },
  {
    icon: BarChart3,
    title: "AI Recommendations",
    description: "Smart event matching based on your interests, attendance history, and community signals.",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const all = await getEvents();
        const trending = all
          .filter(e => e.status !== "pending")
          .slice(0, 3);
        setEvents(trending);
      } catch (error) {
        console.error("Home fetch error:", error);
      }
    };
    
    fetchTrending();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-40 md:pb-32 px-1">
        <div className="container">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-2xl mx-auto text-center space-y-6"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-subtle" />
                Platform v1.0 — Now Live
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tighter leading-[1.1]"
            >
              Orchestrate with{" "}
              <span className="text-gradient">Precision</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed px-2"
            >
              EventSphere provides the infrastructure for high-stakes gatherings.
              Real-time, AI-driven, and built for scale.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4 sm:px-0">
              <Link to="/events">
                <Button size="lg" className="active-press gap-2 w-full sm:w-auto">
                  Browse Events
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={user ? "/dashboard" : "/auth/signup"}>
                <Button variant="outline" size="lg" className="active-press w-full sm:w-auto">
                  {user ? "My Dashboard" : "Get Started"}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="pb-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Trending Events</h2>
                <p className="text-sm text-muted-foreground mt-1">Curated for you</p>
              </div>
              <Link to="/events">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <EventCard {...event} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-xl font-semibold tracking-tight">Built for Scale</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Every feature designed for professional event orchestration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-6 space-y-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8 md:p-12 text-center space-y-4"
          >
            <h2 className="text-2xl font-bold tracking-tight">Ready to orchestrate?</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Join thousands of organizers already using EventSphere to create unforgettable experiences.
            </p>
            <Link to={user ? "/dashboard" : "/auth/signup"}>
              <Button size="lg" className="active-press mt-2">
                {user ? "Go to Dashboard" : "Start for Free"}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
