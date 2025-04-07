import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface StudentFiltersProps {
  filters: {
    searchTerm: string;
    showArchived: boolean;
  };
  onFiltersChange: (filters: { searchTerm: string; showArchived: boolean }) => void;
}

export function StudentFilters({ filters, onFiltersChange }: StudentFiltersProps) {
  return (
    <div className="mb-6 flex gap-4 items-center">
      <div className="flex-1">
        <Input
          placeholder="Поиск по имени ученика или родителя..."
          value={filters.searchTerm}
          onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="showArchived"
          checked={filters.showArchived}
          onCheckedChange={(checked) =>
            onFiltersChange({ ...filters, showArchived: checked as boolean })
          }
        />
        <label htmlFor="showArchived" className="text-sm">
          Показать архивные
        </label>
      </div>
    </div>
  );
}