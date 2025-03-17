import { Button } from "@/components/ui/button";
import { Group } from "@shared/schema";

interface GroupsListProps {
  groups: Group[];
  selectedGroup: Group | null;
  onGroupSelect: (group: Group) => void;
}

export function GroupsList({ groups, selectedGroup, onGroupSelect }: GroupsListProps) {
  return (
    <div className="space-y-2 mb-6">
      {groups.map((group) => (
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
