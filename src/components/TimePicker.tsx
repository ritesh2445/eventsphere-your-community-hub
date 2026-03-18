import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string; // "HH:MM" format
  onChange: (time: string) => void;
  placeholder?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export const TimePicker = ({ value, onChange, placeholder = "Pick time" }: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  const selectedHour = value ? value.split(":")[0] : "";
  const selectedMin = value ? value.split(":")[1] : "";

  const handleSelect = (hour: string, min: string) => {
    onChange(`${hour}:${min}`);
    setOpen(false);
  };

  const formatDisplay = (time: string) => {
    if (!time) return null;
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatDisplay(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-3" align="start">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Time</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Hours */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium text-center">Hour</p>
              <div className="max-h-[180px] overflow-y-auto space-y-0.5 pr-1 scrollbar-none">
                {HOURS.map(h => {
                  const hour = parseInt(h);
                  const ampm = hour >= 12 ? "PM" : "AM";
                  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelect(h, selectedMin || "00")}
                      className={cn(
                        "w-full text-xs py-1.5 px-2 rounded-md text-left transition-colors",
                        selectedHour === h
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {h12} {ampm}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Minutes */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium text-center">Min</p>
              <div className="space-y-0.5">
                {MINUTES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelect(selectedHour || "09", m)}
                    className={cn(
                      "w-full text-xs py-1.5 px-2 rounded-md text-left transition-colors",
                      selectedMin === m
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
