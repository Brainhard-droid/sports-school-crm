import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";

interface ScheduleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: number;
  sectionId: number;
  branchName: string;
  sectionName: string;
  initialSchedule?: string;
  onScheduleUpdated: () => void;
}

const scheduleFormSchema = z.object({
  schedule: z.string().min(1, "Расписание не может быть пустым"),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export default function ScheduleFormModal({
  open,
  onOpenChange,
  branchId,
  sectionId,
  branchName,
  sectionName,
  initialSchedule = "",
  onScheduleUpdated,
}: ScheduleFormModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      schedule: initialSchedule,
    },
  });

  useEffect(() => {
    form.reset({
      schedule: initialSchedule,
    });
  }, [initialSchedule, form]);

  const handleSubmit = async (values: ScheduleFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/branch-sections/schedule", {
        branchId,
        sectionId,
        schedule: values.schedule,
      });
      
      toast({
        title: "Расписание обновлено",
        description: "Расписание для секции успешно обновлено",
      });
      
      onScheduleUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Ошибка при обновлении расписания:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить расписание. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактирование расписания</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <Label>Филиал:</Label>
          <p className="text-sm mt-1">{branchName}</p>
        </div>
        
        <div className="mb-4">
          <Label>Секция:</Label>
          <p className="text-sm mt-1">{sectionName}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Расписание занятий</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={`Формат: "День: ЧЧ:ММ - ЧЧ:ММ"\nНапример:\nПонедельник: 16:30 - 18:30\nЧетверг: 16:30 - 18:30\nВоскресенье: 11:00 - 13:00`}
                      className="h-32"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}