import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertTrialRequest, insertTrialRequestSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getResponseData } from "@/lib/api";
import { z } from "zod";
import { webSocketService } from "@/services/WebSocketService";

/**
 * Расширенная схема валидации для формы пробного занятия
 * Добавляет обязательные поля для серверной валидации
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
 * Класс для работы с API заявок на пробное занятие
 * Соответствует принципу Interface Segregation - предоставляет только необходимые методы
 */
export class TrialRequestService {
  /**
   * Создает новую заявку на пробное занятие
   * @param data Данные заявки
   * @returns Promise с созданной заявкой
   */
  static async createTrialRequest(data: ExtendedTrialRequestForm): Promise<any> {
    console.log('TrialRequestService.createTrialRequest вызван с данными:', data);
    
    try {
      const res = await apiRequest("POST", "/api/trial-requests", {
        ...data,
        childAge: Number(data.childAge),
        sectionId: Number(data.sectionId),
        branchId: Number(data.branchId),
      });
      
      return await getResponseData(res);
    } catch (error) {
      console.error('TrialRequestService.createTrialRequest ошибка:', error);
      throw error;
    }
  }

  /**
   * Получает все секции
   * @returns Promise с секциями
   */
  static async getSections(): Promise<any[]> {
    try {
      const res = await apiRequest("GET", "/api/sections");
      return await getResponseData(res);
    } catch (error) {
      console.error('Ошибка при получении секций:', error);
      return [];
    }
  }

  /**
   * Получает филиалы для указанной секции
   * @param sectionId ID секции
   * @returns Promise с филиалами
   */
  static async getBranchesBySection(sectionId: number): Promise<any[]> {
    if (!sectionId) return [];
    
    try {
      const res = await apiRequest("GET", `/api/branches-by-section?sectionId=${sectionId}`);
      return await getResponseData(res);
    } catch (error) {
      console.error(`Ошибка при получении филиалов для секции ${sectionId}:`, error);
      return [];
    }
  }
}

/**
 * Хук для управления формой пробного занятия
 * Следует принципам SOLID:
 * - Single Responsibility: отвечает только за логику формы
 * - Open/Closed: расширяемый через состояние и опции
 * - Liskov Substitution: возвращает предсказуемый интерфейс
 * - Interface Segregation: предоставляет минимально необходимый набор методов
 * - Dependency Inversion: зависит от абстракций (TrialRequestService), а не конкретных реализаций
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
      childAge: undefined,
      parentName: "",
      parentPhone: "+7",
      sectionId: undefined,
      branchId: undefined,
      desiredDate: `${new Date().toISOString().split('T')[0]}T17:30:00.000Z`,
      consentToDataProcessing: false,
    },
  });

  // Fetch sections - используем TrialRequestService для получения данных
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/sections"],
    queryFn: TrialRequestService.getSections,
  });

  // Fetch branches with schedule based on selected section
  const sectionId = form.watch("sectionId");
  const { data: branchesForSection = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/branches-by-section", sectionId],
    enabled: !!sectionId,
    queryFn: () => TrialRequestService.getBranchesBySection(Number(sectionId)),
  });

  // Мутация для отправки заявки на пробное занятие через TrialRequestService
  const createTrialRequestMutation = useMutation({
    mutationFn: TrialRequestService.createTrialRequest,
    onSuccess: () => {
      console.log('Мутация успешно выполнена');
      setShowSuccessModal(true);
      form.reset();
      setPrivacyAccepted(false);
      setIsSubmitting(false);
      
      // Уведомляем администраторов через WebSocket
      if (webSocketService.isConnected()) {
        webSocketService.send({
          type: 'notification',
          content: 'Поступила новая заявка на пробное занятие'
        });
      }
    },
    onError: (error: Error) => {
      console.error('Form submission error:', error);
      toast({
        title: "Ошибка при отправке заявки",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Старт WebSocket соединения при инициализации хука
  useEffect(() => {
    webSocketService.connect();
  }, []);

  /**
   * Обработчик отправки формы с защитой от двойной отправки
   */
  const handleSubmit = form.handleSubmit((data) => {
    console.log('handleSubmit вызван с данными:', data);
    
    // Защита от повторной отправки
    if (isSubmitting) {
      console.log('Форма уже отправляется, игнорируем повторный запрос');
      return;
    }
    
    // Устанавливаем флаг отправки
    setIsSubmitting(true);
    
    // Устанавливаем согласие на обработку данных
    data.consentToDataProcessing = privacyAccepted;
    console.log('Согласие на обработку данных:', privacyAccepted);
    
    if (!data.consentToDataProcessing) {
      console.log('Согласие не дано, прерываем отправку');
      toast({
        title: "Необходимо согласие",
        description: "Для отправки заявки необходимо согласие на обработку персональных данных",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    console.log('Вызываем мутацию с данными:', data);
    try {
      createTrialRequestMutation.mutate(data);
      console.log('Мутация вызвана');
    } catch (error) {
      console.error('Ошибка при вызове мутации:', error);
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