import Footer from "@/components/Footer"
import FundingBenefits from "@/components/funding/FundingBenefits"
import Navbar from "@/components/Navbar"

const page = () => {
    return (
        <div>
            <Navbar />
            <FundingBenefits />
            <Footer />
        </div>
    )
}

export default page