import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  capacity: number;
  image: string;
  category: string;
  status: "live" | "upcoming" | "sold-out" | "pending" | "past";
}

const EventCard = ({
  id,
  title,
  date,
  location,
  attendees,
  capacity,
  image,
  category,
  status,
}: EventCardProps) => {
  return (
    <Link to={`/event/${id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
      >
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
              {category}
            </span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              status === "live"
                ? "bg-success/10 text-success"
                : status === "sold-out"
                ? "bg-destructive/10 text-destructive"
                : status === "pending"
                ? "bg-warning/10 text-warning"
                : status === "past"
                ? "bg-muted text-muted-foreground line-through"
                : "bg-secondary text-muted-foreground"
            }`}>
              {status}
            </span>
          </div>

          <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
              <span>{attendees}/{capacity} Joined</span>
              <span>{capacity > 0 ? Math.round((attendees / capacity) * 100) : 0}%</span>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(attendees / capacity) * 100}%` }}
                className={`h-full ${status === "sold-out" ? "bg-destructive" : "bg-primary"}`}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default EventCard;
