"use client"
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProjectDetail from './project-detail/project-detail';
import ProjectContent from './project-content/project-content';
import ScientistsContent from './scientiest-content/scientists-content';
import ProjectBudget from './budget/project-budget';
import ProjectTimelineContent from './timeline/project-timeline-content';
import ProjectTeam from './team/project-team';
import DiscussionSection from './discussion/DiscussionSection';
import { PaymentSuccessModal } from '@/components/PaymentSuccessModal';
import DonorsSection from './donors/DonorsSection';

const ProjectPageClient = ({
  projectDetail = {},
  projectContent = {},
  scientistsContent = {},
  projectBudget = {},
  projectTimelineContent = {},
  projectTeam = {},
  projectDonors = {}
}) => {
  const searchParams = useSearchParams()

  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    // Check if payment=success is in the URL
    if (searchParams.get('payment') === 'success') {
      setShowSuccessModal(true)

      // Clean up the URL by removing the payment parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleBackProject = () => {

  }
  const handleHowItWorks = () => {

  }



  return (
    <>
      <PaymentSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        projectTitle={projectDetail?.title}
      />
      <ProjectDetail
        {...projectDetail}
        budgetItems={projectBudget?.budgetItems}
        onBackProject={handleBackProject}
        onHowItWorks={handleHowItWorks}
      />
      <DonorsSection
        donations={projectDonors?.donations || []}
        totalCount={projectDonors?.totalCount || 0}
      />
      <ProjectContent {...projectContent} />
      <ScientistsContent {...scientistsContent} />
      <ProjectBudget {...projectBudget} />
      <ProjectTimelineContent {...projectTimelineContent} />
      <ProjectTeam {...projectTeam} />
      <DiscussionSection projectId={projectDetail?.id} />
    </>
  )
}

export default ProjectPageClient
