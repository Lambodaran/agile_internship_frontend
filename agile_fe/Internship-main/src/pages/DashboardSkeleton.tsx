import OverviewSkeleton from "../components/Skeleton/TeamDashboard/OverviewSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

const SidebarSkeleton = () => {
  return (
    <aside className="fixed top-0 left-0 z-50 h-screen w-64 bg-gray-100 dark:bg-gray-900 p-4 hidden lg:flex flex-col">
      <div className="mb-8">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-3 flex-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
      <div className="mt-auto">
        <Skeleton className="h-10 w-full" />
      </div>
    </aside>
  )
}

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex">
      <SidebarSkeleton />
      <main className="flex-1 lg:ml-64">
        <div className="flex items-center justify-between p-4 border-b lg:hidden">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="container mx-auto px-4 py-6">
          <OverviewSkeleton />
        </div>
      </main>
    </div>
  )
}

export default DashboardSkeleton
