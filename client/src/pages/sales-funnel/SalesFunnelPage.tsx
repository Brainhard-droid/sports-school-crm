import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrialRequests } from "./hooks/useTrialRequests";
import { Loader2 } from "lucide-react";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Layout } from "@/components/layout/navbar";
import { EditTrialRequestModal } from "./components/EditTrialRequestModal";
import { AssignTrialModal } from "./components/AssignTrialModal";
import { TrialRequestCard } from "./components/TrialRequestCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

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

export default function SalesFunnelPage() {
  const { requests = [], isLoading, updateStatus } = useTrialRequests();
  const [selectedRequest, setSelectedRequest] = useState<ExtendedTrialRequest | null>(null);
  const [showAssignTrialModal, setShowAssignTrialModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const requestId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId as keyof typeof TrialRequestStatus;

    if (newStatus === "TRIAL_ASSIGNED") {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        setSelectedRequest(request);
        setShowAssignTrialModal(true);
      }
      return;
    }

    updateStatus({ id: requestId, status: newStatus });
  };

  const requestsByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = requests.filter(r => r.status === column.id);
    return acc;
  }, {} as Record<keyof typeof TrialRequestStatus, ExtendedTrialRequest[]>);

  const handleEdit = (request: ExtendedTrialRequest) => {
    setSelectedRequest(request);
    setShowAssignTrialModal(false);
  };

  const handleAssignTrial = (request: ExtendedTrialRequest) => {
    setSelectedRequest(request);
    setShowAssignTrialModal(true);
  };

  const handleRescheduleTrial = (request: ExtendedTrialRequest) => {
    setSelectedRequest(request);
    setShowAssignTrialModal(true);
  };

  const handleCancelTrial = (request: ExtendedTrialRequest) => {
    setSelectedRequest(request);
    setShowCancelDialog(true);
  };

  const confirmCancelTrial = async () => {
    if (!selectedRequest) return;

    try {
      await updateStatus({ 
        id: selectedRequest.id, 
        status: "NEW",
        scheduledDate: undefined
      });

      toast({
        title: "Пробное занятие отменено",
        description: "Заявка возвращена в статус 'Новая'",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отменить пробное занятие",
        variant: "destructive",
      });
    }

    setShowCancelDialog(false);
    setSelectedRequest(null);
  };

  const handleModalClose = () => {
    setSelectedRequest(null);
    setShowAssignTrialModal(false);
  };

  const handleSuccess = () => {
    setSelectedRequest(null);
    setShowAssignTrialModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Воронка продаж</CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-4 gap-4">
                {statusColumns.map(column => (
                  <div key={column.id} className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-medium mb-4">{column.title}</h3>
                    <Droppable droppableId={column.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-2 min-h-[200px]"
                        >
                          {requestsByStatus[column.id].map((request, index) => (
                            <Draggable
                              key={request.id}
                              draggableId={request.id.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TrialRequestCard
                                    request={request}
                                    onEdit={handleEdit}
                                    onAssignTrial={handleAssignTrial}
                                    onRescheduleTrial={handleRescheduleTrial}
                                    onCancelTrial={handleCancelTrial}
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

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Отменить пробное занятие?</AlertDialogTitle>
              <AlertDialogDescription>
                Заявка будет возвращена в статус "Новая". Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancelTrial}>
                Подтвердить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}