import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExtendedTrialRequestForm } from '@/hooks/use-trial-request';

/**
 * Пропсы для компонента полей формы запроса пробного занятия
 * Следует Interface Segregation Principle - компонент принимает только те пропсы, 
 * которые ему действительно нужны
 */
type RequestFormFieldsProps = {
  form: UseFormReturn<ExtendedTrialRequestForm>;
  sections: any[];
  sectionId: number | undefined;
  branchesForSection: any[];
  branchesLoading: boolean;
};

export const RequestFormFields = ({
  form,
  sections,
  sectionId,
  branchesForSection,
  branchesLoading
}: RequestFormFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="childName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ФИО ребёнка</FormLabel>
            <FormControl>
              <Input placeholder="Введите ФИО ребёнка" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="childAge"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Возраст</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Введите возраст"
                {...field}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value ? parseInt(value) : undefined);
                }}
                min="3"
                max="18"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="parentName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ФИО родителя</FormLabel>
            <FormControl>
              <Input placeholder="Введите ФИО родителя" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="parentPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Телефон родителя</FormLabel>
            <FormControl>
              <Input
                placeholder="+7XXXXXXXXXX"
                {...field}
                onChange={(e) => {
                  let value = e.target.value;
                  // Ensure the value starts with +7
                  if (!value.startsWith('+7')) {
                    value = '+7' + value.replace(/[^\d]/g, '');
                  } else {
                    value = value.replace(/[^\d+]/g, '');
                  }
                  // Limit to 12 characters (+7 plus 10 digits)
                  value = value.slice(0, 12);
                  field.onChange(value);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      

      
      <FormField
        control={form.control}
        name="sectionId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Секция</FormLabel>
            <Select
              onValueChange={(value) => {
                console.log('Selected section value:', value);
                // Безопасное преобразование в число
                try {
                  const numValue = value ? parseInt(value) : undefined;
                  console.log('Converted section ID:', numValue);
                  field.onChange(numValue);
                  
                  // Сбрасываем branchId при смене секции
                  form.setValue("branchId", "" as any);
                } catch (error) {
                  console.error("Error converting section ID:", error);
                }
              }}
              value={field.value?.toString() || ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите секцию" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Array.isArray(sections) ? (
                  sections.map((section) => {
                    console.log('Section data:', section);
                    return (
                      <SelectItem
                        key={section.id}
                        value={section.id.toString()}
                      >
                        {section.name}
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="" disabled>
                    Нет доступных секций
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {sectionId && !branchesLoading && (
        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Отделение</FormLabel>
              <Select
                onValueChange={(value) => {
                  console.log('Selected branch value:', value);
                  try {
                    const numValue = value ? Number(value) : ('' as any);
                    console.log('Converted branch ID:', numValue);
                    field.onChange(numValue);
                  } catch (error) {
                    console.error("Error converting branch ID:", error);
                  }
                }}
                value={field.value?.toString() || ''}
                disabled={!sectionId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите отделение" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {branchesForSection?.map((branch) => (
                    <SelectItem
                      key={branch.id}
                      value={branch.id.toString()}
                    >
                      {branch.name} - {branch.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};