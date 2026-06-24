import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Award, Download, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"

export default function CertificationButton({ totalDonations }) {
    const { data: session } = useSession()
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownloadCertificate = async () => {
        try {
            setIsDownloading(true)
            const response = await fetch('/api/user/certificate', {
                method: 'POST',
            })

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.style.display = 'none'
                a.href = url
                a.download = `donation-certificate-${session?.user?.username || 'user'}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to download certificate')
            }
        } catch (error) {
            console.error('Error downloading certificate:', error)
            // You could add a toast notification here
        } finally {
            setIsDownloading(false)
        }
    }

    // Only show button if user has made donations
    if (totalDonations === 0) {
        return null
    }

    return (
        <Button
            onClick={handleDownloadCertificate}
            disabled={isDownloading}
            className="flex items-center gap-2"
        >
            {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Award className="h-4 w-4" />
            )}
            {isDownloading ? 'Generating...' : 'Get Donation Certificate'}
            {!isDownloading && <Download className="h-4 w-4" />}
        </Button>
    )
}
