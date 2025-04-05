import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export interface Section {
  id?: number;
  name: string;
  description: string;
  active?: boolean;
}

interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  section?: Section;
}

export function SectionFormModal({ isOpen, onClose, section }: SectionFormModalProps) {
  const isEditing = !!section;
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Section>({
    name: section?.name || "",
    description: section?.description || "",
    active: section?.active !== undefined ? section.active : true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: Section) => {
      const res = await apiRequest("POST", "/api/sports-sections", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sports-sections"] });
      toast({
        title: "Секция создана",
        description: "Новая спортивная секция успешно добавлена",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать секцию: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Section) => {
      const res = await apiRequest("PATCH", `/api/sports-sections/${section?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sports-sections"] });
      toast({
        title: "Секция обновлена",
        description: "Данные спортивной секции успешно обновлены",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить секцию: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Редактирование секции" : "Добавление секции"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Описание
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3 min-h-20"
                placeholder="Краткое описание спортивной секции"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Отмена
            </Button>
            <Button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}