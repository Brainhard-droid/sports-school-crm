import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BranchFormModal, type Branch } from "./modals/BranchFormModal";
import { SectionFormModal, type Section } from "./modals/SectionFormModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Edit, Trash, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function BranchesSettings() {
  const [openBranchModal, setOpenBranchModal] = useState(false);
  const [openSectionModal, setOpenSectionModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>(undefined);
  const [selectedSection, setSelectedSection] = useState<Section | undefined>(undefined);
  
  const queryClient = useQueryClient();

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/branches"],
    queryFn: async () => {
      const response = await fetch("/api/branches");
      if (!response.ok) {
        throw new Error("Ошибка загрузки филиалов");
      }
      return response.json();
    },
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/sports-sections"],
    queryFn: async () => {
      const response = await fetch("/api/sports-sections");
      if (!response.ok) {
        throw new Error("Ошибка загрузки секций");
      }
      return response.json();
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({
        title: "Филиал удален",
        description: "Филиал был успешно удален",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить филиал: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sports-sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sports-sections"] });
      toast({
        title: "Секция удалена",
        description: "Спортивная секция была успешно удалена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить секцию: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setOpenBranchModal(true);
  };

  const handleDeleteBranch = (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить этот филиал?")) {
      deleteBranchMutation.mutate(id);
    }
  };

  const handleAddBranch = () => {
    setSelectedBranch(undefined);
    setOpenBranchModal(true);
  };

  const handleEditSection = (section: Section) => {
    setSelectedSection(section);
    setOpenSectionModal(true);
  };

  const handleDeleteSection = (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить эту секцию?")) {
      deleteSectionMutation.mutate(id);
    }
  };

  const handleAddSection = () => {
    setSelectedSection(undefined);
    setOpenSectionModal(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Филиалы и секции</h2>
      
      <Tabs defaultValue="branches" className="w-full">
        <TabsList>
          <TabsTrigger value="branches">Филиалы</TabsTrigger>
          <TabsTrigger value="sections">Спортивные секции</TabsTrigger>
        </TabsList>
        
        <TabsContent value="branches" className="mt-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Список филиалов</h3>
            <Button onClick={handleAddBranch}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить филиал
            </Button>
          </div>
          
          {branchesLoading ? (
            <div className="text-center p-6">Загрузка...</div>
          ) : branches.length === 0 ? (
            <div className="text-center p-6 border rounded-md">
              Нет доступных филиалов. Добавьте новый филиал.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((branch: Branch) => (
                <Card key={branch.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{branch.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBranch(branch)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => branch.id && handleDeleteBranch(branch.id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>
                      {branch.active ? "Активен" : "Неактивен"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p className="mb-1"><strong>Адрес:</strong> {branch.address}</p>
                      <p><strong>Телефон:</strong> {branch.phone || "Не указан"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sections" className="mt-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Список спортивных секций</h3>
            <Button onClick={handleAddSection}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить секцию
            </Button>
          </div>
          
          {sectionsLoading ? (
            <div className="text-center p-6">Загрузка...</div>
          ) : sections.length === 0 ? (
            <div className="text-center p-6 border rounded-md">
              Нет доступных секций. Добавьте новую секцию.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((section: Section) => (
                <Card key={section.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{section.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSection(section)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => section.id && handleDeleteSection(section.id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>
                      {section.active ? "Активна" : "Неактивна"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p>{section.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {openBranchModal && (
        <BranchFormModal
          isOpen={openBranchModal}
          onClose={() => setOpenBranchModal(false)}
          branch={selectedBranch}
        />
      )}
      
      {openSectionModal && (
        <SectionFormModal
          isOpen={openSectionModal}
          onClose={() => setOpenSectionModal(false)}
          section={selectedSection}
        />
      )}
    </div>
  );
}