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
  
  const [archiving, setArchiving] = useState(false);
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
    setArchiving(true);
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
      setArchiving(false);
    }
  };
  
  // Функция архивирования всех активных отказов
  const handleArchiveAllRefusals = async () => {
    if (activeRefusals.length === 0) return;
    
    if (!confirm(`Вы уверены, что хотите архивировать все ${activeRefusals.length} отказов?`)) {
      return;
    }
    
    setArchiving(true);
    try {
      console.log(`Начинаем архивирование ${activeRefusals.length} отказов`);
      
      // Архивируем активные отказы через обновленный сервис
      const archivedCount = await RefusalArchiveService.archiveBatch(activeRefusals);
      
      console.log(`Успешно архивировано: ${archivedCount} из ${activeRefusals.length}`);
      
      // Оптимистично обновляем UI после успешного архивирования
      if (archivedCount > 0) {
        // Очищаем список активных отказов
        setActiveRefusals([]);
        
        // Добавляем в архивированные с обновленными примечаниями
        const updatedRequests = activeRefusals.map(request => ({
          ...request,
          notes: `${request.notes || ''} ${RefusalArchiveService.getArchiveMarker()}`
        }));
        setArchivedRefusals(prev => [...prev, ...updatedRequests]);
      }
      
      // Показываем уведомление об успешном архивировании
      toast({
        title: "Архивирование выполнено",
        description: `Архивировано ${archivedCount} из ${activeRefusals.length} заявок`,
        variant: archivedCount > 0 ? "default" : "destructive",
      });
      
      // Обновляем данные запросов с сервера, если были архивированы заявки
      if (archivedCount > 0) {
        // Обновляем данные с сервера с небольшой задержкой
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
          refreshData();
        }, 1000);
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
      setArchiving(false);
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
    
    setArchiving(true);
    
    try {
      console.log(`Начинаем архивирование ${oldRefusals.length} старых отказов`);
      
      // Архивируем старые отказы через обновленный сервис
      const archivedCount = await RefusalArchiveService.archiveBatch(oldRefusals);
      
      console.log(`Успешно архивировано старых отказов: ${archivedCount} из ${oldRefusals.length}`);
      
      // Оптимистично обновляем UI после успешного архивирования
      if (archivedCount > 0) {
        // Удаляем архивированные заявки из списка активных
        setActiveRefusals(prev => prev.filter(r => 
          !oldRefusals.some(old => old.id === r.id)
        ));
        
        // Удаляем архивированные заявки из списка старых
        setOldRefusals([]);
        
        // Добавляем в архивированные с обновленными примечаниями
        const updatedRequests = oldRefusals.map(request => ({
          ...request,
          notes: `${request.notes || ''} ${RefusalArchiveService.getArchiveMarker()}`
        }));
        setArchivedRefusals(prev => [...prev, ...updatedRequests]);
        
        toast({
          description: `Архивировано ${archivedCount} старых отказов`,
          variant: "default"
        });
      } else {
        toast({
          description: "Не удалось архивировать старые отказы",
          variant: "destructive"
        });
      }
      
      // Обновляем данные с сервера после успешного архивирования
      if (archivedCount > 0) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
          refreshData();
        }, 1000);
      }
    } catch (error) {
      console.error("Ошибка при массовом архивировании старых отказов:", error);
      toast({
        description: "Произошла ошибка при архивировании",
        variant: "destructive"
      });
      
      // Запрашиваем обновленные данные с сервера
      refreshData();
    } finally {
      setArchiving(false);
    }
  };
  
  // Функция восстановления заявки из архива
  const handleRestoreRefusal = async (request: ExtendedTrialRequest) => {
    setRestoring(request.id);
    try {
      // Оптимистично обновляем UI - удаляем из архивированных и добавляем в активные
      setArchivedRefusals(prev => prev.filter(r => r.id !== request.id));
      
      // Подготавливаем обновленный текст примечаний для восстановленной заявки
      // Удаляем все метки архивирования
      let updatedNotes = (request.notes || '');
      
      // Удаляем метку сообщения архивирования
      updatedNotes = updatedNotes
        .replace(new RegExp(`\\[${ARCHIVE_MARKERS.ARCHIVE_MESSAGE}[^\\]]*\\]`, 'g'), '')
        .replace(new RegExp(`\\[${ARCHIVE_MARKERS.ARCHIVE_TAG}\\]`, 'g'), '')
        .trim();
      
      updatedNotes = `${updatedNotes} ${RefusalArchiveService.getRestoreMarker()}`.trim();
      
      const updatedRequest = {
        ...request,
        notes: updatedNotes
      };
      
      setActiveRefusals(prev => [updatedRequest, ...prev]);
      
      // Восстанавливаем заявку из архива в БД
      const success = await RefusalArchiveService.restoreFromArchive(request.id);
      
      if (success) {
        // Показываем уведомление об успешном восстановлении
        toast({
          title: "Восстановление выполнено",
          description: `Заявка #${request.id} восстановлена из архива`,
          variant: "default",
        });
        
        // Обновляем данные с сервера с задержкой,
        // чтобы дать время на обновление БД
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
          refreshData();
        }, 500);
      } else {
        // Если произошла ошибка, откатываем UI изменения
        toast({
          title: "Ошибка",
          description: "Не удалось восстановить заявку",
          variant: "destructive",
        });
        
        // Запрашиваем обновленные данные с сервера
        refreshData();
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
    
    // Фильтруем только отказы
    const refusals = requests.filter(r => r.status === TrialRequestStatus.REFUSED);
    
    // Разделяем на активные и архивированные
    const active: ExtendedTrialRequest[] = [];
    const archived: ExtendedTrialRequest[] = [];
    
    refusals.forEach(request => {
      // Используем сервис для точной проверки, является ли заявка архивированной
      const isArchived = RefusalArchiveService.isArchived(request);
      console.log(`Заявка ${request.id}: архивирована=${isArchived}, примечания="${request.notes}"`);
      
      if (isArchived) {
        archived.push(request);
      } else {
        active.push(request);
      }
    });
    
    // Отбираем старые отказы для архивирования
    const oldRefusalsFiltered = RefusalArchiveService.filterOldRefusals(active, 5);
    
    setActiveRefusals(active);
    setArchivedRefusals(archived);
    setOldRefusals(oldRefusalsFiltered);
    
    // Собираем статистику по причинам отказов
    collectReasonStats(refusals);
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
                        disabled={archiving}
                      >
                        {archiving ? (
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
                                disabled={archiving}
                                className="gap-1"
                              >
                                {archiving ? (
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
                                <p className="text-xs text-muted-foreground">
                                  {request.childAge} лет • Архивирована: {getArchiveDate(request.notes)}
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