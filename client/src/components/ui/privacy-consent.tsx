import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { FormField, FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";

interface PrivacyConsentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  id?: string;
}

/**
 * Компонент для получения согласия на обработку персональных данных
 */
export function PrivacyConsent({
  checked,
  onCheckedChange,
  className = "",
  id = "privacy-consent",
}: PrivacyConsentProps) {
  const { t } = useTranslation();
  
  return (
    <div className={`flex items-start space-x-2 ${className}`}>
      <Checkbox 
        id={id} 
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none cursor-pointer"
        >
          {t("Я даю согласие на обработку")} <Link to="/privacy-policy" className="text-primary hover:underline">{t("персональных данных")}</Link>
        </label>
        <p className="text-xs text-muted-foreground">
          {t("Ваши данные будут использованы только для связи с вами и предоставления услуг")}
        </p>
      </div>
    </div>
  );
}

/**
 * Компонент для использования в формах с react-hook-form
 */
export function PrivacyConsentFormField({
  name,
  ...props
}: PrivacyConsentProps & { name: string, children?: React.ReactNode }) {
  const form = useFormContext();
  const { t } = useTranslation();
  
  if (!form) {
    throw new Error("PrivacyConsentFormField должен использоваться внутри FormProvider");
  }
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
          <FormControl>
            <Checkbox
              id={props.id || name}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange({
                  target: {
                    name,
                    value: checked,
                  },
                } as unknown as React.ChangeEvent<HTMLInputElement>);
              }}
            />
          </FormControl>
          <FormLabel className="text-sm font-normal" htmlFor={props.id || name}>
            {props.children || (
              <>
                {t("Я даю согласие на обработку")} <Link to="/privacy-policy" className="text-primary hover:underline">{t("персональных данных")}</Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Ваши данные будут использованы только для связи с вами и предоставления услуг")}
                </p>
              </>
            )}
          </FormLabel>
        </FormItem>
      )}
    />
  );
}