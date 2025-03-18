import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2 } from "lucide-react";

type BranchWithSchedule = {
  id: number;
  name: string;
  address: string;
  schedule: string; // JSON строка
};

export default function TrialRequestPage() {
  const { toast } = useToast();

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
    queryKey: ["/api/branches-by-section", sectionId],
    enabled: !!sectionId,
  });

  const selectedBranch = branchesForSection?.find(
    (branch) => branch.id === Number(form.watch("branchId"))
  );

  // Parse schedule JSON if branch is selected
  const schedule = selectedBranch ? JSON.parse(selectedBranch.schedule) : null;

  const createTrialRequestMutation = useMutation({
    mutationFn: async (data: InsertTrialRequest) => {
      const res = await apiRequest("POST", "/api/trial-requests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Заявка отправлена",
        description: "Мы свяжемся с вами для подтверждения пробного занятия",
      });
      form.reset();
    },
    onError: (error: Error) => {
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
            <form onSubmit={form.handleSubmit((data) => createTrialRequestMutation.mutate(data))} className="space-y-4">
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
                        type="text"
                        placeholder="Введите возраст"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
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
                      <Input placeholder="+7XXXXXXXXXX" {...field} />
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
                        field.onChange(parseInt(value));
                        form.setValue("branchId", undefined);
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
                        onValueChange={(value) => field.onChange(parseInt(value))}
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
              {schedule && (
                <div className="space-y-2 border rounded-md p-4 bg-muted/50">
                  <h4 className="text-sm font-medium">Расписание занятий:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {Object.entries(schedule).map(([day, times]) => (
                      <div key={day} className="flex justify-between">
                        <span>{day}:</span>
                        <span>{Array.isArray(times) ? times.join(" - ") : times}</span>
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
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
    </div>
  );
}