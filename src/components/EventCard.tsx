import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  capacity: number;
  image: string;
  status: "live" | "upcoming" | "sold-out";
  category: string;
}

const statusConfig = {
  live: { label: "LIVE", className: "bg-success text-success-foreground" },
  upcoming: { label: "UPCOMING", className: "bg-primary text-primary-foreground" },
  "sold-out": { label: "SOLD OUT", className: "bg-destructive text-destructive-foreground" },
};

const EventCard = ({ id, title, date, location, attendees, capacity, image, status, category }: EventCardProps) => {
  const statusInfo = statusConfig[status];
  const ticketsLeft = capacity - attendees;

  return (
    <Link to={`/event/${id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="group relative overflow-hidden rounded-xl border border-border bg-card active-press"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
          <div className="absolute top-3 right-3 flex gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider font-mono-data ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
          {status !== "sold-out" && (
            <div className="absolute top-3 left-3">
              <span className="rounded-md bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground font-mono-data">
                {ticketsLeft} left
              </span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              {category}
            </span>
            <h3 className="mt-1 text-sm font-semibold tracking-tight line-clamp-1">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-mono-data">
              <Calendar className="h-3 w-3" />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="font-mono-data">{attendees}</span> attending
            </span>
            <div className="h-1 w-20 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(attendees / capacity) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default EventCard;
