import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, CaptionProps } from "react-day-picker"
import { ru } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden", // Скрываем стандартный label, используем свой селектор
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Caption: (captionProps) => <CustomCaption {...captionProps} onChange={props.onMonthChange} />,
      }}
      locale={ru}
      {...props}
    />
  )
}

// Расширяем интерфейс для передачи функции обратного вызова
interface CustomCaptionProps extends CaptionProps {
  onChange?: (date: Date) => void;
}

/**
 * Компонент заголовка календаря с селекторами месяца и года
 */
function CustomCaption({ displayMonth, onChange }: CustomCaptionProps) {
  // Короткие названия месяцев для экономии места
  const monthNames = React.useMemo(() => [
    'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
  ], []);

  // Получаем текущий месяц и год
  const currentMonth = displayMonth.getMonth();
  const currentYear = displayMonth.getFullYear();
  
  // Создаем массив месяцев для селектора
  const months = React.useMemo(() => {
    return monthNames.map((name, index) => ({
      value: index.toString(),
      label: name
    }));
  }, [monthNames]);
  
  // Создаем годы для выбора (10 лет назад и 10 лет вперед)
  const years = React.useMemo(() => {
    const startYear = currentYear - 10;
    return Array.from({ length: 21 }).map((_, i) => {
      const year = startYear + i;
      return {
        value: year.toString(),
        label: year.toString()
      };
    });
  }, [currentYear]);

  // Обработчики изменения месяца и года
  const handleMonthChange = (month: string) => {
    if (!onChange) return;
    
    const newDate = new Date(displayMonth);
    newDate.setMonth(parseInt(month, 10));
    onChange(newDate);
  };

  const handleYearChange = (year: string) => {
    if (!onChange) return;
    
    const newDate = new Date(displayMonth);
    newDate.setFullYear(parseInt(year, 10));
    onChange(newDate);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-10">
      <Select
        value={currentMonth.toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="h-8 w-[80px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={currentYear.toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="h-8 w-[70px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year.value} value={year.value}>
              {year.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

Calendar.displayName = "Calendar"

export { Calendar }
