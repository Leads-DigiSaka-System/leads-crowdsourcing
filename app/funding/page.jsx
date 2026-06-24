import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import SubscriptionPlans from "@/components/funding/SubscriptionPlans"

const page = () => {
    return (
        <div>
            <Navbar />
            <SubscriptionPlans />
            <Footer />
        </div>
    )
}

export default page