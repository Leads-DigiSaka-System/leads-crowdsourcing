import { Suspense } from "react"
import Navbar from "@/components/Navbar"
import MeetingsContent from "@/components/admin/meetings/MeetingsContentWithDataTable"
import MeetingsLoading from "@/components/admin/meetings/MeetingsLoading"

export default function AdminMeetingsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting Requests</h1>
            <p className="text-gray-600 mt-2">Manage meeting requests from researchers and donors</p>
          </div>
        </div>

        <Suspense fallback={<MeetingsLoading />}>
          <MeetingsContent />
        </Suspense>
      </div>
    </div>
  )
}