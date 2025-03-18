import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrialRequests } from "./hooks/useTrialRequests";
import { RequestsTable } from "./components/RequestsTable";
import { Loader2 } from "lucide-react";
import { ExtendedTrialRequest, TrialRequestStatus } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SalesFunnelPage() {
  const { requests, isLoading, updateStatus } = useTrialRequests();
  const [selectedRequest, setSelectedRequest] = useState<ExtendedTrialRequest | null>(null);

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
          <RequestsTable
            requests={requests || []}
            onStatusChange={(id, status) => updateStatus({ id, status })}
            onRequestClick={setSelectedRequest}
          />
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
                <span className="font-medium">Филиал:</span>
                <span className="col-span-3">{selectedRequest.branch?.name}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
