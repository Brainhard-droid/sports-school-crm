import React, { useRef } from 'react';
import { format } from "date-fns";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from 'react-hook-form';
import { Calendar } from 'lucide-react';
import { ExtendedTrialRequestForm } from '@/hooks/use-trial-request';
import { SessionInfo } from '@/services/ScheduleService';

type DateSelectionProps = {
  form: UseFormReturn<ExtendedTrialRequestForm>;
  suggestedDates: SessionInfo[];
  useCustomDate: boolean;
  selectedDateValue: string | null;
  onDateSelection: (dateStr: string, timeStr: string) => void;
  onCustomDateChange: (date: string) => void;
  setUseCustomDate: (value: boolean) => void;
};

export const DateSelection = ({
  form,
  suggestedDates,
  useCustomDate,
  selectedDateValue,
  onDateSelection,
  onCustomDateChange,
  setUseCustomDate
}: DateSelectionProps) => {
  const isProcessingDateSelection = useRef(false);

  return (
    <FormField
      control={form.control}
      name="desiredDate"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Желаемая дата занятия</FormLabel>
          {suggestedDates.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                {suggestedDates.map((item, index) => {
                  const dateStr = format(item.date, "yyyy-MM-dd");
                  const isSelected = !useCustomDate && (
                    selectedDateValue === dateStr || 
                    (!selectedDateValue && field.value === dateStr)
                  );

                  return (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => {
                        if (isProcessingDateSelection.current) return;
                        isProcessingDateSelection.current = true;

                        const timeStr = item.timeLabel.split(' - ')[0];
                        onDateSelection(dateStr, timeStr);
                        
                        // Reset the processing flag after a short delay
                        setTimeout(() => {
                          isProcessingDateSelection.current = false;
                        }, 50);
                      }}
                    >
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{format(item.date, "dd.MM.yyyy")} ({item.date.toLocaleDateString("ru-RU", { weekday: 'long' })})</p>
                        <p className="text-xs text-muted-foreground">{item.timeLabel}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t">
                <RadioGroup 
                  value={useCustomDate ? "custom" : "suggested"}
                  onValueChange={(value) => setUseCustomDate(value === "custom")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="suggested" id="suggested" />
                    <Label htmlFor="suggested">Выбрать из предложенных дат</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Указать свою дату</Label>
                  </div>
                </RadioGroup>
              </div>

              {useCustomDate && (
                <FormControl>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={field.value.split('T')[0]}
                    onChange={(e) => onCustomDateChange(e.target.value)}
                  />
                </FormControl>
              )}
            </div>
          ) : (
            <FormControl>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={field.value.split('T')[0]} // Convert ISO to date format
                onChange={(e) => {
                  onCustomDateChange(e.target.value);
                  field.onChange(e);
                }}
              />
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};