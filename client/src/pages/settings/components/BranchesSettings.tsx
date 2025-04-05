import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BranchFormModal, type Branch } from "./modals/BranchFormModal";
import { SectionFormModal, type Section } from "./modals/SectionFormModal";
// import { BranchSectionFormModal } from "./modals/BranchSectionFormModal";
import { ScheduleModal } from "@/components/schedule/schedule-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Edit, Trash, Plus, Calendar, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Интерфейс для данных о связи между филиалом и секцией
interface BranchSection {
  id?: number;
  branchId: number;
  sectionId: number;
  schedule: string;
  active?: boolean;
}

// Компонент матрицы связей между филиалами и секциями
function SectionBranchMatrix({ branches, sections }: { branches: Branch[]; sections: Section[] }) {
  const queryClient = useQueryClient();
  const [branchSections, setBranchSections] = useState<BranchSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  // Интерфейс для выбранной связи, используется только в UI
  interface SelectedBranchSection {
    branchId: number;
    sectionId: number;
    branchName: string;
    sectionName: string;
    schedule: string;
    id?: number;
  }
  
  const [selectedBranchSection, setSelectedBranchSection] = useState<SelectedBranchSection>({
    branchId: 0,
    sectionId: 0,
    branchName: '',
    sectionName: '',
    schedule: ''
  });

  // Загрузка данных о связях филиалов и секций
  useQuery({
    queryKey: ["/api/branch-sections"],
    queryFn: async () => {
      console.log('Fetching branch-sections data');
      setIsLoading(true);
      try {
        // Загружаем только активные связи
        const response = await fetch("/api/branch-sections");
        if (!response.ok) {
          throw new Error("Ошибка загрузки связей филиалов и секций");
        }
        const data = await response.json();
        console.log('Received branch-sections data:', data);
        setBranchSections(data);
        return data;
      } catch (error) {
        console.error("Ошибка при загрузке связей:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить связи филиалов и секций",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    staleTime: 0, // Всегда получать свежие данные
  });

  // Проверка наличия связи между филиалом и секцией
  const hasConnection = (branchId: number, sectionId: number) => {
    console.log('Checking connection', { branchId, sectionId, branchSections });
    return branchSections.some(
      (bs) => bs.branchId === branchId && bs.sectionId === sectionId && bs.active
    );
  };

  // Обработчик клика по чекбоксу
  const handleConnectionToggle = async (branchId: number, sectionId: number, hasLink: boolean) => {
    if (hasLink) {
      // Найти существующую связь и деактивировать
      const existingLink = branchSections.find(
        (bs) => bs.branchId === branchId && bs.sectionId === sectionId
      );
      
      if (existingLink?.id) {
        try {
          await apiRequest("PATCH", `/api/branch-sections/${existingLink.id}`, {
            active: false
          });
          
          toast({
            title: "Связь удалена",
            description: "Связь между филиалом и секцией успешно удалена"
          });
          
          // Обновляем локальное состояние
          setBranchSections(prev => 
            prev.map(bs => bs.id === existingLink.id ? {...bs, active: false} : bs)
          );
        } catch (error) {
          toast({
            title: "Ошибка",
            description: "Не удалось удалить связь",
            variant: "destructive"
          });
        }
      }
    } else {
      // Найти филиал и секцию для показа в модальном окне
      const branch = branches.find(b => b.id === branchId);
      const section = sections.find(s => s.id === sectionId);
      
      if (branch && section) {
        setSelectedBranchSection({
          branchId,
          sectionId,
          branchName: branch.name,
          sectionName: section.name,
          schedule: ''
        });
        setScheduleModalOpen(true);
      }
    }
  };

  // Получение расписания для связи
  const getSchedule = (branchId: number, sectionId: number) => {
    const link = branchSections.find(
      (bs) => bs.branchId === branchId && bs.sectionId === sectionId && bs.active
    );
    return link?.schedule || '';
  };

  // Обработчик клика по кнопке редактирования расписания
  const handleEditSchedule = (branchId: number, sectionId: number) => {
    const branch = branches.find(b => b.id === branchId);
    const section = sections.find(s => s.id === sectionId);
    const existingLink = branchSections.find(
      (bs) => bs.branchId === branchId && bs.sectionId === sectionId && bs.active
    );
    
    if (branch && section) {
      setSelectedBranchSection({
        branchId,
        sectionId,
        branchName: branch.name,
        sectionName: section.name,
        schedule: existingLink?.schedule || '',
        id: existingLink?.id
      });
      setScheduleModalOpen(true);
    }
  };

  // Обработчик сохранения расписания
  const handleSaveSchedule = async (formattedSchedule: string) => {
    try {
      if (selectedBranchSection.id) {
        // Обновление существующей связи
        await apiRequest("PATCH", `/api/branch-sections/${selectedBranchSection.id}`, {
          schedule: formattedSchedule
        });
        
        // Обновляем локальное состояние
        setBranchSections(prev => 
          prev.map(bs => bs.id === selectedBranchSection.id 
            ? {...bs, schedule: formattedSchedule}
            : bs
          )
        );
        
        toast({
          title: "Расписание обновлено",
          description: "Расписание секции в филиале обновлено"
        });
      } else {
        // Создание новой связи
        console.log('Creating new branch-section connection', {
          branchId: selectedBranchSection.branchId,
          sectionId: selectedBranchSection.sectionId,
          schedule: formattedSchedule,
          active: true
        });
        
        const newLink = await apiRequest("POST", "/api/branch-sections", {
          branchId: selectedBranchSection.branchId,
          sectionId: selectedBranchSection.sectionId,
          schedule: formattedSchedule,
          active: true
        }).then(res => res.json());
        
        // Добавляем в локальное состояние
        setBranchSections(prev => [...prev, newLink]);
        
        toast({
          title: "Связь создана",
          description: "Секция успешно добавлена в филиал с расписанием"
        });
      }
      
      // Обновляем кэш запроса
      queryClient.invalidateQueries({ queryKey: ["/api/branch-sections"] });
    } catch (error) {
      console.error("Ошибка при сохранении расписания:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить расписание",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full bg-background">
            <thead>
              <tr>
                <th className="p-3 text-left font-medium border-b min-w-40">Филиалы / Секции</th>
                {sections.map((section) => (
                  <th key={section.id} className="p-3 text-center font-medium border-b min-w-40">
                    {section.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium">{branch.name}</td>
                  {sections.map((section) => {
                    const connected = hasConnection(branch.id!, section.id!);
                    const schedule = getSchedule(branch.id!, section.id!);
                    
                    return (
                      <td key={section.id} className="p-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center">
                            <Checkbox
                              id={`connection-${branch.id}-${section.id}`}
                              checked={connected}
                              onCheckedChange={() => handleConnectionToggle(branch.id!, section.id!, connected)}
                            />
                          </div>
                          {connected && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditSchedule(branch.id!, section.id!)}
                              className="text-xs flex items-center"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              {schedule ? 'Изменить расписание' : 'Добавить расписание'}
                            </Button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Новый компонент ScheduleModal для управления расписанием */}
      {scheduleModalOpen && (
        <ScheduleModal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onSave={handleSaveSchedule}
          title={selectedBranchSection.id ? "Редактирование расписания" : "Добавление расписания"}
          initialSchedule={selectedBranchSection.schedule}
          entityName={`Филиал: ${selectedBranchSection.branchName} | Секция: ${selectedBranchSection.sectionName}`}
        />
      )}
    </div>
  );
}

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
          <TabsTrigger value="branch-sections">Связи филиалов и секций</TabsTrigger>
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
          ) : branches.filter((branch: Branch) => branch.active).length === 0 ? (
            <div className="text-center p-6 border rounded-md">
              Нет доступных филиалов. Добавьте новый филиал.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.filter((branch: Branch) => branch.active).map((branch: Branch) => (
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
          ) : sections.filter((section: Section) => section.active).length === 0 ? (
            <div className="text-center p-6 border rounded-md">
              Нет доступных секций. Добавьте новую секцию.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.filter((section: Section) => section.active).map((section: Section) => (
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
        
        <TabsContent value="branch-sections" className="mt-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Связи филиалов и секций</h3>
            <Button onClick={() => {
              // Принудительное обновление всех данных
              queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
              queryClient.invalidateQueries({ queryKey: ["/api/sports-sections"] });
              queryClient.invalidateQueries({ queryKey: ["/api/branch-sections"] });
              
              toast({
                title: "Данные обновлены",
                description: "Список связей филиалов и секций обновлен",
              });
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить данные
            </Button>
          </div>
          
          {branchesLoading || sectionsLoading ? (
            <div className="text-center p-6">Загрузка...</div>
          ) : branches.filter((branch: Branch) => branch.active).length === 0 || sections.filter((section: Section) => section.active).length === 0 ? (
            <div className="text-center p-6 border rounded-md">
              Необходимо добавить активные филиалы и секции перед настройкой связей между ними.
            </div>
          ) : (
            <div className="grid gap-6">
              <SectionBranchMatrix 
                branches={branches.filter((branch: Branch) => branch.active)} 
                sections={sections.filter((section: Section) => section.active)} 
              />
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