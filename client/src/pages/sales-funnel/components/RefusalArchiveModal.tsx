import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Archive, ArrowUp, PieChart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefusalArchiveService } from "../services/RefusalArchiveService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Тип для статистики по отказам
type RefusalStat = {
  reason: string;
  count: number;
  percentage: number;
};

// Интерфейс для пропсов компонента
interface RefusalArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  refusedRequests: ExtendedTrialRequest[];
}

/**
 * Модальное окно для работы с архивом отказов
 * Реализует принцип единственной ответственности (SRP) из SOLID
 */
export function RefusalArchiveModal({
  isOpen,
  onClose,
  refusedRequests
}: RefusalArchiveModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stats, setStats] = useState<RefusalStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveTab, setArchiveTab] = useState("pending");
  
  // Активные отказы - те, которые еще не заархивированы
  const [activeRefusals, setActiveRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  // Архивированные отказы
  const [archivedRefusals, setArchivedRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  // Старые отказы, которые можно архивировать
  const [oldRefusals, setOldRefusals] = useState<ExtendedTrialRequest[]>([]);
  
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Функция архивирования всех активных отказов
  const handleArchiveAllRefusals = async () => {
    if (activeRefusals.length === 0) return;
    
    setArchiving(true);
    try {
      // Архивируем активные отказы
      const archivedCount = await RefusalArchiveService.archiveBatch(activeRefusals);
      
      // Показываем уведомление об успешном архивировании
      toast({
        title: "Архивирование выполнено",
        description: `Архивировано ${archivedCount} из ${activeRefusals.length} заявок`,
        variant: archivedCount > 0 ? "default" : "destructive",
      });
      
      // Обновляем данные запросов, если были архивированы заявки
      if (archivedCount > 0) {
        // Мгновенно удаляем заархивированные заявки из локального списка
        setActiveRefusals([]);
        
        // Обновляем данные с сервера
        queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      }
    } catch (error) {
      console.error('Ошибка при архивировании:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать заявки",
        variant: "destructive",
      });
    } finally {
      setArchiving(false);
    }
  };
  
  // Функция восстановления заявки из архива
  const handleRestoreRefusal = async (request: ExtendedTrialRequest) => {
    setRestoring(true);
    try {
      // Восстанавливаем заявку из архива
      const success = await RefusalArchiveService.restoreFromArchive(request.id);
      
      if (success) {
        // Показываем уведомление об успешном восстановлении
        toast({
          title: "Восстановление выполнено",
          description: `Заявка #${request.id} была восстановлена из архива`,
        });
        
        // Обновляем данные запросов
        queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      } else {
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
    } finally {
      setRestoring(false);
    }
  };

  // Обрабатываем список отказов и разделяем на активные и архивированные
  useEffect(() => {
    if (!refusedRequests || refusedRequests.length === 0) {
      setLoading(false);
      setStats([]);
      setActiveRefusals([]);
      setArchivedRefusals([]);
      setOldRefusals([]);
      return;
    }

    setLoading(true);

    // Функция для разделения отказов на активные и архивированные
    const processRefusals = () => {
      // Разделяем отказы на активные и архивированные
      const active: ExtendedTrialRequest[] = [];
      const archived: ExtendedTrialRequest[] = [];
      
      refusedRequests.forEach(request => {
        // Отказ считается архивированным, если в примечаниях есть метка "архивирована"
        const isArchived = request.notes && request.notes.includes('архивирована');
        
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
      
      // Анализируем статистику по причинам отказов
      collectReasonStats(refusedRequests);
      
      setLoading(false);
    };
    
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
        percentage: Math.round((count / totalReasons) * 100)
      }));

      // Сортируем по убыванию количества
      statsArray.sort((a, b) => b.count - a.count);
      
      setStats(statsArray);
    };

    processRefusals();
  }, [refusedRequests]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Архив отказов
          </DialogTitle>
          <DialogDescription>
            Управление архивом отказов от пробных занятий
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="pending" 
          className="flex-1 flex flex-col overflow-hidden"
          value={archiveTab}
          onValueChange={setArchiveTab}
        >
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="pending">
              Активные отказы <span className="ml-1 text-xs">({activeRefusals.length})</span>
            </TabsTrigger>
            <TabsTrigger value="archived">
              Архив <span className="ml-1 text-xs">({archivedRefusals.length})</span>
            </TabsTrigger>
            <TabsTrigger value="stats">
              Статистика
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : (
              <>
                <TabsContent value="pending" className="flex-1 h-full overflow-hidden">
                  <div className="space-y-3 h-full flex flex-col">
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
                      <ScrollArea className="flex-1">
                        <ul className="space-y-2">
                          {activeRefusals.map(request => (
                            <li key={request.id} className="p-2 rounded border bg-card">
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
                                  onClick={() => handleArchiveAllRefusals()}
                                  disabled={archiving}
                                >
                                  <Archive className="h-4 w-4" />
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
                
                <TabsContent value="archived" className="h-full overflow-hidden">
                  <div className="space-y-3 h-full flex flex-col">
                    <div>
                      <h3 className="text-sm font-medium">
                        Архив отказов
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Заявки, которые были архивированы и не отображаются в основном списке
                      </p>
                    </div>
                    
                    {archivedRefusals.length > 0 ? (
                      <ScrollArea className="flex-1">
                        <ul className="space-y-2">
                          {archivedRefusals.map(request => (
                            <li key={request.id} className="p-2 rounded border bg-card">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <h4 className="font-medium">{request.childName}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {request.childAge} лет • Архивирована: {
                                      request.notes?.includes('архивирована') 
                                        ? request.notes.split('архивирована')[1].split(']')[0].trim()
                                        : new Date(request.updatedAt || '').toLocaleDateString()
                                    }
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleRestoreRefusal(request)}
                                  disabled={restoring}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                              </div>
                              {request.notes && (
                                <div className="text-xs bg-muted p-2 rounded">
                                  {request.notes.replace(/\[Заявка автоматически архивирована[^\]]*\]/g, '')}
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
                
                <TabsContent value="stats" className="h-full overflow-auto">
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
                      <div className="text-center p-8 text-muted-foreground">
                        Нет данных для анализа статистики отказов
                      </div>
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}