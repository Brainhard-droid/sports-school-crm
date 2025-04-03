import { useState, useEffect, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, Calendar } from "lucide-react";
import ErrorBoundary from "@/components/error-boundary";
import { getNextLessonDates, formatDateTime } from "@/lib/utils/schedule";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function TrialRequestPage() {
  const { toast } = useToast();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [suggestedDates, setSuggestedDates] = useState<{date: Date, timeLabel: string}[]>([]);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [selectedDateValue, setSelectedDateValue] = useState<string | null>(null);
  const isProcessingDateSelection = useRef(false);
  const isInitialMount = useRef(true);

  const form = useForm<InsertTrialRequest>({
    resolver: zodResolver(insertTrialRequestSchema),
    defaultValues: {
      childName: "",
      childAge: undefined,
      parentName: "",
      parentPhone: "+7",
      sectionId: undefined,
      branchId: undefined,
      desiredDate: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/sports-sections"],
  });

  // Fetch branches with schedule based on selected section
  const sectionId = form.watch("sectionId");
  const { data: branchesForSection = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["branches-by-section", sectionId],
    enabled: !!sectionId,
    queryFn: async () => {
      if (!sectionId) return [];
      const res = await apiRequest("GET", `/api/branches-by-section?sectionId=${sectionId}`);
      return res.json();
    },
  });

  const branchId = form.watch("branchId");
  const selectedBranch = branchesForSection?.find(
    (branch: { id: number }) => branch.id === Number(branchId)
  );

  // Безопасно парсим JSON расписания, проверяя на null/undefined
  const schedule = (() => {
    try {
      if (!selectedBranch?.schedule) return null;
      return JSON.parse(selectedBranch.schedule);
    } catch (e) {
      console.error("Ошибка при парсинге расписания:", e);
      return null;
    }
  })();
  
  // Генерировать ближайшие даты на основе расписания при изменении филиала
  useEffect(() => {
    if (schedule) {
      const formattedSchedule = Object.entries(schedule).reduce((acc, [day, times]) => {
        if (typeof times === 'string') {
          acc[day] = times;
        } else if (Array.isArray(times)) {
          acc[day] = times.join(' - ');
        }
        return acc;
      }, {} as Record<string, string>);
      
      const nextDates = getNextLessonDates(formattedSchedule, 5);
      setSuggestedDates(nextDates);
      
      // Устанавливаем значение по умолчанию только при первом монтировании
      if (isInitialMount.current && nextDates.length > 0) {
        const defaultDateStr = format(nextDates[0].date, "yyyy-MM-dd");
        form.setValue("desiredDate", defaultDateStr);
        setSelectedDateValue(defaultDateStr);
        setUseCustomDate(false);
        isInitialMount.current = false;
      }
    } else {
      setSuggestedDates([]);
      if (isInitialMount.current) {
        setSelectedDateValue(null);
        isInitialMount.current = false;
      }
    }
  }, [schedule, form]);

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
      form.reset();
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

  return (
    <ErrorBoundary>
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
                          const numValue = parseInt(value);
                          field.onChange(numValue);
                          // Для TypeScript сделаем явное приведение типа к null вместо undefined
                          form.setValue("branchId", null as any);
                        }}
                        value={field.value?.toString()}
                        disabled={sectionsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите секцию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections && Array.isArray(sections) ? sections.map((section: { id: number, name: string }) => (
                            <SelectItem
                              key={section.id}
                              value={section.id.toString()}
                            >
                              {section.name}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {sectionId && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Отделение</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={branchesLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите отделение" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branchesForSection && Array.isArray(branchesForSection) ? branchesForSection.map((branch: { id: number, name: string, address: string }) => (
                              <SelectItem
                                key={branch.id}
                                value={branch.id.toString()}
                              >
                                {branch.name} - {branch.address}
                              </SelectItem>
                            )) : null}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {schedule && (
                  <div className="space-y-2 border rounded-md p-4 bg-muted/50">
                    <h4 className="text-sm font-medium">Расписание занятий:</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {Object.entries(schedule).map(([day, times]) => (
                        <div key={day} className="flex justify-between">
                          <span>{day}:</span>
                          <span>{Array.isArray(times) ? times.join(" - ") : String(times)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="desiredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Желаемая дата занятия</FormLabel>
                      {suggestedDates.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-2">
                            {suggestedDates.map((item, index) => {
                              const dateStr = format(item.date, "yyyy-MM-dd");
                              // Используем состояние selectedDateValue для определения выбора
                              const isSelected = !useCustomDate && (
                                selectedDateValue === dateStr || 
                                (!selectedDateValue && field.value === dateStr)
                              );
                              
                              return (
                                <div 
                                  key={index} 
                                  className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                                  onClick={() => {
                                    if (isProcessingDateSelection.current) return;
                                    isProcessingDateSelection.current = true;
                                    
                                    // Установить выбранную дату в состоянии компонента
                                    setSelectedDateValue(dateStr);
                                    
                                    // Установить выбранную дату в форме
                                    form.setValue("desiredDate", dateStr);
                                    
                                    // Сбросить флаг пользовательской даты
                                    setUseCustomDate(false);
                                    
                                    // Через небольшую задержку разрешаем следующий выбор
                                    setTimeout(() => {
                                      isProcessingDateSelection.current = false;
                                    }, 100);
                                  }}
                                >
                                  <div 
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${isSelected ? 'border-primary' : 'border-muted-foreground'}`}
                                  >
                                    {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                                  </div>
                                  <div className="flex-1 flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      {format(item.date, "dd.MM.yyyy")} ({format(item.date, "EEEE")})
                                      <span className="block text-sm text-muted-foreground">
                                        {item.timeLabel}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="space-y-2 pt-2">
                            <div 
                              className="flex items-center space-x-2 cursor-pointer"
                              onClick={() => {
                                if (isProcessingDateSelection.current) return;
                                isProcessingDateSelection.current = true;
                                
                                setUseCustomDate(true);
                                // Сбрасываем выбор из списка предложенных дат
                                setSelectedDateValue(null);
                                
                                // Если дата еще не установлена, устанавливаем текущую
                                if (!field.value) {
                                  form.setValue("desiredDate", new Date().toISOString().split('T')[0]);
                                }
                                
                                setTimeout(() => {
                                  isProcessingDateSelection.current = false;
                                }, 100);
                              }}
                            >
                              <div 
                                className={`flex h-4 w-4 items-center justify-center rounded-full border ${useCustomDate ? 'border-primary' : 'border-muted-foreground'}`}
                              >
                                {useCustomDate && <div className="h-2 w-2 rounded-full bg-primary" />}
                              </div>
                              <Label className="cursor-pointer">
                                Выбрать другую дату
                              </Label>
                            </div>
                            
                            {useCustomDate && (
                              <div className="pl-6 pt-2">
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                    min={new Date().toISOString().split('T')[0]}
                                  />
                                </FormControl>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createTrialRequestMutation.isPending || sectionsLoading || branchesLoading}
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
    </ErrorBoundary>
  );
}