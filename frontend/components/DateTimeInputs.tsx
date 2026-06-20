import { Input } from './ui/Input';

interface DateTimeInputsProps {
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  onDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
}

export function DateTimeInputs({
  date, endDate, startTime, endTime,
  onDateChange, onEndDateChange, onStartTimeChange, onEndTimeChange,
}: DateTimeInputsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fecha inicio" type="date" value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <Input
          label="Fecha fin" type="date" value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Hora inicio" type="time" value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
        />
        <Input
          label="Hora fin" type="time" value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
        />
      </div>
    </>
  );
}
