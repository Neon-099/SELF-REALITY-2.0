import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  date,
  setDate,
  className,
  disabled = false,
}: DateTimePickerProps) {
  // Time state with proper formatting
  const [time, setTime] = React.useState<string>(
    date ? format(date, "HH:mm") : "12:00"
  );

  // Update time when date changes
  React.useEffect(() => {
    if (date) {
      setTime(format(date, "HH:mm"));
    }
  }, [date]);

  // Handle time selection
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);

    if (date) {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setDate(newDate);
    }
  };

  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      return;
    }

    // Keep the time from the existing date if there is one, or use the current time
    if (date) {
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
    } else if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
    }

    setDate(newDate);
  };

  return (
    <div className={cn("flex flex-col xs:flex-row gap-1 xs:gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal w-full h-7 xs:h-8 sm:h-10 text-[10px] xs:text-xs sm:text-sm px-2 py-1",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-1 xs:mr-2 h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-solo-dark border-gray-800" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="border-gray-800 scale-[0.85] xs:scale-90 sm:scale-100 origin-top"
          />
        </PopoverContent>
      </Popover>

      <div className="relative mt-1 xs:mt-0">
        <Clock className="absolute left-2 xs:left-2.5 top-1.5 xs:top-2 sm:top-2.5 h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-gray-400" />
        <Input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="pl-7 xs:pl-8 sm:pl-9 h-7 xs:h-8 sm:h-10 text-[10px] xs:text-xs sm:text-sm w-full xs:w-[100px] sm:w-[130px] bg-solo-dark border-gray-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          disabled={disabled || !date}
        />
      </div>
    </div>
  );
}