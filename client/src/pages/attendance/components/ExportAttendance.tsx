import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

interface ExportAttendanceProps {
  handleExport: (format: "csv" | "pdf") => void;
}

const ExportAttendance = ({ handleExport }: ExportAttendanceProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport("csv")}>Excel (CSV)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportAttendance;
