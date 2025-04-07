import { useQuery } from "@tanstack/react-query";
import { Group, Schedule } from "@shared/schema";

export function useGroups() {
  const { data: groups, isLoading, error } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const getGroupSchedules = (groupId: number) => {
    return schedules?.filter(schedule => schedule.groupId === groupId) || [];
  };

  const filterGroups = (filters: { searchTerm: string; showArchived: boolean }) => {
    return groups?.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           (group.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ?? false);
      const matchesArchived = filters.showArchived ? true : group.active;

      return matchesSearch && matchesArchived;
    }) || [];
  };

  return {
    groups,
    schedules,
    isLoading,
    error,
    getGroupSchedules,
    filterGroups,
  };
}