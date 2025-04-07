import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Student, Group, InsertStudentGroup } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddToGroupDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToGroupDialog({
  student,
  open,
  onOpenChange,
}: AddToGroupDialogProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const { toast } = useToast();

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const activeGroups = groups?.filter(group => group.active) || [];

  const addToGroupMutation = useMutation({
    mutationFn: async (data: InsertStudentGroup) => {
      const res = await fetch(`/api/students/student-groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to add student to group" }));
        throw new Error(errorData.message || "Failed to add student to group");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      onOpenChange(false);
      setSelectedGroupId("");
      toast({
        title: "Успешно",
        description: "Ученик добавлен в группу",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToGroup = async () => {
    if (!student || !selectedGroupId) return;

    const data: InsertStudentGroup = {
      studentId: student.id,
      groupId: parseInt(selectedGroupId),
      active: true,
    };

    await addToGroupMutation.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Добавить ученика в группу
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Выберите группу</label>
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите группу" />
              </SelectTrigger>
              <SelectContent>
                {activeGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAddToGroup}
            className="w-full"
            disabled={!selectedGroupId || addToGroupMutation.isPending}
          >
            Добавить в группу
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}