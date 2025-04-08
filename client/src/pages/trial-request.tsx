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

export default function TrialRequestPage() {
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
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <RequestFormFields 
                form={form}
                sections={Array.isArray(sections) ? sections : []}
                sectionId={sectionId}
                branchesForSection={branchesForSection}
                branchesLoading={branchesLoading}
                privacyAccepted={privacyAccepted}
                setPrivacyAccepted={setPrivacyAccepted}
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

              <Button
                type="submit"
                className="w-full"
                disabled={createTrialRequestMutation.isPending || !privacyAccepted}
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

      <SuccessModal 
        open={showSuccessModal} 
        onOpenChange={setShowSuccessModal} 
      />
    </div>
  );
}