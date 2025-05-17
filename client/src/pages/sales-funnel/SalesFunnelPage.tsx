import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTrialRequests } from "./hooks/useTrialRequests";
import { Loader2, Archive, Clock } from "lucide-react";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { EditTrialRequestModal } from "./components/EditTrialRequestModal";
import { AssignTrialModal } from "./components/AssignTrialModal";
import { RejectTrialModal } from "./components/RejectTrialModal";
import { TrialRequestCard } from "./components/TrialRequestCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { RefusalArchiveService } from "./services/RefusalArchiveService";

type StatusColumn = {
  id: keyof typeof TrialRequestStatus;
  title: string;
};

const statusColumns: StatusColumn[] = [
  { id: "NEW", title: "Новые заявки" },
  { id: "TRIAL_ASSIGNED", title: "Пробное назначено" },
  { id: "REFUSED", title: "Отказ" },
  { id: "SIGNED", title: "Записан" },
];

/**
 * Компонент страницы воронки продаж
 * Отвечает за отображение и взаимодействие с заявками на пробные занятия
 * Следует принципу открытости/закрытости (OCP) из SOLID
 */
export default function SalesFunnelPage() {
  const { requests = [], isLoading, updateStatus } = useTrialRequests();
  const [selectedRequest, setSelectedRequest] = useState<ExtendedTrialRequest | null>(null);
  const [showAssignTrialModal, setShowAssignTrialModal] = useState(false);
  const [showRejectTrialModal, setShowRejectTrialModal] = useState(false);
  // Используем useLocation для перехода на страницу архива
  const [_, setLocation] = useLocation();
  const [draggedRequest, setDraggedRequest] = useState<{
    id: number;
    sourceStatus: string;
    targetStatus: string;
    request: ExtendedTrialRequest;
  } | null>(null);
  
  // Отфильтрованные отказы для статистики
  const [refusedRequests, setRefusedRequests] = useState<ExtendedTrialRequest[]>([]);
  
  // Обновляем список отказов при изменении основного списка заявок
  useEffect(() => {
    if (requests) {
      // Отбираем только неархивированные отказы для отображения
      const refusals = requests.filter(
        request => request.status === TrialRequestStatus.REFUSED &&
                  // Проверяем, не архивирована ли заявка
                  request.notes?.indexOf('архивирована') === -1
      );
      setRefusedRequests(refusals);
    }
  }, [requests]);

  /**
   * Обработчик события окончания перетаскивания
   * Управляет изменением статуса заявки при перетаскивании и обеспечивает плавный UI
   */
  const handleDragEnd = (result: DropResult) => {
    // Проверяем, есть ли пункт назначения
    if (!result.destination) {
      console.log('No destination');
      return;
    }

    // Получаем ID и статусы
    const requestId = parseInt(result.draggableId);
    const sourceStatus = result.source.droppableId;
    const targetStatus = result.destination.droppableId;

    console.log('Dragging request:', { requestId, sourceStatus, targetStatus });

    // Если карточка уже была в колонке, не делаем ничего
    if (sourceStatus === targetStatus) {
      console.log('Same column, no action needed');
      return;
    }

    // Находим request по ID
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      console.error('Request not found:', requestId);
      return;
    }

    console.log('Found request:', request);

    // Создаем копию запроса для оптимистичного UI-обновления
    const requestCopy = { ...request };
    
    // Сохраняем информацию о перетаскивании для последующего использования
    setDraggedRequest({
      id: requestId,
      sourceStatus,
      targetStatus,
      request: requestCopy
    });

    // Если перетаскиваем в "Пробное назначено", открываем модальное окно назначения
    if (targetStatus === "TRIAL_ASSIGNED") {
      console.log('Opening assign trial modal for request:', request);
      setSelectedRequest(requestCopy);
      setShowAssignTrialModal(true);
      
      // Оптимистично обновляем UI, меняя статус в карточке
      // Это позволит карточке остаться в целевой колонке до завершения действия
      updateStatus({ 
        id: requestId, 
        status: targetStatus
      });
      return;
    }
    
    // Если перетаскиваем в "Отказ", открываем модальное окно для указания причин отказа
    if (targetStatus === "REFUSED") {
      console.log('Opening reject trial modal for request:', request);
      setSelectedRequest(requestCopy);
      setShowRejectTrialModal(true);
      
      // Оптимистично обновляем UI, меняя статус в карточке
      // Это позволит карточке остаться в целевой колонке до завершения действия
      updateStatus({ 
        id: requestId, 
        status: targetStatus
      });
      return;
    }

    // Для остальных статусов сразу обновляем статус
    console.log('Updating status to:', targetStatus);
    updateStatus({ 
      id: requestId, 
      status: targetStatus
    });
  };

  const requestsByStatus = statusColumns.reduce((acc, column) => {
    // Фильтруем заявки по статусу, исключая архивированные для колонки "Отказ"
    acc[column.id] = requests.filter(r => {
      // Проверяем статус
      const statusMatches = r.status && r.status.toUpperCase() === column.id;
      
      // Для колонки "Отказ" дополнительно проверяем, что заявка не архивирована
      if (column.id === "REFUSED") {
        // Используем сервис для проверки, является ли заявка архивированной
        const isArchived = RefusalArchiveService.isArchived(r);
        if (isArchived) {
          console.log(`Заявка ${r.id} скрыта из колонки "Отказ", т.к. архивирована (${r.notes})`);
        }
        return statusMatches && !isArchived;
      }
      
      // Для остальных колонок просто проверяем статус
      return statusMatches;
    });
    
    return acc;
  }, {} as Record<keyof typeof TrialRequestStatus, ExtendedTrialRequest[]>);

  const handleEdit = (request: ExtendedTrialRequest) => {
    console.log('Editing request:', request);
    setSelectedRequest(request);
    setShowAssignTrialModal(false);
  };

  const handleAssignTrial = (request: ExtendedTrialRequest) => {
    console.log('Assigning trial for request:', request);
    setSelectedRequest(request);
    setShowAssignTrialModal(true);
  };
  
  /**
   * Обработчик отказа от пробного занятия
   * Открывает модальное окно с формой для указания причин отказа
   */
  const handleReject = (request: ExtendedTrialRequest) => {
    console.log('Rejecting trial request:', request);
    setSelectedRequest(request);
    setShowRejectTrialModal(true);
  };

  const handleModalClose = () => {
    console.log('Закрытие модального окна');
    
    // Проверяем, был ли драг перед открытием модального окна
    if (draggedRequest) {
      console.log('Был обнаружен драг, перемещаем карточку обратно, если необходимо');
      console.log('Dragged request:', draggedRequest);
      
      if (draggedRequest.targetStatus === "TRIAL_ASSIGNED" || draggedRequest.targetStatus === "REFUSED") {
        // Если модальное окно было открыто после перетаскивания в колонку "Пробное назначено" или "Отказ",
        // но пользователь его закрыл без назначения, возвращаем карточку в исходную колонку
        updateStatus({
          id: draggedRequest.id, 
          status: draggedRequest.sourceStatus
        });
      }
    }
    
    // Сбрасываем состояние
    setSelectedRequest(null);
    setShowAssignTrialModal(false);
    setShowRejectTrialModal(false);
    setDraggedRequest(null);
  };

  const handleSuccess = () => {
    // Если было перетаскивание, обновляем статус
    if (draggedRequest && selectedRequest) {
      console.log('Successfully assigned trial, updating status to:', draggedRequest.targetStatus);
      // Статус уже обновлен из модального окна, не нужно вызывать здесь updateStatus
    }
    
    // Очищаем состояние
    setSelectedRequest(null);
    setShowAssignTrialModal(false);
    setDraggedRequest(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Воронка продаж</CardTitle>
            {refusedRequests.length > 0 && (
              <CardDescription>
                Количество отказов: {refusedRequests.length}
              </CardDescription>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => setLocation('/refusal-archive')}
          >
            <Archive className="h-4 w-4" />
            Архив отказов
          </Button>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-4 gap-4">
              {statusColumns.map(column => (
                <div key={column.id} className="bg-muted/50 rounded-lg p-4 flex flex-col">
                  <h3 className="font-medium mb-4">{column.title}</h3>
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[300px] flex-1 rounded-md p-2 transition-colors duration-200 ${
                          snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-muted/30'
                        }`}
                        style={{ display: 'flex', flexDirection: 'column' }}
                      >
                        {requestsByStatus[column.id].length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center py-10 text-muted-foreground text-sm italic">
                            Перетащите сюда карточку
                          </div>
                        )}
                        
                        {requestsByStatus[column.id].map((request, index) => (
                          <Draggable
                            key={request.id}
                            draggableId={request.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transition-transform ${
                                  snapshot.isDragging ? 'scale-[1.02] shadow-lg' : ''
                                }`}
                              >
                                <TrialRequestCard
                                  request={request}
                                  onEdit={handleEdit}
                                  onAssignTrial={handleAssignTrial}
                                  onReject={handleReject}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>

      {selectedRequest && !showAssignTrialModal && (
        <EditTrialRequestModal
          request={selectedRequest}
          isOpen={true}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {selectedRequest && showAssignTrialModal && (
        <AssignTrialModal
          request={selectedRequest}
          isOpen={showAssignTrialModal}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {selectedRequest && showRejectTrialModal && (
        <RejectTrialModal
          request={selectedRequest}
          isOpen={showRejectTrialModal}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
      
      {/* Модальные окна для работы с заявками */}
    </div>
  );
}