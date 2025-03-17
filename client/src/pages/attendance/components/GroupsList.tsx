import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Group } from "@shared/schema";

interface GroupsListProps {
  groups: Group[];
  selectedGroupId?: number;
  onSelectGroup: (groupId: number) => void;
}

const GroupsList = ({ groups, selectedGroupId, onSelectGroup }: GroupsListProps) => {
  return (
    <Select onValueChange={(value) => onSelectGroup(Number(value))} value={selectedGroupId?.toString()}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Выберите группу" />
      </SelectTrigger>
      <SelectContent>
        {groups.map((group) => (
          <SelectItem key={group.id} value={group.id.toString()}>
            {group.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default GroupsList;
