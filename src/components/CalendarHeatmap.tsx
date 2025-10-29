import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActivityData {
  date: string;
  count: number;
}

interface CalendarHeatmapProps {
  activities: ActivityData[];
}

const CalendarHeatmap = ({ activities }: CalendarHeatmapProps) => {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // Show 52 weeks

    const weeks: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];

    // Create activity map for quick lookup
    const activityMap = new Map(
      activities.map(a => [a.date, a.count])
    );

    // Fill in all days
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      currentWeek.push({
        date: new Date(date),
        count: activityMap.get(dateStr) || 0,
      });

      if (currentWeek.length === 7 || i === 364) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    return weeks;
  }, [activities]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count <= 2) return 'bg-primary/20';
    if (count <= 5) return 'bg-primary/40';
    if (count <= 8) return 'bg-primary/60';
    return 'bg-primary';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Mon', 'Wed', 'Fri'];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-4">
        <div className="flex flex-col justify-between text-xs text-muted-foreground pr-2">
          {days.map(day => (
            <div key={day} className="h-3 flex items-center">
              {day}
            </div>
          ))}
        </div>
        
        <TooltipProvider>
          <div className="flex gap-1">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <Tooltip key={`${weekIndex}-${dayIndex}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 rounded-sm ${getColor(day.count)} hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{day.count} activities</p>
                      <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/60" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
