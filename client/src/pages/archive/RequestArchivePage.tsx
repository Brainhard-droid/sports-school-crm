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
    
    console.log("Обработка заявок...");
    
    // Находим все заявки со статусом "Отказ", фильтруем архивированные/активные
    const refusals = requests.filter(request => 
      request.status === TrialRequestStatus.REFUSED
    );
    
    // Разделяем отказы на архивированные и активные
    const archivedRefusalList = refusals.filter(request => 
      RequestArchiveService.isArchived(request)
    );
    
    const activeRefusalList = refusals.filter(request => 
      !RequestArchiveService.isArchived(request)
    );
    
    // Находим "старые" отказы, которые созданы давно и можно архивировать
    const oldRefusalList = activeRefusalList.filter(request => 
      RequestArchiveService.isOld(request)
    );
    
    // Находим успешные заявки (со статусом "Записан")
    const successful = requests.filter(request => 
      request.status === TrialRequestStatus.SIGNED
    );
    
    // Разделяем успешные на архивированные и активные
    const archivedSuccessfulList = successful.filter(request => 
      RequestArchiveService.isArchived(request)
    );
    
    const activeSuccessfulList = successful.filter(request => 
      !RequestArchiveService.isArchived(request)
    );
    
    // Находим "старые" успешные заявки, которые созданы давно и можно архивировать
    const oldSuccessfulList = activeSuccessfulList.filter(request => 
      RequestArchiveService.isOld(request)
    );
    
    // Обновляем состояние
    setActiveRefusals(activeRefusalList);
    setArchivedRefusals(archivedRefusalList);
    setOldRefusals(oldRefusalList);
    setActiveSuccessful(activeSuccessfulList);
    setArchivedSuccessful(archivedSuccessfulList);
    setOldSuccessful(oldSuccessfulList);
    
    console.log(
      `Обработано: ${activeRefusalList.length} активных отказов, ` +
      `${archivedRefusalList.length} архивированных отказов, ` +
      `${activeSuccessfulList.length} активных успешных, ` +
      `${archivedSuccessfulList.length} архивированных успешных`
    );
    
    // Статистика по архивированным отказам
    if (archivedRefusalList.length > 0) {
      // Группируем отказы по причине
      const reasonGroups: { [key: string]: number } = {};
      
      archivedRefusalList.forEach(request => {
        const reason = request.refusalReason || 'Не указана';
        reasonGroups[reason] = (reasonGroups[reason] || 0) + 1;
      });
      
      // Преобразуем в массив и сортируем по убыванию количества
      const sortedReasons = Object.entries(reasonGroups)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: Math.round((count / archivedRefusalList.length) * 100)
        }))
        .sort((a, b) => b.count - a.count);
      
      setRefusalStats(sortedReasons);
    }
    
    // Статистика по архивированным успешным заявкам
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
    }
    
  }, [requests]);
  
  // Возвращаемся на страницу воронки
  const handleBackClick = () => {
    setLocation("/sales-funnel");
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBackClick} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <h1 className="text-xl font-bold">Архив заявок</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={forceRefresh} 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Обновить
        </Button>
      </div>
      
      <Tabs defaultValue="refusals" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="refusals" className="flex-1">
            <Ban className="h-4 w-4 mr-2" />
            Отказы ({archivedRefusals.length})
          </TabsTrigger>
          <TabsTrigger value="successful" className="flex-1">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Успешные заявки ({archivedSuccessful.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Вкладка с отказами */}
        <TabsContent value="refusals">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Статистика */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Статистика отказов
                </CardTitle>
                <CardDescription>
                  Распределение причин отказов
                </CardDescription>
              </CardHeader>
              <CardContent>
                {refusalStats.length > 0 ? (
                  <ul className="space-y-2">
                    {refusalStats.map((stat, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <div className="text-sm">
                          {stat.reason} 
                          <span className="text-xs text-muted-foreground ml-1">
                            ({stat.percentage}%)
                          </span>
                        </div>
                        <div className="font-medium">{stat.count}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Нет данных для отображения
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Список заявок */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Архивированные отказы</CardTitle>
                <CardDescription>
                  Всего архивировано: {archivedRefusals.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" value={refusalSubTab} onValueChange={setRefusalSubTab}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="active" className="flex-1">
                      Архив
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="flex-1">
                      Кандидаты на архивирование ({oldRefusals.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Подвкладка с архивом */}
                  <TabsContent value="active">
                    {archivedRefusals.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {archivedRefusals.map(request => (
                            <Card key={request.id} className="p-3">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <h4 className="font-medium">{request.childName}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {request.childAge} лет • Отказ: {new Date(request.updatedAt || '').toLocaleDateString()}
                                  </p>
                                  <p className="text-xs mt-1 text-red-500">
                                    Причина: {request.refusalReason || 'Не указана'}
                                  </p>
                                  <p className="text-xs mt-1">
                                    Направление: {getSectionName(request.section)}
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
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        Архив отказов пуст
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Подвкладка с кандидатами на архивирование */}
                  <TabsContent value="candidates">
                    {oldRefusals.length > 0 ? (
                      <>
                        <div className="mb-4 flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            Отказы, которые можно архивировать
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleArchiveAllRefusals}
                            disabled={archivingAllRefusals}
                          >
                            {archivingAllRefusals ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Archive className="h-4 w-4 mr-1" />
                            )}
                            Архивировать все
                          </Button>
                        </div>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {oldRefusals.map(request => (
                              <Card key={request.id} className="p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-medium">{request.childName}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {request.childAge} лет • Отказ: {new Date(request.updatedAt || '').toLocaleDateString()}
                                    </p>
                                    <p className="text-xs mt-1 text-red-500">
                                      Причина: {request.refusalReason || 'Не указана'}
                                    </p>
                                    <p className="text-xs mt-1">
                                      Направление: {getSectionName(request.section)}
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
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        Нет отказов для архивирования
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Вкладка с успешными заявками */}
        <TabsContent value="successful">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Статистика */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Статистика по направлениям
                </CardTitle>
                <CardDescription>
                  Распределение успешных заявок по направлениям
                </CardDescription>
              </CardHeader>
              <CardContent>
                {successStats.length > 0 ? (
                  <ul className="space-y-2">
                    {successStats.map((stat, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <div className="text-sm">
                          {stat.section} 
                          <span className="text-xs text-muted-foreground ml-1">
                            ({stat.percentage}%)
                          </span>
                        </div>
                        <div className="font-medium">{stat.count}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Нет данных для отображения
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Список успешных заявок */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Архивированные успешные заявки</CardTitle>
                <CardDescription>
                  Всего архивировано: {archivedSuccessful.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" value={successSubTab} onValueChange={setSuccessSubTab}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="active" className="flex-1">
                      Архив
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="flex-1">
                      Кандидаты на архивирование ({oldSuccessful.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Подвкладка с архивом успешных заявок */}
                  <TabsContent value="active">
                    {archivedSuccessful.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {archivedSuccessful.map(request => (
                            <Card key={request.id} className="p-3">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <h4 className="font-medium">{request.childName}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {request.childAge} лет • Записан: {new Date(request.updatedAt || '').toLocaleDateString()}
                                  </p>
                                  <p className="text-xs mt-1">
                                    Направление: {getSectionName(request.section)}
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
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        Архив успешных заявок пуст
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Подвкладка с кандидатами на архивирование */}
                  <TabsContent value="candidates">
                    {oldSuccessful.length > 0 ? (
                      <>
                        <div className="mb-4 flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            Успешные заявки, которые можно архивировать
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleArchiveAllSuccessful}
                            disabled={archivingAllSuccessful}
                          >
                            {archivingAllSuccessful ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Archive className="h-4 w-4 mr-1" />
                            )}
                            Архивировать все
                          </Button>
                        </div>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {oldSuccessful.map(request => (
                              <Card key={request.id} className="p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <h4 className="font-medium">{request.childName}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {request.childAge} лет • Записан: {new Date(request.updatedAt || '').toLocaleDateString()}
                                    </p>
                                    <p className="text-xs mt-1">
                                      Направление: {getSectionName(request.section)}
                                    </p>
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
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        Нет успешных заявок для архивирования
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}