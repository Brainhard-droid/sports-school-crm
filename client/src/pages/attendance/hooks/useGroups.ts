import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Group } from "@shared/schema";

export const useGroups = () => {
  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/groups");
      return res.json();
    },
  });

  return { groups };
};
