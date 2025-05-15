import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrialRequests } from "./hooks/useTrialRequests";
import { Loader2 } from "lucide-react";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { EditTrialRequestModal } from "./components/EditTrialRequestModal";
import { AssignTrialModal } from "./components/AssignTrialModal";
import { RefuseTrialModal } from "./components/RefuseTrialModal";
import { TrialRequestCard } from "./components/TrialRequestCard";

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
/**
 * Компонент страницы воронки продаж
 * Отвечает за отображение и взаимодействие с заявками на пробные занятия
 * Следует принципу открытости/закрытости (OCP) из SOLID
 */
export default function SalesFunnelPage() {
  const { requests = [], isLoading, updateStatus } = useTrialRequests();
  
  // Состояния для модальных окон и выбранной заявки
  const [selectedRequest, setSelectedRequest] = useState<ExtendedTrialRequest | null>(null);
  const [showAssignTrialModal, setShowAssignTrialModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  
  // Состояние для отслеживания перетаскивания
  const [draggedRequest, setDraggedRequest] = useState<{
    id: number;
    sourceStatus: string;
    targetStatus: string;
    request: ExtendedTrialRequest;
  } | null>(null);

  /**
   * Обработчик события окончания перетаскивания
   * Управляет изменением статуса заявки при перетаскивании
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

    // Сохраняем информацию о перетаскивании для последующего использования
    setDraggedRequest({
      id: requestId,
      sourceStatus,
      targetStatus,
      request: { ...request } // Сохраняем копию запроса
    });

    // Если перетаскиваем в "Пробное назначено", открываем модальное окно
    if (targetStatus === "TRIAL_ASSIGNED") {
      console.log('Opening assign trial modal for request:', request);
      setSelectedRequest(request);
      setShowAssignTrialModal(true);
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
    acc[column.id] = requests.filter(r => r.status && r.status.toUpperCase() === column.id);
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

  const handleModalClose = () => {
    console.log('Закрытие модального окна');
    
    // Проверяем, был ли драг перед открытием модального окна
    if (draggedRequest) {
      console.log('Был обнаружен драг, перемещаем карточку обратно, если необходимо');
      console.log('Dragged request:', draggedRequest);
      
      if (draggedRequest.targetStatus === "TRIAL_ASSIGNED") {
        // Если модальное окно было открыто после перетаскивания в колонку "Пробное назначено",
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
        <CardHeader>
          <CardTitle>Воронка продаж</CardTitle>
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
    </div>
  );
}