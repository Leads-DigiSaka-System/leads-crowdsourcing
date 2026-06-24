import { Suspense } from "react"
import Navbar from "@/components/Navbar"
import DonationsContent from "@/components/admin/donations/DonationsContent"
import DonationsLoading from "@/components/admin/donations/DonationsLoading"

export default function AdminDonationsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
            <p className="text-gray-600 mt-2">Monitor and analyze donation transactions</p>
          </div>
        </div>

        <Suspense fallback={<DonationsLoading />}>
          <DonationsContent />
        </Suspense>
      </div>
    </div>
  )
}
