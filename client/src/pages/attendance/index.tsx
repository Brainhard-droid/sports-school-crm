import { useState } from "react";
import { Layout } from "@/components/layout/navbar";
import { ExtendedGroup } from "@shared/schema";
import { GroupsList } from "./components/GroupsList";
import { AttendanceTable } from "./components/AttendanceTable";
import { useGroups } from "./hooks/useGroups";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function AttendancePage() {
  const [selectedGroup, setSelectedGroup] = useState<ExtendedGroup | null>(null);
  const { groups, isLoading } = useGroups();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Посещаемость</h1>
        <GroupsList
          groups={groups}
          onGroupSelect={setSelectedGroup}
        />

        {/* Use Dialog to show attendance table */}
        <Dialog 
          open={!!selectedGroup} 
          onOpenChange={(open) => !open && setSelectedGroup(null)}
          modal
        >
          {selectedGroup && (
            <DialogContent className="max-w-[95vw] w-fit">
              <AttendanceTable
                group={selectedGroup}
                onClose={() => setSelectedGroup(null)}
              />
            </DialogContent>
          )}
        </Dialog>
      </div>
    </Layout>
  );
}