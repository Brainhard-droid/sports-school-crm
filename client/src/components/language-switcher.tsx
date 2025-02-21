import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">{i18n.language.toUpperCase()}</span>
    </Button>
  );
}
