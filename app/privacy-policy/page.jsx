import LegalPage from "@/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy | ResearchBayanihan",
  description: "How ResearchBayanihan collects, uses, shares, and protects personal information, and how to contact IMPACT R&D about your privacy rights.",
  alternates: { canonical: "https://impactofresearch.fund/privacy-policy" },
};

const sections = [
  {
    id: "information-we-collect",
    title: "Information we collect and use",
    content: <p>Depending on how you use the platform, we may collect your name, contact details, account information, researcher or project details, donation and transaction records, and basic device and website usage data. We use these to manage accounts, review projects, facilitate donations, provide updates, respond to inquiries, prevent misuse, and meet legal obligations. Processing is based on your consent, service requirements, legal obligations, or legitimate interests, as applicable.</p>,
  },
  {
    id: "sharing-and-public-records",
    title: "Sharing and public records",
    content: <p>We share necessary information with authorized personnel, service providers, relevant project teams, or authorities where legally required. We do not sell personal information. Research profiles and campaign information submitted for publication are publicly visible. Blockchain transaction references and associated on-chain information are public and may remain permanently accessible.</p>,
  },
  {
    id: "protection-and-retention",
    title: "Protection and retention",
    content: <p>We apply reasonable safeguards and retain personal information only as needed for the stated purposes and legal requirements. Public blockchain records generally cannot be changed or deleted.</p>,
  },
  {
    id: "your-rights-and-contact",
    title: "Your rights and contact",
    content: <p>Subject to applicable law, you may request access, correction, deletion or blocking, and portability of your personal information that is publicly visible; object to processing; or withdraw consent where processing relies on consent. Contact <a href="mailto:main@impactrd.org">main@impactrd.org</a>, or write to IMPACT R&D, 47 Razburg Bldg., Manese St., San Agustin, Bay, Laguna. You may also lodge a complaint with the National Privacy Commission.</p>,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      type="privacy-policy"
      description="How we collect, use, and protect your personal information."
      introduction={<p>ResearchBayanihan is operated by Innovative Multidisciplinary R&D Projects for Accelerating Community Transformation (IMPACT R&D) Incorporated, non-stock and non-profit research organization in the Philippines. We respect your privacy and handle personal information in accordance with the Philippine Data Privacy Act of 2012.</p>}
      sections={sections}
      closing={<p>Updates to this policy will be posted here with a revised effective date.</p>}
    />
  );
}
