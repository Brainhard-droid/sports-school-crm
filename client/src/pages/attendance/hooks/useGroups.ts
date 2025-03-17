import { useQuery } from "@tanstack/react-query";
import { ExtendedGroup } from "@shared/schema";

export function useGroups() {
  const { data: groups, isLoading } = useQuery<ExtendedGroup[]>({
    queryKey: ["/api/groups"],
  });

  const activeGroups = groups?.filter(g => g.active) || [];

  return {
    groups: activeGroups,
    isLoading,
  };
}