import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, PieChart, Archive } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
interface RefusalStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  refusedRequests: ExtendedTrialRequest[];
}

/**
 * Модальное окно для отображения статистики по отказам
 * Реализует принцип единственной ответственности (SRP) из SOLID
 */
export function RefusalStatsModal({
  isOpen,
  onClose,
  refusedRequests
}: RefusalStatsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stats, setStats] = useState<RefusalStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [oldRefusals, setOldRefusals] = useState<ExtendedTrialRequest[]>([]);
  const [archiving, setArchiving] = useState(false);

  // Функция архивирования старых отказов
  const handleArchiveOldRefusals = async () => {
    if (oldRefusals.length === 0) return;
    
    setArchiving(true);
    try {
      // Архивируем старые отказы
      const archivedCount = await RefusalArchiveService.archiveBatch(oldRefusals);
      
      // Показываем уведомление об успешном архивировании
      toast({
        title: "Архивирование выполнено",
        description: `Архивировано ${archivedCount} из ${oldRefusals.length} заявок`,
        variant: archivedCount > 0 ? "default" : "destructive",
      });
      
      // Обновляем данные запросов, если были архивированы заявки
      if (archivedCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
        onClose(); // Закрываем модальное окно после успешного архивирования
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

  // Рассчитываем статистику по отказам при изменении списка отказов
  useEffect(() => {
    if (!refusedRequests.length) {
      setLoading(false);
      setStats([]);
      return;
    }

    setLoading(true);

    // Функция для анализа причин отказа и формирования статистики
    const calculateStats = () => {
      const reasons: Record<string, number> = {};
      let totalReasons = 0;

      // Проходим по всем отказам и собираем статистику
      refusedRequests.forEach(request => {
        if (!request.notes) return;

        // Извлекаем причины из примечаний (формат: "Причины отказа: причина1, причина2. Комментарий")
        const notesText = request.notes;
        if (notesText.includes('Причины отказа:')) {
          // Разбиваем текст на части
          const reasonsPart = notesText.split('Причины отказа:')[1].split('.')[0].trim();
          const reasonsList = reasonsPart.split(',').map(r => r.trim());

          // Подсчитываем количество каждой причины
          reasonsList.forEach(reason => {
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

      // Отбираем старые отказы (возрастом более 5 дней) с использованием сервиса
      const oldRefusalsFiltered = RefusalArchiveService.filterOldRefusals(refusedRequests, 5);

      setOldRefusals(oldRefusalsFiltered);
      setStats(statsArray);
      setLoading(false);
    };

    calculateStats();
  }, [refusedRequests]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Статистика по отказам
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
            </div>
          ) : stats.length > 0 ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Самые частые причины отказа</CardTitle>
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

              {oldRefusals.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Заявки для архивирования ({oldRefusals.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Эти заявки старше 5 дней и могут быть архивированы
                    </p>
                    <ScrollArea className="h-[120px]">
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
                  <CardFooter className="pt-0">
                    <Button 
                      onClick={handleArchiveOldRefusals} 
                      size="sm" 
                      className="w-full gap-1"
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
                          Архивировать все ({oldRefusals.length})
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Нет данных для анализа статистики отказов</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}