import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Building2, Users, Activity, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default async function SuperPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "super") {
    redirect("/login");
  }

  // Replace with real queries
  const stats = {
    totalOrganizations: 12,
    totalUsers: 230,
    dailyActiveUsers: 87,
    rating: 4.2, // 1 to 5
  };

  return (
    <div className="space-y-6 px-6 py-4">
      <h1 className="text-3xl font-bold mb-6">Welcome, Super Admin!</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          icon={Building2}
          title="Organizations"
          value={stats.totalOrganizations.toString()}
        />
        <DashboardCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers.toString()}
        />
        <DashboardCard
          icon={Activity}
          title="Daily Active"
          value={stats.dailyActiveUsers.toString()}
        />
        <RatingCard rating={stats.rating} />
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
}) {
  return (
    <Card className="p-4 shadow-md hover:shadow-lg transition-all cursor-pointer">
      <CardContent className="flex items-center space-x-4">
        <Icon className="w-8 h-8 text-blue-600" />
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RatingCard({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <Card className="p-4 shadow-md hover:shadow-lg transition-all cursor-pointer">
      <CardContent className="flex items-center space-x-4">
        <Star className="w-8 h-8 text-yellow-500" />
        <div>
          <div className="text-sm text-muted-foreground">System Rating</div>
          <div className="flex items-center space-x-1">
            {[...Array(fullStars)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 text-yellow-500 fill-yellow-500"
              />
            ))}
            {halfStar && (
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 opacity-50" />
            )}
            {[...Array(emptyStars)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-gray-300" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
