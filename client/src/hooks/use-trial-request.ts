import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertTrialRequest, insertTrialRequestSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { z } from "zod";

/**
 * Расширенная схема валидации для формы пробного занятия
 * Соответствует принципу Single Responsibility - отвечает только за валидацию
 */
const extendedTrialRequestSchema = insertTrialRequestSchema.extend({
  consentToDataProcessing: z.boolean().refine(val => val === true, {
    message: 'Необходимо согласие на обработку персональных данных',
  }),
});

/**
 * Тип для расширенной формы запроса пробного занятия
 */
export type ExtendedTrialRequestForm = z.infer<typeof extendedTrialRequestSchema>;

/**
 * Хук для управления формой пробного занятия
 * Следует принципу Single Responsibility - отвечает только за логику формы
 */
export function useTrialRequest() {
  const { toast } = useToast();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [selectedDateValue, setSelectedDateValue] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Инициализируем форму с расширенной схемой валидации
  const form = useForm<ExtendedTrialRequestForm>({
    resolver: zodResolver(extendedTrialRequestSchema),
    defaultValues: {
      childName: "",
      childAge: "",
      parentName: "",
      parentPhone: "+7",
      sectionId: "",
      branchId: "",
      desiredDate: `${new Date().toISOString().split('T')[0]}T17:30:00.000Z`,
      consentToDataProcessing: false,
    },
  });

  // Получаем все секции
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/sections"],
  });

  // Получаем филиалы с расписанием для выбранной секции
  const sectionId = form.watch("sectionId");
  const { data: branchesForSection = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/branches-by-section", sectionId],
    enabled: !!sectionId,
    queryFn: async () => {
      if (!sectionId) return [];
      const res = await apiRequest("GET", `/api/branches-by-section?sectionId=${sectionId}`);
      return await res.json();
    },
  });

  // Мутация для отправки заявки на пробное занятие
  const createTrialRequestMutation = useMutation({
    mutationFn: async (data: ExtendedTrialRequestForm) => {
      console.log('Отправка данных формы:', data);
      
      try {
        const res = await apiRequest("POST", "/api/trial-requests", {
          ...data,
          childAge: Number(data.childAge),
          sectionId: Number(data.sectionId),
          branchId: Number(data.branchId),
        });
        
        return await res.json();
      } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Заявка успешно отправлена');
      setShowSuccessModal(true);
      form.reset();
      setPrivacyAccepted(false);
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      console.error('Ошибка при отправке заявки:', error);
      toast({
        title: "Ошибка при отправке заявки",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  /**
   * Обработчик отправки формы с защитой от двойной отправки
   */
  const handleSubmit = form.handleSubmit(async (data) => {
    if (isSubmitting || !privacyAccepted) {
      toast({
        title: "Ошибка отправки",
        description: !privacyAccepted 
          ? "Для отправки заявки необходимо согласие на обработку персональных данных"
          : "Форма уже отправляется",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = {
        ...data,
        consentToDataProcessing: privacyAccepted,
        childAge: Number(data.childAge),
        sectionId: Number(data.sectionId),
        branchId: Number(data.branchId),
        desiredDate: new Date(data.desiredDate).toISOString()
      };

      console.log('Sending form data:', formData);
      const result = await createTrialRequestMutation.mutateAsync(formData);
      console.log('Response:', result);
      
      setShowSuccessModal(true);
      form.reset();
      setPrivacyAccepted(false);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при отправке формы",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  /**
   * Обработчик выбора даты из предложенных
   */
  const handleDateSelection = (dateStr: string, timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes);
    form.setValue("desiredDate", date.toISOString());
    setSelectedDateValue(dateStr);
    setUseCustomDate(false);
  };

  /**
   * Обработчик ввода произвольной даты
   */
  const handleCustomDateChange = (date: string) => {
    form.setValue("desiredDate", new Date(date).toISOString());
    setSelectedDateValue(null);
    setUseCustomDate(true);
  };

  return {
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
  };
}