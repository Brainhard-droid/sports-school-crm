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
  // Установка мин/макс года для выбора
  const [monthYear, setMonthYear] = React.useState<Date>(
    props.defaultMonth || new Date()
  );

  // Переопределение метода onMonthChange, чтобы сохранять и отслеживать
  // месяц и год внутри компонента
  const handleMonthChange = (date: Date) => {
    setMonthYear(date);
    props.onMonthChange?.(date);
  };

  // Передаем кастомные значения для месяца и года нашему компоненту выбора
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      month={monthYear}
      onMonthChange={handleMonthChange}
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
        Caption: ({ displayMonth }) => (
          <CustomCaption 
            displayMonth={displayMonth} 
            onChange={handleMonthChange} 
            minYear={2000} 
            maxYear={new Date().getFullYear()}
          />
        ),
      }}
      locale={ru}
      {...props}
    />
  )
}

// Расширяем интерфейс для передачи минимального и максимального года
interface CustomCaptionProps extends CaptionProps {
  onChange: (date: Date) => void;
  minYear: number;
  maxYear: number;
}

/**
 * Компонент заголовка календаря с селекторами месяца и года
 */
function CustomCaption({ displayMonth, onChange, minYear, maxYear }: CustomCaptionProps) {
  // Полные названия месяцев
  const monthNames = React.useMemo(() => [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
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
  
  // Создаем годы для выбора в пределах minYear и maxYear
  const years = React.useMemo(() => {
    const yearsCount = maxYear - minYear + 1;
    return Array.from({ length: yearsCount }).map((_, i) => {
      const year = minYear + i;
      return {
        value: year.toString(),
        label: year.toString()
      };
    });
  }, [minYear, maxYear]);

  // Обработчики изменения месяца и года
  const handleMonthChange = (month: string) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(parseInt(month, 10));
    onChange(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(displayMonth);
    newDate.setFullYear(parseInt(year, 10));
    onChange(newDate);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-8">
      <Select
        value={currentMonth.toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="h-7 min-w-[110px] max-w-[110px] text-xs">
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
        <SelectTrigger className="h-7 min-w-[65px] max-w-[65px] text-xs">
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
