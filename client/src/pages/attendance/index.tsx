import { useState } from "react";
import { Layout } from "@/components/layout/navbar";
import { Group } from "@shared/schema";
import { AttendanceTable } from "./components/AttendanceTable";
import { GroupsList } from "./components/GroupsList";
import { useGroups } from "./hooks/useGroups";

export default function AttendancePage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { groups } = useGroups();

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Посещаемость</h1>

        {/* Groups List */}
        <GroupsList 
          groups={groups} 
          selectedGroup={selectedGroup} 
          onGroupSelect={setSelectedGroup} 
        />

        {/* Attendance Table Modal */}
        {selectedGroup && (
          <AttendanceTable
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
          />
        )}
      </div>
    </Layout>
  );
}
