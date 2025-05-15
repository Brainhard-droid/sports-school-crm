import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Компонент для отображения чекбокса принятия политики конфиденциальности
 * Следует принципам Single Responsibility и Dependency Inversion
 */
type PrivacyPolicyCheckboxProps = {
  privacyAccepted: boolean;
  setPrivacyAccepted: (value: boolean) => void;
};

export const PrivacyPolicyCheckbox = ({
  privacyAccepted,
  setPrivacyAccepted,
}: PrivacyPolicyCheckboxProps) => {
  return (
    <div className="flex items-start space-x-2 mt-4">
      <Checkbox
        id="privacy-policy"
        checked={privacyAccepted}
        onCheckedChange={(checked) => {
          if (typeof checked === 'boolean') {
            setPrivacyAccepted(checked);
          }
        }}
      />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor="privacy-policy"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Принимаю условия обработки персональных данных
        </label>
        <p className="text-xs text-muted-foreground">
          Нажимая на кнопку, вы даете согласие на обработку персональных данных и соглашаетесь с <a href="/privacy-policy" target="_blank" className="text-primary hover:underline">политикой конфиденциальности</a>
        </p>
      </div>
    </div>
  );
};