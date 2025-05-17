import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTrialRequests } from "../sales-funnel/hooks/useTrialRequests";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Archive, ArrowUp, ChevronLeft, PieChart, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { RefusalArchiveService, ARCHIVE_MARKERS } from "../sales-funnel/services/RefusalArchiveService";

// Тип для статистики по отказам
type RefusalStat = {
  reason: string;
  count: number;
  percentage: number;
};

/**
 * Страница архива отказов
 * Отвечает за отображение архивированных отказов и работу с ними
 * Следует принципу единственной ответственности (SRP) из SOLID
 */
export default function RefusalArchivePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const { requests = [], isLoading } = useTrialRequests();
  const [activeTab, setActiveTab] = useState<string>("active");
  
  // Активные отказы - те, которые еще не заархивированы
  const [activeRefusals, setActiveRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  // Архивированные отказы
  const [archivedRefusals, setArchivedRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  // Старые отказы, которые можно архивировать
  const [oldRefusals, setOldRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  // Статистика по отказам
  const [stats, setStats] = useState<RefusalStat[]>([]);
  
  // Changed from boolean to track specific request IDs being archived
  const [archivingIds, setArchivingIds] = useState<number[]>([]);
  // Track if the "Archive All" operation is in progress
  const [archivingAll, setArchivingAll] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  
  // Функция для оптимистичного обновления UI при архивировании
  const optimisticArchiveUpdate = (requestId: number, updatedNotes: string) => {
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

  // Функция архивирования заявки с оптимистичным обновлением
  const handleArchiveRefusal = async (request: ExtendedTrialRequest) => {
    // Добавляем ID заявки в список архивируемых
    setArchivingIds(prev => [...prev, request.id]);
    
    try {
      console.log(`Начинаем архивирование заявки ID=${request.id}`);
      
      // Сначала выполняем оптимистичное обновление UI 
      // до выполнения запроса на сервер
      optimisticArchiveUpdate(request.id, request.notes || '');
      
      // Архивируем заявку на сервере
      const { success, notes } = await RefusalArchiveService.archiveRefusal(
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
  
  // Функция архивирования всех активных отказов
  const handleArchiveAllRefusals = async () => {
    if (activeRefusals.length === 0) return;
    
    if (!confirm(`Вы уверены, что хотите архивировать все ${activeRefusals.length} отказов?`)) {
      return;
    }
    
    // Устанавливаем флаг массового архивирования
    setArchivingAll(true);
    
    try {
      // СНАЧАЛА делаем оптимистичное обновление UI, чтобы избежать мерцания
      // Сохраняем копию активных отказов для возможного восстановления при ошибке
      const originalActiveRefusals = [...activeRefusals];
      
      // Подготавливаем обновленные запросы для архивированных
      const requestsToArchive = activeRefusals.map(request => ({
        ...request,
        notes: `${request.notes || ''} ${RefusalArchiveService.getArchiveMarker()}`
      }));
      
      // Оптимистично обновляем состояние UI
      setActiveRefusals([]); // Сразу очищаем список активных
      setArchivedRefusals(prev => [...requestsToArchive, ...prev]); // Добавляем в архивированные
      
      console.log(`Начинаем архивирование ${activeRefusals.length} отказов`);
      
      // ЗАТЕМ выполняем реальный запрос к серверу
      const archivedCount = await RefusalArchiveService.archiveBatch(originalActiveRefusals);
      
      console.log(`Успешно архивировано: ${archivedCount} из ${originalActiveRefusals.length}`);
      
      // Показываем уведомление об успешном архивировании
      toast({
        title: "Архивирование выполнено",
        description: `Архивировано ${archivedCount} из ${originalActiveRefusals.length} заявок`,
        variant: archivedCount > 0 ? "default" : "destructive",
      });
      
      // Тихо обновляем данные с сервера без изменения UI для синхронизации состояния
      if (archivedCount > 0) {
        // Обновляем данные с сервера без явной перерисовки UI
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/trial-requests"],
            // Не обновляем UI, чтобы избежать мерцания
            refetchType: "none"
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Ошибка при массовом архивировании:', error);
      
      // В случае ошибки восстанавливаем исходные данные
      refreshData();
      
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать заявки",
        variant: "destructive",
      });
    } finally {
      // Сбрасываем флаг массового архивирования
      setArchivingAll(false);
    }
  };
  
  // Функция архивирования всех старых отказов
  const handleArchiveAllOld = async () => {
    if (oldRefusals.length === 0) {
      toast({
        description: "Нет старых отказов для архивирования",
        variant: "default"
      });
      return;
    }
    
    if (!confirm(`Вы уверены, что хотите архивировать все старые отказы (${oldRefusals.length} шт.)?`)) {
      return;
    }
    
    // Устанавливаем флаг массового архивирования
    setArchivingAll(true);
    
    try {
      // Сохраняем копию старых отказов для возможного восстановления при ошибке
      const originalOldRefusals = [...oldRefusals];
      
      // СНАЧАЛА делаем оптимистичное обновление UI, чтобы избежать мерцания
      // Подготавливаем обновленные запросы для архивированных
      const updatedRequests = oldRefusals.map(request => ({
        ...request,
        notes: `${request.notes || ''} ${RefusalArchiveService.getArchiveMarker()}`
      }));
      
      // Оптимистично удаляем архивированные заявки из списка активных
      setActiveRefusals(prev => prev.filter(r => 
        !oldRefusals.some(old => old.id === r.id)
      ));
      
      // Очищаем список старых отказов
      setOldRefusals([]);
      
      // Добавляем в архивированные
      setArchivedRefusals(prev => [...updatedRequests, ...prev]);
      
      console.log(`Начинаем архивирование ${originalOldRefusals.length} старых отказов`);
      
      // ЗАТЕМ выполняем запрос архивирования на сервере
      const archivedCount = await RefusalArchiveService.archiveBatch(originalOldRefusals);
      
      console.log(`Успешно архивировано старых отказов: ${archivedCount} из ${originalOldRefusals.length}`);
      
      // Показываем уведомление
      if (archivedCount > 0) {
        toast({
          description: `Архивировано ${archivedCount} старых отказов`,
          variant: "default"
        });
        
        // Тихо обновляем данные с сервера без влияния на UI
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/trial-requests"],
            // Не обновляем UI, чтобы избежать мерцания
            refetchType: "none"
          });
        }, 1500);
      } else {
        toast({
          description: "Не удалось архивировать старые отказы",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Ошибка при массовом архивировании старых отказов:", error);
      
      // В случае ошибки восстанавливаем исходные данные
      refreshData();
      
      toast({
        description: "Произошла ошибка при архивировании",
        variant: "destructive"
      });
    } finally {
      // Сбрасываем флаг массового архивирования
      setArchivingAll(false);
    }
  };
  
  // Функция восстановления заявки из архива
  const handleRestoreRefusal = async (request: ExtendedTrialRequest) => {
    // Если уже идет восстановление этой заявки, прерываем
    if (restoring === request.id) return;
    
    console.log(`Начинаем восстановление заявки ID=${request.id} из архива`);
    setRestoring(request.id);
    
    try {
      // 1. СНАЧАЛА делаем оптимистичное обновление UI
      // Удаляем из архивированных
      setArchivedRefusals(prev => prev.filter(r => r.id !== request.id));
      
      // Готовим полностью очищенный текст примечаний
      const cleanNotes = RefusalArchiveService.cleanNotesForDisplay(request.notes || '');
      
      // Формируем метку восстановления (для сервера)
      const restoreMarker = RefusalArchiveService.getRestoreMarker();
      const updatedNotes = `${cleanNotes} ${restoreMarker}`.trim();
      
      // Создаем объект заявки с очищенными примечаниями
      const updatedRequest = {
        ...request,
        notes: cleanNotes, // Для отображения в UI используем полностью очищенный текст
        status: 'REFUSED'  // Явно указываем статус отказа, а не "архивированного отказа"
      };
      
      // Добавляем в активные отказы
      setActiveRefusals(prev => [updatedRequest, ...prev]);
      
      // 2. ПОТОМ отправляем запрос на сервер с техническими метками
      const { success } = await RefusalArchiveService.restoreFromArchive(request.id);
      
      if (success) {
        // Показываем уведомление об успешном восстановлении
        toast({
          title: "Восстановление выполнено",
          description: `Заявка #${request.id} восстановлена из архива`,
          variant: "default",
        });
        
        // 3. Обновляем данные с сервера с УВЕЛИЧЕННОЙ задержкой
        // чтобы предотвратить мерцание интерфейса
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
        }, 1500); // Значительно увеличиваем задержку для лучшего UX
      } else {
        // Если произошла ошибка, откатываем UI изменения
        setArchivedRefusals(prev => [...prev, request]);
        setActiveRefusals(prev => prev.filter(r => r.id !== request.id));
        
        toast({
          title: "Ошибка",
          description: "Не удалось восстановить заявку",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Ошибка при восстановлении из архива:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить заявку из архива",
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
    if (isLoading || !requests) return;
    
    console.log('Обрабатываем список отказов для архива');
    
    // Фильтруем только отказы со статусом REFUSED
    // Архивированные отказы определяем по наличию маркера в примечаниях
    const refusals = requests.filter(r => 
      r.status === TrialRequestStatus.REFUSED
    );
    
    // Разделяем на активные и архивированные
    const active: ExtendedTrialRequest[] = [];
    const archived: ExtendedTrialRequest[] = [];
    
    refusals.forEach(request => {
      // Создаем клон заявки, чтобы не мутировать оригинальные данные
      const cleanedRequest = {
        ...request,
        // Очищаем примечания от всех технических меток для отображения
        notes: RefusalArchiveService.cleanNotesForDisplay(request.notes || '')
      };
      
      // Используем сервис для точной проверки архивирования на ОРИГИНАЛЬНОЙ заявке
      const isArchived = RefusalArchiveService.isArchived(request);
      
      if (isArchived) {
        archived.push(cleanedRequest);
      } else {
        active.push(cleanedRequest);
      }
    });
    
    // Отбираем старые отказы для архивирования
    const oldRefusalsFiltered = RefusalArchiveService.filterOldRefusals(active, 5);
    
    // Устанавливаем очищенные данные в состояние
    setActiveRefusals(active);
    setArchivedRefusals(archived);
    setOldRefusals(oldRefusalsFiltered);
    
    // Собираем статистику по причинам отказов с очищенными примечаниями
    collectReasonStats(refusals.map(req => ({
      ...req,
      notes: RefusalArchiveService.cleanNotesForDisplay(req.notes || '')
    })));
  }, [requests, isLoading]);
  
  // Обрабатываем список отказов при их изменении
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // Функция для сбора статистики по причинам отказов
  const collectReasonStats = (requests: ExtendedTrialRequest[]) => {
    const reasons: Record<string, number> = {};
    let totalReasons = 0;

    // Проходим по всем отказам и собираем статистику
    requests.forEach(request => {
      if (!request.notes) return;

      // Извлекаем причины из примечаний (формат: "Причины отказа: причина1, причина2. Комментарий")
      const notesText = request.notes;
      if (notesText.includes('Причины отказа:')) {
        // Разбиваем текст на части
        const reasonsPart = notesText.split('Причины отказа:')[1].split('.')[0].trim();
        const reasonsList = reasonsPart.split(',').map(r => r.trim());

        // Подсчитываем количество каждой причины
        reasonsList.forEach(reason => {
          if (!reason) return;
          const key = reason.toLowerCase();
          reasons[key] = (reasons[key] || 0) + 1;
          totalReasons++;
        });
      }
    });

    // Формируем статистику с процентами
    const statsArray = Object.entries(reasons).map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / totalReasons) * 100) || 0
    }));

    // Сортируем по убыванию количества
    statsArray.sort((a, b) => b.count - a.count);
    
    setStats(statsArray);
  };
  
  // Форматирование даты архивирования для отображения
  const getArchiveDate = (notes: string | null | undefined): string => {
    if (!notes) return '';
    
    // Ищем дату в формате сообщения об архивировании: [Заявка архивирована 17.05.2025]
    const match = notes.match(new RegExp(`\\[${ARCHIVE_MARKERS.ARCHIVE_MESSAGE}\\s+(\\d{1,2}\\.\\d{1,2}\\.\\d{4})\\]`));
    return match ? match[1] : '';
  };

  // Функция принудительного обновления данных с сервера
  const forceRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
    refreshData();
    toast({
      title: "Данные обновлены",
      description: "Информация об отказах актуализирована",
      variant: "default",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Архив отказов</h1>
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
            <CardTitle>Управление отказами</CardTitle>
            <CardDescription>
              Архивирование и восстановление заявок из архива
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="active" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 grid w-full grid-cols-3">
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
                        disabled={archivingAll}
                      >
                        {archivingAll ? (
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
                                variant="outline" 
                                size="sm"
                                onClick={() => handleArchiveRefusal(request)}
                                disabled={archivingIds.includes(request.id) || archivingAll}
                                className="gap-1"
                              >
                                {archivingIds.includes(request.id) ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Архивирование...
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-3 w-3" />
                                    Архивировать
                                  </>
                                )}
                              </Button>
                            </div>
                            {request.notes && (
                              <div className="text-xs bg-muted p-2 rounded mt-2">
                                {RefusalArchiveService.cleanNotesForDisplay(request.notes)}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground min-h-[200px] flex items-center justify-center">
                      <p>Нет активных отказов</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="archived" className="min-h-[400px]">
                <div className="space-y-4">
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
                                {/* Используем helper метод для получения и очистки даты */}
                                <p className="text-xs text-muted-foreground">
                                  {request.childAge} лет • Архивирована: {
                                    RefusalArchiveService.getDisplayTexts(request).archiveDate || 
                                    new Date().toLocaleDateString()
                                  }
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRestoreRefusal(request)}
                                disabled={restoring === request.id}
                                className="gap-1"
                              >
                                {restoring === request.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Восстановление...
                                  </>
                                ) : (
                                  <>
                                    <ArrowUp className="h-3 w-3" />
                                    Восстановить
                                  </>
                                )}
                              </Button>
                            </div>
                            {/* Используем helper метод для получения очищенных примечаний */}
                            {request.notes && (
                              <div className="text-xs bg-muted p-2 rounded mt-2">
                                {RefusalArchiveService.getDisplayTexts(request).notes}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground min-h-[200px] flex items-center justify-center">
                      <p>В архиве нет отказов</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="min-h-[400px]">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">
                      Статистика по причинам отказа
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Анализ самых частых причин отказа от пробных занятий
                    </p>
                  </div>
                  
                  {stats.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <PieChart className="h-4 w-4" />
                          Самые частые причины отказа
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {stats.map((stat, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span className="text-sm">{stat.reason}</span>
                              <div className="flex items-center gap-2">
                                <div className="h-2 bg-primary/20 rounded-full w-24 overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${stat.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium min-w-[40px] text-right">
                                  {stat.count} ({stat.percentage}%)
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground min-h-[200px] flex items-center justify-center">
                      <p>Нет данных для анализа статистики отказов</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}