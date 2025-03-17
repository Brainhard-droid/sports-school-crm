import { Button } from "@/components/ui/button";
import { Group } from "@shared/schema";

interface GroupsListProps {
  groups: Group[];
  onGroupSelect: (group: Group) => void;
}

export function GroupsList({ groups, onGroupSelect }: GroupsListProps) {
  return (
    <div className="space-y-2 mb-6">
      {groups
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((group) => (
          <Button
            key={group.id}
            variant="outline"
            className="w-full justify-start text-left"
            onClick={() => onGroupSelect(group)}
          >
            {group.name}
          </Button>
        ))}
    </div>
  );
}
