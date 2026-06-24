import { Suspense } from "react"
import Navbar from '@/components/Navbar'
import UserDashboardContent from '@/components/dashboard/UserDashboardContent'
import DashboardLoading from '@/components/dashboard/DashboardLoading'

const page = () => {
    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                        <p className="text-gray-600 mt-2">Track your donations and impact on research projects</p>
                    </div>
                </div>

                <Suspense fallback={<DashboardLoading />}>
                    <UserDashboardContent />
                </Suspense>
            </div>
        </div>
    )
}

export default page