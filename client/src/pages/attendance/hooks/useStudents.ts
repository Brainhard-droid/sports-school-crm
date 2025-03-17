import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Student } from "@shared/schema";

export const useStudents = (groupId?: number) => {
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/group-students", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const res = await apiRequest("GET", `/api/group-students/${groupId}`);
      return res.json();
    },
    enabled: !!groupId,
  });

  return { students };
};
