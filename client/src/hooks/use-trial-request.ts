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
  childName: z.string().min(2, "Введите имя ребенка"),
  childAge: z.number().min(3, "Минимальный возраст 3 года").max(18, "Максимальный возраст 18 лет"),
  parentName: z.string().min(2, "Введите ФИО родителя"),
  parentPhone: z.string().regex(/^\+7\d{10}$/, "Телефон должен быть в формате +7XXXXXXXXXX"),
  sectionId: z.number().positive("Выберите секцию"),
  branchId: z.number().positive("Выберите отделение"),
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
      childAge: undefined as any, // будет преобразовано в число при отправке
      parentName: "",
      parentPhone: "+7",
      sectionId: undefined as any, // будет преобразовано в число при отправке
      branchId: undefined as any, // будет преобразовано в число при отправке
      desiredDate: `${new Date().toISOString().split('T')[0]}T17:30:00.000Z`,
      consentToDataProcessing: false,
    },
    mode: "onChange", // Включаем валидацию при изменении полей
  });

  // Получаем все секции и выводим их в консоль для отладки
  const sectionsQuery = useQuery({
    queryKey: ["/api/sports-sections"],
  });
  
  const sections = sectionsQuery.data;
  const sectionsLoading = sectionsQuery.isLoading;
  
  // Добавим логирование вместо useEffect для простоты
  console.log('Sections query status:', sectionsQuery.status);
  if (sectionsQuery.isSuccess) {
    console.log('Sections data loaded:', sections);
  }
  if (sectionsQuery.isError) {
    console.error('Failed to load sections:', sectionsQuery.error);
  }

  // Получаем филиалы с расписанием для выбранной секции
  const sectionId = form.watch("sectionId");
  console.log('Current section ID for branch query:', sectionId);
  
  const branchQuery = useQuery({
    queryKey: ["/api/branches-by-section", sectionId],
    enabled: !!sectionId,
    queryFn: async () => {
      if (!sectionId) return [];
      console.log('Fetching branches for section ID:', sectionId);
      const res = await apiRequest("GET", `/api/branches-by-section?sectionId=${sectionId}`);
      const data = await res.json();
      console.log('Branches data received:', data);
      return data;
    },
  });
  
  const branchesForSection = branchQuery.data || [];
  const branchesLoading = branchQuery.isLoading;
  
  // Логирование состояния запроса филиалов
  console.log('Branch query status:', branchQuery.status);
  if (branchQuery.isError) {
    console.error('Failed to load branches:', branchQuery.error);
  }

  // Мутация для отправки заявки на пробное занятие
  const createTrialRequestMutation = useMutation({
    mutationFn: async (data: ExtendedTrialRequestForm) => {
      console.log('Отправка данных формы:', data);
      
      try {
        const res = await apiRequest("POST", "/api/trial-requests", {
          ...data,
          childAge: Number(data.childAge),
          sectionId: Number(data.sectionId),
          branchId: data.branchId ? Number(data.branchId) : undefined,
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
    console.log('Form submit handler called with data:', data);
    console.log('Form validation errors:', form.formState.errors);
    
    // Проверяем обязательные поля
    if (!data.childName || data.childName.trim() === '') {
      toast({
        title: "Ошибка отправки",
        description: "Введите имя ребенка",
        variant: "destructive",
      });
      return;
    }
    
    // Проверяем возраст
    if (!data.childAge) {
      toast({
        title: "Ошибка отправки",
        description: "Укажите возраст ребенка",
        variant: "destructive",
      });
      return;
    }
    
    // Проверяем согласие на обработку данных
    if (!privacyAccepted) {
      toast({
        title: "Ошибка отправки",
        description: "Для отправки заявки необходимо согласие на обработку персональных данных",
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
        description: "Выберите филиал",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Форматируем дату в UTC
      const desiredDate = new Date(data.desiredDate);
      const utcDate = new Date(Date.UTC(
        desiredDate.getFullYear(),
        desiredDate.getMonth(),
        desiredDate.getDate(),
        desiredDate.getHours(),
        desiredDate.getMinutes()
      ));

      // Убедимся, что все данные имеют правильный тип перед отправкой
      const formData = {
        ...data,
        consentToDataProcessing: privacyAccepted,
        childName: data.childName.trim(),
        childAge: Number(data.childAge),
        parentName: data.parentName.trim(),
        parentPhone: data.parentPhone,
        sectionId: Number(data.sectionId),
        branchId: Number(data.branchId), // Преобразовываем к числу, так как мы уже проверили наличие branchId выше
        desiredDate: utcDate.toISOString(),
        notes: data.notes
      };

      console.log('Отправка данных:', formData);
      const result = await createTrialRequestMutation.mutateAsync(formData);
      console.log('Ответ сервера:', result);
      
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