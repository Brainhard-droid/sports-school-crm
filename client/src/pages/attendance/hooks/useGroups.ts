import { useQuery } from "@tanstack/react-query";
import { Group } from "@shared/schema";

export function useGroups() {
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  return {
    groups: groups?.filter(g => g.active).sort((a, b) => a.name.localeCompare(b.name)) ?? []
  };
}
