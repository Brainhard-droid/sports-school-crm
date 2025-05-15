import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTrialRequest, ExtendedTrialRequestForm } from "@/hooks/use-trial-request";
import { RequestFormFields } from "@/components/trial-request/request-form-fields";
import { ScheduleInfoDisplay } from "@/components/trial-request/schedule-info-display";
import { DateSelection } from "@/components/trial-request/date-selection";
import { SuccessModal } from "@/components/trial-request/success-modal";
import { scheduleService, SessionInfo } from "@/services/ScheduleService";
import { useToast } from "@/hooks/use-toast";
import { PrivacyPolicyCheckbox } from "@/components/trial-request/privacy-policy-checkbox";

/**
 * Страница запроса на пробное занятие.
 * Соответствует принципам SOLID:
 * - Single Responsibility: отвечает только за отображение формы
 * - Open/Closed: расширяемая через компоненты
 * - Dependency Inversion: зависит от абстракций (хуки, сервисы), а не конкретных реализаций
 */
export default function TrialRequestPage() {
  const { toast } = useToast();
  const {
    form,
    sections,
    sectionsLoading,
    branchesForSection,
    branchesLoading,
    createTrialRequestMutation,
    showSuccessModal,
    setShowSuccessModal,
    useCustomDate,
    setUseCustomDate,
    selectedDateValue,
    setSelectedDateValue,
    privacyAccepted,
    setPrivacyAccepted,
    handleSubmit,
    handleDateSelection,
    handleCustomDateChange,
    isSubmitting,
  } = useTrialRequest();

  const [suggestedDates, setSuggestedDates] = useState<SessionInfo[]>([]);
  const sectionId = form.watch("sectionId");
  const branchId = form.watch("branchId");
  const selectedBranch = branchesForSection?.find(
    (branch: { id: number }) => branch.id === Number(branchId)
  );
  
  // Используем ScheduleService для парсинга расписания
  const schedule = selectedBranch?.schedule 
    ? scheduleService.parseSchedule(selectedBranch.schedule)
    : null;

  // Генерируем предложенные даты когда расписание доступно
  useEffect(() => {
    if (schedule) {
      const nextSessions = scheduleService.getNextSessions(schedule, 5);
      setSuggestedDates(nextSessions);
    } else {
      setSuggestedDates([]);
    }
  }, [schedule]);

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
              id="trial-request-form" 
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                console.log('Форма отправлена');
              }}
            >
              <RequestFormFields 
                form={form}
                sections={Array.isArray(sections) ? sections : []}
                sectionId={sectionId}
                branchesForSection={branchesForSection}
                branchesLoading={branchesLoading}
              />

              {schedule && <ScheduleInfoDisplay schedule={schedule} />}

              <DateSelection
                form={form}
                suggestedDates={suggestedDates}
                useCustomDate={useCustomDate}
                selectedDateValue={selectedDateValue}
                onDateSelection={handleDateSelection}
                onCustomDateChange={handleCustomDateChange}
                setUseCustomDate={setUseCustomDate}
              />
              
              {/* Чекбокс согласия на обработку персональных данных всегда в конце формы */}
              <PrivacyPolicyCheckbox
                privacyAccepted={privacyAccepted}
                setPrivacyAccepted={setPrivacyAccepted}
              />

              <Button
                type="button"
                className="w-full"
                disabled={isSubmitting || !privacyAccepted}
                onClick={async () => {
                  console.log('Button click event triggered');
                  console.log('Privacy accepted:', privacyAccepted);
                  console.log('FormState:', form.formState);
                  console.log('Текущие значения формы:', form.getValues());
                  
                  // Предварительная обработка данных
                  const data = form.getValues();
                  
                  // Принудительно устанавливаем значения
                  form.setValue('consentToDataProcessing', privacyAccepted);
                  
                  // Проверяем все обязательные поля
                  if (!data.childName) {
                    toast({
                      title: "Ошибка отправки",
                      description: "Введите имя ребенка",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!data.childAge) {
                    toast({
                      title: "Ошибка отправки",
                      description: "Введите возраст ребенка",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!data.parentName) {
                    toast({
                      title: "Ошибка отправки",
                      description: "Введите имя родителя",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!data.parentPhone || data.parentPhone === '+7') {
                    toast({
                      title: "Ошибка отправки",
                      description: "Введите телефон родителя",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!data.sectionId) {
                    toast({
                      title: "Ошибка отправки",
                      description: "Выберите секцию",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!data.branchId) {
                    toast({
                      title: "Ошибка отправки",
                      description: "Выберите отделение",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!privacyAccepted) {
                    toast({
                      title: "Ошибка отправки",
                      description: "Для отправки заявки необходимо согласие на обработку персональных данных",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Прямой вызов обработчика отправки формы без валидации
                  console.log('Вызываем handleSubmit напрямую');
                  handleSubmit();
                }}
              >
                {isSubmitting || createTrialRequestMutation.isPending ? (
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

      <SuccessModal 
        open={showSuccessModal} 
        onOpenChange={setShowSuccessModal} 
      />
    </div>
  );
}