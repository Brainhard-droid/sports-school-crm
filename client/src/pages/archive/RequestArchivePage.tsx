import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTrialRequests } from "../sales-funnel/hooks/useTrialRequests";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Archive, ArrowUp, ChevronLeft, PieChart, RefreshCw, ThumbsUp, Ban } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { RequestArchiveService, ARCHIVE_MARKERS } from "../sales-funnel/services/RequestArchiveService";

// Тип для статистики по отказам
type RefusalStat = {
  reason: string;
  count: number;
  percentage: number;
};

// Тип для статистики по успешным заявкам
type SuccessStat = {
  section: string;
  count: number;
  percentage: number;
};

/**
 * Функция для безопасного получения имени секции
 * Обрабатывает разные форматы данных поля section
 */
const getSectionName = (section: any): string => {
  if (!section) return 'Не указана';
  
  if (typeof section === 'object' && section !== null) {
    return section.name || 'Не указана';
  }
  
  return String(section);
};

/**
 * Страница архива заявок
 * Отвечает за отображение архивированных заявок (отказов и успешных) и работу с ними
 * Следует принципу единственной ответственности (SRP) из SOLID
 */
export default function RequestArchivePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const { requests = [], isLoading } = useTrialRequests();
  const [activeTab, setActiveTab] = useState<string>("refusals");
  const [refusalSubTab, setRefusalSubTab] = useState<string>("active");
  const [successSubTab, setSuccessSubTab] = useState<string>("active");
  
  // Активные отказы - те, которые еще не заархивированы
  const [activeRefusals, setActiveRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  // Архивированные отказы
  const [archivedRefusals, setArchivedRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  // Старые отказы, которые можно архивировать
  const [oldRefusals, setOldRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  // Активные успешные заявки (статус "Записан", не архивированные)
  const [activeSuccessful, setActiveSuccessful] = useState<ExtendedTrialRequest[]>([]);
  
  // Архивированные успешные заявки
  const [archivedSuccessful, setArchivedSuccessful] = useState<ExtendedTrialRequest[]>([]);
  
  // Старые успешные заявки, которые можно архивировать
  const [oldSuccessful, setOldSuccessful] = useState<ExtendedTrialRequest[]>([]);
  
  // Статистика по отказам
  const [refusalStats, setRefusalStats] = useState<RefusalStat[]>([]);
  
  // Статистика по успешным заявкам
  const [successStats, setSuccessStats] = useState<SuccessStat[]>([]);
  
  // Флаги для отслеживания процессов
  const [archivingIds, setArchivingIds] = useState<number[]>([]);
  const [archivingAllRefusals, setArchivingAllRefusals] = useState(false);
  const [archivingAllSuccessful, setArchivingAllSuccessful] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  
  // Функция для оптимистичного обновления UI при архивировании отказа
  const optimisticRefusalArchiveUpdate = (requestId: number, updatedNotes: string) => {
    // Находим заявку
    const request = activeRefusals.find(r => r.id === requestId);
    if (!request) return;
    
    // Оптимистично обновляем UI - удаляем из активных и добавляем в архивированные
    setActiveRefusals(prev => prev.filter(r => r.id !== requestId));
    
    // Добавляем в список архивированных с оптимистичным обновлением
    const updatedRequest = {
      ...request,
      notes: updatedNotes
    };
    setArchivedRefusals(prev => [updatedRequest, ...prev]);
  };
  
  // Функция для оптимистичного обновления UI при архивировании успешной заявки
  const optimisticSuccessfulArchiveUpdate = (requestId: number, updatedNotes: string) => {
    // Находим заявку
    const request = activeSuccessful.find(r => r.id === requestId);
    if (!request) return;
    
    // Оптимистично обновляем UI - удаляем из активных и добавляем в архивированные
    setActiveSuccessful(prev => prev.filter(r => r.id !== requestId));
    
    // Добавляем в список архивированных с оптимистичным обновлением
    const updatedRequest = {
      ...request,
      notes: updatedNotes
    };
    setArchivedSuccessful(prev => [updatedRequest, ...prev]);
  };
  
  // Функция архивирования заявки с оптимистичным обновлением
  const handleArchiveRefusal = async (request: ExtendedTrialRequest) => {
    // Добавляем ID заявки в список архивируемых
    setArchivingIds(prev => [...prev, request.id]);
    
    try {
      console.log(`Начинаем архивирование заявки ID=${request.id}`);
      
      // Сначала выполняем оптимистичное обновление UI 
      // до выполнения запроса на сервер
      optimisticRefusalArchiveUpdate(request.id, request.notes || '');
      
      // Архивируем заявку на сервере
      const { success, notes } = await RequestArchiveService.archiveRefusal(
        request.id, 
        request.notes || undefined
      );
      
      if (success) {
        console.log(`Заявка ID=${request.id} успешно архивирована`);
        
        // Показываем уведомление об успешном архивировании
        toast({
          title: "Архивирование выполнено",
          description: `Заявка #${request.id} перемещена в архив`,
          variant: "default",
        });
        
        // Обновляем данные с сервера с небольшой задержкой
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
        }, 300); // Уменьшаем задержку для более быстрого обновления
      } else {
        console.error(`Ошибка при архивировании заявки ID=${request.id}`);
        
        // Восстанавливаем состояние при ошибке
        toast({
          title: "Ошибка",
          description: "Не удалось архивировать заявку",
          variant: "destructive",
        });
        
        // Возвращаем оптимистично обновленные данные в исходное состояние
        refreshData();
      }
    } catch (error) {
      console.error('Ошибка при архивировании:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать заявку",
        variant: "destructive",
      });
      
      // Запрашиваем обновленные данные с сервера
      refreshData();
    } finally {
      // Удаляем ID заявки из списка архивируемых
      setArchivingIds(prev => prev.filter(id => id !== request.id));
    }
  };
  
  // Функция архивирования успешной заявки
  const handleArchiveSuccessful = async (request: ExtendedTrialRequest) => {
    // Добавляем ID заявки в список архивируемых
    setArchivingIds(prev => [...prev, request.id]);
    
    try {
      console.log(`Начинаем архивирование успешной заявки ID=${request.id}`);
      
      // Сначала выполняем оптимистичное обновление UI 
      // до выполнения запроса на сервер
      optimisticSuccessfulArchiveUpdate(request.id, request.notes || '');
      
      // Архивируем успешную заявку на сервере
      const { success, notes } = await RequestArchiveService.archiveSuccessfulRequest(
        request.id, 
        request.notes || undefined
      );
      
      if (success) {
        console.log(`Успешная заявка ID=${request.id} архивирована`);
        
        // Показываем уведомление об успешном архивировании
        toast({
          title: "Архивирование выполнено",
          description: `Заявка #${request.id} перемещена в архив успешных`,
          variant: "default",
        });
        
        // Обновляем данные с сервера с небольшой задержкой
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
        }, 300);
      } else {
        console.error(`Ошибка при архивировании успешной заявки ID=${request.id}`);
        
        // Восстанавливаем состояние при ошибке
        toast({
          title: "Ошибка",
          description: "Не удалось архивировать успешную заявку",
          variant: "destructive",
        });
        
        // Возвращаем оптимистично обновленные данные в исходное состояние
        refreshData();
      }
    } catch (error) {
      console.error('Ошибка при архивировании успешной заявки:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать успешную заявку",
        variant: "destructive",
      });
      
      // Запрашиваем обновленные данные с сервера
      refreshData();
    } finally {
      // Удаляем ID заявки из списка архивируемых
      setArchivingIds(prev => prev.filter(id => id !== request.id));
    }
  };
  
  // Функция архивирования всех активных отказов
  const handleArchiveAllRefusals = async () => {
    if (activeRefusals.length === 0) return;
    
    if (!confirm(`Вы уверены, что хотите архивировать все ${activeRefusals.length} отказов?`)) {
      return;
    }
    
    // Устанавливаем флаг массового архивирования
    setArchivingAllRefusals(true);
    
    try {
      console.log(`Начинаем архивирование ${activeRefusals.length} отказов`);
      
      // Сохраняем копию активных отказов для дальнейшего использования
      const refusalsToArchive = [...activeRefusals];
      
      // Оптимистично обновляем UI ДО запроса на сервер:
      // Подготавливаем заявки с маркером архивирования
      const updatedRequests = refusalsToArchive.map(request => ({
        ...request,
        notes: `${request.notes || ''} ${RequestArchiveService.getArchiveMarker()}`
      }));
      
      // Сначала добавляем в архивированные, затем очищаем активные
      setArchivedRefusals(prev => [...updatedRequests, ...prev]);
      setActiveRefusals([]);
      
      // Архивируем на сервере
      const archivedCount = await RequestArchiveService.archiveBatch(refusalsToArchive);
      
      console.log(`Успешно архивировано: ${archivedCount} из ${refusalsToArchive.length}`);
      
      // Показываем уведомление об успешном архивировании
      toast({
        title: "Архивирование выполнено",
        description: `Архивировано ${archivedCount} из ${refusalsToArchive.length} заявок`,
        variant: archivedCount > 0 ? "default" : "destructive",
      });
      
      // Обновляем данные запросов с сервера БЕЗ обновления UI
      // чтобы избежать мерцания
      if (archivedCount > 0) {
        // Только инвалидируем запрос, но не обновляем UI сразу
        queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      }
    } catch (error) {
      console.error('Ошибка при массовом архивировании:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать заявки",
        variant: "destructive",
      });
      
      // Запрашиваем обновленные данные с сервера
      refreshData();
    } finally {
      // Сбрасываем флаг массового архивирования
      setArchivingAllRefusals(false);
    }
  };
  
  // Функция архивирования всех активных успешных заявок
  const handleArchiveAllSuccessful = async () => {
    if (activeSuccessful.length === 0) return;
    
    if (!confirm(`Вы уверены, что хотите архивировать все ${activeSuccessful.length} успешных заявок?`)) {
      return;
    }
    
    // Устанавливаем флаг массового архивирования
    setArchivingAllSuccessful(true);
    
    try {
      console.log(`Начинаем архивирование ${activeSuccessful.length} успешных заявок`);
      
      // Сохраняем копию активных успешных заявок для дальнейшего использования
      const successfulToArchive = [...activeSuccessful];
      
      // Оптимистично обновляем UI ДО запроса на сервер:
      // Подготавливаем заявки с маркером архивирования
      const updatedRequests = successfulToArchive.map(request => ({
        ...request,
        notes: `${request.notes || ''} ${RequestArchiveService.getSuccessMarker()} ${RequestArchiveService.getArchiveMarker()}`
      }));
      
      // Сначала добавляем в архивированные, затем очищаем активные
      setArchivedSuccessful(prev => [...updatedRequests, ...prev]);
      setActiveSuccessful([]);
      
      // Архивируем на сервере
      const archivedCount = await RequestArchiveService.archiveSuccessfulBatch(successfulToArchive);
      
      console.log(`Успешно архивировано: ${archivedCount} из ${successfulToArchive.length}`);
      
      // Показываем уведомление об успешном архивировании
      toast({
        title: "Архивирование выполнено",
        description: `Архивировано ${archivedCount} из ${successfulToArchive.length} успешных заявок`,
        variant: archivedCount > 0 ? "default" : "destructive",
      });
      
      // Обновляем данные запросов с сервера БЕЗ обновления UI
      // чтобы избежать мерцания
      if (archivedCount > 0) {
        // Только инвалидируем запрос, но не обновляем UI сразу
        queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      }
    } catch (error) {
      console.error('Ошибка при массовом архивировании успешных заявок:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать успешные заявки",
        variant: "destructive",
      });
      
      // Запрашиваем обновленные данные с сервера
      refreshData();
    } finally {
      // Сбрасываем флаг массового архивирования
      setArchivingAllSuccessful(false);
    }
  };
  
  // Функция восстановления заявки из архива
  const handleRestoreRequest = async (request: ExtendedTrialRequest) => {
    setRestoring(request.id);
    
    try {
      console.log(`Восстановление заявки ID=${request.id} из архива`);
      
      // Оптимистично обновляем UI: удаляем из архивированных
      if (request.status === "REFUSED") {
        setArchivedRefusals(prev => prev.filter(r => r.id !== request.id));
      } else if (request.status === "SIGNED") {
        setArchivedSuccessful(prev => prev.filter(r => r.id !== request.id));
      }
      
      // Восстанавливаем заявку на сервере
      const { success } = await RequestArchiveService.restoreFromArchive(request.id);
      
      if (success) {
        console.log(`Заявка ID=${request.id} успешно восстановлена из архива`);
        
        toast({
          title: "Восстановление выполнено",
          description: `Заявка #${request.id} возвращена в активные`,
          variant: "default",
        });
        
        // Обновляем данные с сервера
        refreshData();
      } else {
        console.error(`Ошибка при восстановлении заявки ID=${request.id}`);
        
        toast({
          title: "Ошибка",
          description: "Не удалось восстановить заявку",
          variant: "destructive",
        });
        
        // Возвращаем оптимистично обновленные данные в исходное состояние
        refreshData();
      }
    } catch (error) {
      console.error('Ошибка при восстановлении заявки:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить заявку",
        variant: "destructive",
      });
      
      // Запрашиваем обновленные данные с сервера
      refreshData();
    } finally {
      setRestoring(null);
    }
  };
  
  // Функция обновления данных
  const refreshData = useCallback(() => {
    // Обновляем данные с сервера
    queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
    
    toast({
      title: "Данные обновлены",
      description: "Информация об архиве заявок актуализирована",
      variant: "default",
    });
  }, [queryClient, toast]);
  
  // Функция принудительного обновления данных
  const forceRefresh = () => {
    refreshData();
  };
  
  // Эффект для обработки изменений в заявках
  useEffect(() => {
    if (!requests || !requests.length) return;
    
    // Обрабатываем заявки
    console.log(`Обработка ${requests.length} заявок...`);
    
    // Разделяем заявки на отказы и успешные
    const refusals: ExtendedTrialRequest[] = [];
    const successful: ExtendedTrialRequest[] = [];
    
    requests.forEach(request => {
      // Создаем клон заявки, чтобы не мутировать оригинальные данные
      const cleanedRequest = {
        ...request,
        // Очищаем примечания от всех технических меток для отображения
        notes: RequestArchiveService.cleanNotesForDisplay(request.notes || '')
      };
      
      if (request.status === "REFUSED") {
        refusals.push(cleanedRequest);
      } else if (request.status === "SIGNED") {
        successful.push(cleanedRequest);
      }
    });
    
    // Делим отказы на активные и архивированные
    const activeRefusalsList: ExtendedTrialRequest[] = [];
    const archivedRefusalsList: ExtendedTrialRequest[] = [];
    
    refusals.forEach(request => {
      // Используем сервис для точной проверки архивирования на ОРИГИНАЛЬНОЙ заявке
      const originalRequest = requests.find(r => r.id === request.id);
      if (originalRequest) {
        const isArchived = RequestArchiveService.isArchived(originalRequest);
        if (isArchived) {
          archivedRefusalsList.push(request);
        } else {
          activeRefusalsList.push(request);
        }
      }
    });
    
    // Делим успешные заявки на активные и архивированные
    const activeSuccessfulList: ExtendedTrialRequest[] = [];
    const archivedSuccessfulList: ExtendedTrialRequest[] = [];
    
    successful.forEach(request => {
      // Используем сервис для точной проверки архивирования на ОРИГИНАЛЬНОЙ заявке
      const originalRequest = requests.find(r => r.id === request.id);
      if (originalRequest) {
        const isArchived = RequestArchiveService.isArchived(originalRequest);
        if (isArchived) {
          archivedSuccessfulList.push(request);
        } else {
          activeSuccessfulList.push(request);
        }
      }
    });
    
    // Отбираем старые отказы для архивирования
    const oldRefusalsList = RequestArchiveService.filterOldRefusals(activeRefusalsList, 5);
    
    // Отбираем старые успешные заявки для архивирования
    const oldSuccessfulList = RequestArchiveService.filterOldSuccessful(activeSuccessfulList, 3);
    
    // Устанавливаем очищенные данные в состояние
    setActiveRefusals(activeRefusalsList);
    setArchivedRefusals(archivedRefusalsList);
    setOldRefusals(oldRefusalsList);
    
    setActiveSuccessful(activeSuccessfulList);
    setArchivedSuccessful(archivedSuccessfulList);
    setOldSuccessful(oldSuccessfulList);
    
    // Обрабатываем статистику отказов
    if (archivedRefusalsList.length > 0) {
      // Группируем отказы по причинам
      const reasonGroups: { [key: string]: number } = {};
      
      archivedRefusalsList.forEach(request => {
        const notes = request.notes || '';
        // Простой алгоритм определения причины - первая строка примечаний
        // или ключевые слова
        let reason = 'Не указана';
        
        if (notes) {
          // Попытка определить причину из примечаний
          const firstLine = notes.split('\n')[0].trim();
          reason = firstLine || 'Не указана';
          
          // Если первая строка слишком длинная, ограничиваем её
          if (reason.length > 50) {
            reason = reason.substring(0, 47) + '...';
          }
        }
        
        reasonGroups[reason] = (reasonGroups[reason] || 0) + 1;
      });
      
      // Преобразуем в массив и сортируем по убыванию количества
      const sortedReasons = Object.entries(reasonGroups)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: Math.round((count / archivedRefusalsList.length) * 100)
        }))
        .sort((a, b) => b.count - a.count);
      
      setRefusalStats(sortedReasons);
    } else {
      setRefusalStats([]);
    }
    
    // Обрабатываем статистику успешных заявок
    if (archivedSuccessfulList.length > 0) {
      // Группируем успешные заявки по секции/направлению
      const sectionGroups: { [key: string]: number } = {};
      
      archivedSuccessfulList.forEach(request => {
        // Используем вспомогательную функцию для получения имени секции
        const sectionName = getSectionName(request.section);
        
        sectionGroups[sectionName] = (sectionGroups[sectionName] || 0) + 1;
      });
      
      // Преобразуем в массив и сортируем по убыванию количества
      const sortedSections = Object.entries(sectionGroups)
        .map(([section, count]) => ({
          section,
          count,
          percentage: Math.round((count / archivedSuccessfulList.length) * 100)
        }))
        .sort((a, b) => b.count - a.count);
      
      setSuccessStats(sortedSections);
    } else {
      setSuccessStats([]);
    }
    
  }, [requests, queryClient]);

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Архив заявок</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={forceRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
          <Button 
            variant="outline"
            className="gap-1"
            onClick={() => setLocation('/sales-funnel')}
          >
            <ChevronLeft className="h-4 w-4" />
            Вернуться к воронке продаж
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Управление архивом заявок</CardTitle>
            <CardDescription>
              Архивирование и восстановление заявок из архива
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Основные вкладки: Отказы / Успешные заявки */}
            <Tabs 
              defaultValue="refusals" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="refusals" className="flex items-center gap-1">
                  <Ban className="h-4 w-4" />
                  <span>Отказы</span> <span className="ml-1 text-xs">({activeRefusals.length + archivedRefusals.length})</span>
                </TabsTrigger>
                <TabsTrigger value="successful" className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Успешные заявки</span> <span className="ml-1 text-xs">({activeSuccessful.length + archivedSuccessful.length})</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Содержимое вкладки "Отказы" */}
              <TabsContent value="refusals" className="space-y-4">
                <Tabs 
                  defaultValue="active" 
                  value={refusalSubTab}
                  onValueChange={setRefusalSubTab}
                  className="space-y-4"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="active">
                      Активные отказы <span className="ml-1 text-xs">({activeRefusals.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="archived">
                      Архив <span className="ml-1 text-xs">({archivedRefusals.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="stats">
                      Статистика
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Активные отказы */}
                  <TabsContent value="active" className="min-h-[400px]">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-medium">
                            Неархивированные отказы
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Активные отказы, которые отображаются в колонке "Отказ"
                          </p>
                        </div>
                        
                        {activeRefusals.length > 0 && (
                          <Button 
                            onClick={handleArchiveAllRefusals} 
                            size="sm" 
                            className="gap-1"
                            disabled={archivingAllRefusals}
                          >
                            {archivingAllRefusals ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Архивирование...
                              </>
                            ) : (
                              <>
                                <Archive className="h-3 w-3" />
                                Архивировать все
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {oldRefusals.length > 0 && (
                        <Card className="shadow-none border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                          <CardHeader className="py-2 px-3">
                            <CardTitle className="text-xs">
                              Рекомендуется архивировать
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                              Эти заявки старше 5 дней и могут быть архивированы
                            </p>
                            <ScrollArea className="h-[80px]">
                              <ul className="space-y-1">
                                {oldRefusals.map(request => (
                                  <li key={request.id} className="text-xs p-1 bg-muted/50 rounded flex justify-between items-center">
                                    <span>
                                      {request.childName} ({new Date(request.updatedAt || '').toLocaleDateString()})
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ID: {request.id}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      )}
                      
                      {activeRefusals.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                          <ul className="space-y-2">
                            {activeRefusals.map(request => (
                              <li key={request.id} className="p-3 rounded border bg-card">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-medium">{request.childName}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {request.childAge} лет • {new Date(request.createdAt || '').toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleArchiveRefusal(request)}
                                    disabled={archivingIds.includes(request.id)}
                                  >
                                    {archivingIds.includes(request.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Archive className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                {request.notes && (
                                  <div className="text-xs bg-muted p-2 rounded">
                                    {request.notes}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          Нет активных отказов
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Архивированные отказы */}
                  <TabsContent value="archived" className="min-h-[400px]">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium">
                          Архив отказов
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Заявки, которые были архивированы и не отображаются в основном списке
                        </p>
                      </div>
                      
                      {archivedRefusals.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                          <ul className="space-y-2">
                            {archivedRefusals.map(request => (
                              <li key={request.id} className="p-3 rounded border bg-card">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-medium">{request.childName}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {request.childAge} лет • Архивирована: {
                                        new Date(request.updatedAt || '').toLocaleDateString()
                                      }
                                    </p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRestoreRequest(request)}
                                    disabled={restoring === request.id}
                                  >
                                    {restoring === request.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <ArrowUp className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                {request.notes && (
                                  <div className="text-xs bg-muted p-2 rounded">
                                    {request.notes}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          В архиве нет отказов
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Статистика отказов */}
                  <TabsContent value="stats" className="min-h-[400px]">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium">
                          Статистика отказов
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Анализ причин отказов для улучшения процесса продаж
                        </p>
                      </div>
                      
                      {refusalStats.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>Причина</span>
                            <span>Количество</span>
                          </div>
                          <ul className="space-y-2">
                            {refusalStats.map((stat, index) => (
                              <li key={index} className="flex justify-between items-center">
                                <div className="text-sm">{stat.reason}</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">{stat.count}</div>
                                  <div className="text-xs text-muted-foreground">({stat.percentage}%)</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                          
                          <div className="flex items-center gap-2 justify-center text-sm mt-6">
                            <PieChart className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Всего отказов: {archivedRefusals.length}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          Нет данных для статистики
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              {/* Содержимое вкладки "Успешные заявки" */}
              <TabsContent value="successful" className="space-y-4">
                <Tabs 
                  defaultValue="active" 
                  value={successSubTab}
                  onValueChange={setSuccessSubTab}
                  className="space-y-4"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="active">
                      Активные <span className="ml-1 text-xs">({activeSuccessful.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="archived">
                      Архив <span className="ml-1 text-xs">({archivedSuccessful.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="stats">
                      Статистика
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Активные успешные заявки */}
                  <TabsContent value="active" className="min-h-[400px]">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-medium">
                            Активные успешные заявки
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Заявки в статусе "Записан", для которых созданы ученики
                          </p>
                        </div>
                        
                        {activeSuccessful.length > 0 && (
                          <Button 
                            onClick={handleArchiveAllSuccessful}
                            size="sm" 
                            className="gap-1"
                            disabled={archivingAllSuccessful}
                          >
                            {archivingAllSuccessful ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Архивирование...
                              </>
                            ) : (
                              <>
                                <Archive className="h-3 w-3" />
                                Архивировать все
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {oldSuccessful.length > 0 && (
                        <Card className="shadow-none border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                          <CardHeader className="py-2 px-3">
                            <CardTitle className="text-xs">
                              Рекомендуется архивировать
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                              Эти успешные заявки старше 3 дней и могут быть архивированы
                            </p>
                            <ScrollArea className="h-[80px]">
                              <ul className="space-y-1">
                                {oldSuccessful.map(request => (
                                  <li key={request.id} className="text-xs p-1 bg-muted/50 rounded flex justify-between items-center">
                                    <span>
                                      {request.childName} ({new Date(request.updatedAt || '').toLocaleDateString()})
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ID: {request.id}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      )}
                      
                      {activeSuccessful.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                          <ul className="space-y-2">
                            {activeSuccessful.map(request => (
                              <li key={request.id} className="p-3 rounded border bg-card">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-medium">{request.childName}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {request.childAge} лет • Записан: {new Date(request.updatedAt || '').toLocaleDateString()}
                                    </p>
                                    {request.section && (
                                      <p className="text-xs mt-1">
                                        Направление: {request.section}
                                      </p>
                                    )}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleArchiveSuccessful(request)}
                                    disabled={archivingIds.includes(request.id)}
                                  >
                                    {archivingIds.includes(request.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Archive className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                {request.notes && (
                                  <div className="text-xs bg-muted p-2 rounded">
                                    {request.notes}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          Нет активных успешных заявок
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Архивированные успешные заявки */}
                  <TabsContent value="archived" className="min-h-[400px]">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium">
                          Архив успешных заявок
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Успешные заявки, которые были архивированы
                        </p>
                      </div>
                      
                      {archivedSuccessful.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                          <ul className="space-y-2">
                            {archivedSuccessful.map(request => (
                              <li key={request.id} className="p-3 rounded border bg-card">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-medium">{request.childName}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {request.childAge} лет • Архивирована: {
                                        new Date(request.updatedAt || '').toLocaleDateString()
                                      }
                                    </p>
                                    {request.section && (
                                      <p className="text-xs mt-1">
                                        Направление: {request.section}
                                      </p>
                                    )}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRestoreRequest(request)}
                                    disabled={restoring === request.id}
                                  >
                                    {restoring === request.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <ArrowUp className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                {request.notes && (
                                  <div className="text-xs bg-muted p-2 rounded">
                                    {request.notes}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          В архиве нет успешных заявок
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Статистика успешных заявок */}
                  <TabsContent value="stats" className="min-h-[400px]">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium">
                          Статистика успешных заявок
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Анализ успешных заявок по направлениям
                        </p>
                      </div>
                      
                      {successStats.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>Направление</span>
                            <span>Количество</span>
                          </div>
                          <ul className="space-y-2">
                            {successStats.map((stat, index) => (
                              <li key={index} className="flex justify-between items-center">
                                <div className="text-sm">{stat.section}</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">{stat.count}</div>
                                  <div className="text-xs text-muted-foreground">({stat.percentage}%)</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                          
                          <div className="flex items-center gap-2 justify-center text-sm mt-6">
                            <PieChart className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Всего успешных заявок: {archivedSuccessful.length}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 text-muted-foreground">
                          Нет данных для статистики
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}