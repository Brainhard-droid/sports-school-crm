import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertTrialRequest, insertTrialRequestSchema } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { getNextLessonDates, parseScheduleFromText } from "@/lib/utils/schedule";

type BranchWithSchedule = {
  id: number;
  name: string;
  address: string;
  schedule: string;
};

export default function TrialRequestPage() {
  const { toast } = useToast();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const form = useForm<InsertTrialRequest>({
    resolver: zodResolver(insertTrialRequestSchema),
    defaultValues: {
      childName: "",
      childAge: undefined,
      parentName: "",
      parentPhone: "+7",
      sectionId: undefined,
      branchId: undefined,
      desiredDate: undefined,
    },
  });

  // Fetch sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/sports-sections"],
  });

  // Fetch branches with schedule based on selected section
  const sectionId = form.watch("sectionId");
  const { data: branchesForSection, isLoading: branchesLoading } = useQuery<BranchWithSchedule[]>({
    queryKey: ["branches-by-section", sectionId],
    enabled: !!sectionId,
    queryFn: async ({ queryKey }) => {
      const [, sectionId] = queryKey;
      const res = await apiRequest("GET", `/api/branches-by-section?sectionId=${sectionId}`);
      return res.json();
    },
  });

  const selectedBranch = branchesForSection?.find(
    (branch) => branch.id === Number(form.watch("branchId"))
  );

  // Обновляем доступные даты при изменении филиала
  useEffect(() => {
    if (selectedBranch?.schedule) {
      try {
        console.log('Processing schedule for branch:', selectedBranch);
        const scheduleData = JSON.parse(selectedBranch.schedule);
        console.log('Parsed schedule data:', scheduleData);
        
        // Преобразуем расписание в формат для парсера
        const scheduleText = Object.entries(scheduleData)
          .filter(([_, time]) => time && String(time).trim() !== '')
          .map(([day, time]) => `${day}: ${time}`)
          .join('\n');
        
        console.log('Schedule text for parsing:', scheduleText);
        
        const parsedSchedule = parseScheduleFromText(scheduleText);
        console.log('Parsed schedule:', parsedSchedule);
        
        const nextDates = getNextLessonDates(parsedSchedule, 5);
        console.log('Generated next dates:', nextDates);
        
        setAvailableDates(nextDates);
        
        // Автоматически устанавливаем первую доступную дату
        if (nextDates.length > 0) {
          form.setValue('desiredDate', nextDates[0]);
        }
      } catch (error) {
        console.error('Error processing schedule:', error);
        setAvailableDates([]);
      }
    } else {
      console.log('No schedule available for branch');
      setAvailableDates([]);
    }
  }, [selectedBranch, form]);

  const createTrialRequestMutation = useMutation({
    mutationFn: async (data: InsertTrialRequest) => {
      console.log('Submitting data:', data);
      const res = await apiRequest("POST", "/api/trial-requests", {
        ...data,
        childAge: Number(data.childAge),
        sectionId: Number(data.sectionId),
        branchId: Number(data.branchId),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Ошибка при отправке заявки');
      }

      return res.json();
    },
    onSuccess: () => {
      setShowSuccessModal(true);
      form.reset({
        childName: "",
        childAge: undefined,
        parentName: "",
        parentPhone: "+7",
        sectionId: undefined,
        branchId: undefined,
        desiredDate: undefined,
      });
    },
    onError: (error: Error) => {
      console.error('Form submission error:', error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (sectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Запись на пробное занятие</CardTitle>
          <CardDescription>
            Заполните форму, и мы свяжемся с вами для подтверждения пробного занятия
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                console.log('Form data before submission:', data);
                createTrialRequestMutation.mutate(data);
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="childName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ФИО ребёнка</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите ФИО ребёнка" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="childAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Возраст</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Введите возраст"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
                        min="3"
                        max="18"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ФИО родителя</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите ФИО родителя" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон родителя</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+7XXXXXXXXXX"
                        {...field}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith('+7')) {
                            value = '+7' + value.replace(/[^\d]/g, '');
                          } else {
                            value = value.replace(/[^\d+]/g, '');
                          }
                          value = value.slice(0, 12);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Секция</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value ? parseInt(value) : undefined);
                        form.setValue("branchId", undefined);
                        form.setValue("desiredDate", undefined);
                      }}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите секцию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections?.map((section) => (
                          <SelectItem
                            key={section.id}
                            value={section.id.toString()}
                          >
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {sectionId && !branchesLoading && (
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Отделение</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value ? parseInt(value) : undefined);
                          form.setValue("desiredDate", undefined);
                        }}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите отделение" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branchesForSection?.map((branch) => (
                            <SelectItem
                              key={branch.id}
                              value={branch.id.toString()}
                            >
                              {branch.name} - {branch.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {selectedBranch?.schedule && (
                <FormField
                  control={form.control}
                  name="desiredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Выберите дату пробного занятия</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите дату занятия" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDates.map((date) => (
                            <SelectItem key={date} value={date}>
                              {new Date(date).toLocaleString('ru-RU', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {selectedBranch?.schedule && (
                <div className="space-y-2 border rounded-md p-4 bg-muted/50">
                  <h4 className="text-sm font-medium">Расписание занятий:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {Object.entries(JSON.parse(selectedBranch.schedule))
                      .filter(([_, time]) => time) // Показываем только дни с указанным временем
                      .map(([day, times]) => (
                        <div key={day} className="flex justify-between">
                          <span>{day}:</span>
                          <span>{times}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={createTrialRequestMutation.isPending}
              >
                {createTrialRequestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  "Отправить заявку"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Заявка успешно отправлена
            </DialogTitle>
            <DialogDescription>
              Мы свяжемся с вами в ближайшее время для подтверждения пробного занятия
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}