import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Group, InsertGroup, insertGroupSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface EditGroupDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGroupDialog({ 
  group, 
  open, 
  onOpenChange 
}: EditGroupDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertGroup>({
    resolver: zodResolver(insertGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      trainer: 1,
      maxStudents: 10,
      active: true,
    },
  });

  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description,
        maxStudents: group.maxStudents,
        trainer: group.trainer,
        active: group.active,
      });
    }
  }, [group, form]);

  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: number; group: InsertGroup }) => {
      const res = await apiRequest("PATCH", `/api/groups/${data.id}`, data.group);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      onOpenChange(false);
      toast({
        title: "Успешно",
        description: "Группа обновлена",
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

  const handleEditGroup = (data: InsertGroup) => {
    if (!group) return;
    updateGroupMutation.mutate({ id: group.id, group: data });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать группу</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleEditGroup)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название группы</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxStudents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Максимум учеников</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Сохранить изменения
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}