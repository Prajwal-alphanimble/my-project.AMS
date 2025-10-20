import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  GraduationCap,
  Calendar
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalEmployees: number;
  totalStudents: number;
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    rate: number;
  };
  monthlyStats: {
    averageAttendance: number;
    totalWorkingDays: number;
    holidaysCount: number;
  };
}

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: `${stats.totalEmployees} employees, ${stats.totalStudents} students`
    },
    {
      title: "Present Today", 
      value: stats.todayAttendance.present,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${stats.todayAttendance.rate.toFixed(1)}% attendance rate`
    },
    {
      title: "Absent Today",
      value: stats.todayAttendance.absent,
      icon: Clock,
      color: "text-red-600", 
      bgColor: "bg-red-50",
      description: `${stats.todayAttendance.late} late arrivals`
    },
    {
      title: "Monthly Average",
      value: `${stats.monthlyStats.averageAttendance.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: `${stats.monthlyStats.totalWorkingDays} working days`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg border shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <h3 className="text-sm font-medium text-gray-600">
                {stat.title}
              </h3>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
