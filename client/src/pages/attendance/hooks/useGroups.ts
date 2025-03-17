import { useQuery } from "@tanstack/react-query";
import { Group } from "@shared/schema";

export function useGroups() {
  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const activeGroups = groups?.filter(g => g.active) || [];

  return {
    groups: activeGroups,
    isLoading,
  };
}
