import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Settings as SettingsIcon, User, Building, Bell } from "lucide-react";
import { Layout } from "@/components/layout/navbar";

import GeneralSettings from "./components/GeneralSettings";
import ProfileSettings from "./components/ProfileSettings";
import BranchesSettings from "./components/BranchesSettings";
import NotificationsSettings from "./components/NotificationsSettings";

export default function SettingsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SettingsIcon className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Настройки</h1>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="flex items-center">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Общие
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Филиалы и секции
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Уведомления
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="branches">
          <BranchesSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}