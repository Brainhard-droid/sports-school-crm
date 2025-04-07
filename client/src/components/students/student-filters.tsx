import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface StudentFiltersProps {
  filters: {
    searchTerm: string;
    showArchived: boolean;
  };
  onFiltersChange: (filters: { searchTerm: string; showArchived: boolean }) => void;
}

export function StudentFilters({ filters, onFiltersChange }: StudentFiltersProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени ученика или родителя..."
          value={filters.searchTerm}
          onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
          className="pl-10"
        />
      </div>
    </div>
  );
}