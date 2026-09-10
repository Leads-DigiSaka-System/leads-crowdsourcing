import LegalPage from "@/components/legal/LegalPage";

export const metadata = {
  title: "Terms of Service | ResearchBayanihan",
  description: "Terms for using ResearchBayanihan, including donations, project responsibilities, refunds, submitted content, and platform updates.",
  alternates: { canonical: "https://impactofresearch.fund/terms-of-service" },
};

const sections = [
  {
    id: "using-the-platform",
    title: "Using the platform",
    content: <p>Provide accurate information, protect your account credentials, and use the platform lawfully. Fraud, impersonation, unauthorized access, and misleading campaigns are prohibited. You must have legal capacity or appropriate authorization to transact.</p>,
  },
  {
    id: "donations",
    title: "Donations",
    content: <p>Contributions support the research project described on its campaign page. Donations do not provide equity, ownership of research outputs, or financial returns. Review the campaign’s purpose, funding conditions, and any applicable fees before donating.</p>,
  },
  {
    id: "project-responsibilities",
    title: "Project responsibilities",
    content: <p>Research teams must provide truthful campaign information, secure necessary permissions, use funds for the stated purposes, and communicate progress and material changes. Research outcomes and completion dates cannot be guaranteed.</p>,
  },
  {
    id: "refunds-and-changes",
    title: "Refunds and changes",
    content: <p>Each campaign must state, before donation, what happens if its target is unmet or the project is cancelled, including refund eligibility, timing, and any deductions. Automated refunds apply only where expressly offered. For payment errors or refund concerns, contact <a href="mailto:main@impactrd.org">main@impactrd.org</a>. These terms do not limit rights provided by law.</p>,
  },
  {
    id: "content-and-service-availability",
    title: "Content and service availability",
    content: <p>Contributors retain rights to their submitted materials and authorize their display for campaign operation and promotion. Submit only content you have permission to share. Platform availability and third-party payment or blockchain services may experience interruptions.</p>,
  },
  {
    id: "enforcement-and-updates",
    title: "Enforcement and updates",
    content: <p>We may suspend accounts or campaigns for fraud, misuse, or violations, with notice where appropriate. Philippine law governs these terms. Material changes will be notified through the platform and will not retroactively alter completed donations.</p>,
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      type="terms-of-service"
      description="The terms that guide your use of ResearchBayanihan."
      introduction={<p>By using ResearchBayanihan, operated by IMPACT R&D, you agree to these terms.</p>}
      sections={sections}
      closing={<p>For questions or complaints, contact <a href="mailto:main@impactrd.org">main@impactrd.org</a>.</p>}
    />
  );
}
