import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AttendanceControlsProps {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AttendanceControls = ({ selectedMonth, setSelectedMonth, searchQuery, setSearchQuery }: AttendanceControlsProps) => {
  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-lg font-medium">
          {format(selectedMonth, "MMMM yyyy", { locale: ru })}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      <Input
        className="w-[250px]"
        placeholder="Поиск по ученикам..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default AttendanceControls;
