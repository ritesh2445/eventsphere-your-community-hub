import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  positive?: boolean;
}

const StatCard = ({ label, value, change, icon: Icon, positive }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="rounded-xl border border-border bg-card p-4 space-y-2"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-semibold tracking-tight font-mono-data">{value}</span>
      {change && (
        <span className={`text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
          {change}
        </span>
      )}
    </div>
  </motion.div>
);

export default StatCard;
