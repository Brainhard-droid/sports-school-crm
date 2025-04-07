import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface GroupFiltersProps {
  filters: {
    searchTerm: string;
    showArchived: boolean;
  };
  onFiltersChange: (filters: { searchTerm: string; showArchived: boolean }) => void;
}

export function GroupFilters({ filters, onFiltersChange }: GroupFiltersProps) {
  return (
    <div className="mb-6 flex gap-4 items-center">
      <div className="flex-1">
        <Input
          placeholder="Поиск по названию группы..."
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