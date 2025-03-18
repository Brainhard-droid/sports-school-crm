import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrialRequests } from "./hooks/useTrialRequests";
import { Loader2 } from "lucide-react";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Layout } from "@/components/layout/navbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const requestId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId as keyof typeof TrialRequestStatus;

    updateStatus({ id: requestId, status: newStatus });
  };

  const requestsByStatus = statusColumns.reduce((acc, column) => {
    console.log('Filtering for status:', column.id);
    acc[column.id] = requests.filter(r => {
      console.log('Request status:', r.status, 'Column id:', column.id, 'Match:', r.status === column.id);
      return r.status === column.id;
    });
    return acc;
  }, {} as Record<keyof typeof TrialRequestStatus, ExtendedTrialRequest[]>);

  const content = isLoading ? (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ) : (
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
                                className="bg-background rounded-md p-3 shadow-sm cursor-move hover:shadow-md transition-shadow"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <div className="font-medium">{request.childName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {request.parentPhone}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {request.section?.name}
                                </div>
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

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Детали заявки</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">ФИО ребёнка:</span>
                <span className="col-span-3">{selectedRequest.childName}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Возраст:</span>
                <span className="col-span-3">{selectedRequest.childAge} лет</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">ФИО родителя:</span>
                <span className="col-span-3">{selectedRequest.parentName}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Телефон:</span>
                <span className="col-span-3">{selectedRequest.parentPhone}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Секция:</span>
                <span className="col-span-3">{selectedRequest.section?.name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Отделение:</span>
                <span className="col-span-3">{selectedRequest.branch?.name}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return <Layout>{content}</Layout>;
}