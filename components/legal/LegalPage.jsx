import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  FileText,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const documents = [
  { href: "/privacy-policy", title: "Privacy Policy", icon: ShieldCheck },
  { href: "/terms-of-service", title: "Terms of Service", icon: FileText },
];

function SectionLinks({ sections }) {
  return (
    <ol className="space-y-1">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm leading-6 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <span className="font-mono text-xs leading-6 text-slate-400 group-hover:text-blue-600" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function LegalPage({ type, description, introduction, sections, closing }) {
  const current = documents.find((document) => document.href === `/${type}`);
  const related = documents.find((document) => document !== current);
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-slate-50/70">
      <Navbar />
      <main id="legal-content">
        <header className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-40 h-[32rem] w-[32rem] rounded-full border-[70px] border-blue-100/35"
          />
          <div className="relative mx-auto max-w-6xl px-6 pt-9 sm:px-8 sm:pt-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded text-sm text-slate-500 transition-colors hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>

            <div className="flex items-center justify-between gap-8 pb-10 pt-9 sm:pb-12 sm:pt-11">
              <div className="max-w-2xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                  ResearchBayanihan · Policies
                </p>
                <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  {current.title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  {description}
                </p>
                <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 sm:text-sm">
                  <CalendarDays className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span>Effective date: <time dateTime="2026-09-10">10 September 2026</time></span>
                </div>
              </div>
              <div aria-hidden="true" className="relative mr-6 hidden h-40 w-40 shrink-0 items-center justify-center rounded-[2.5rem] border border-white bg-white/65 shadow-[0_16px_60px_-20px_rgba(37,99,235,0.2)] lg:flex">
                <div className="absolute inset-4 rounded-[1.8rem] border border-blue-100" />
                <Icon className="h-16 w-16 text-blue-600" strokeWidth={1.25} />
              </div>
            </div>

            <nav aria-label="Policies" className="flex gap-6 sm:gap-9">
              {documents.map((document) => {
                const active = document.href === current.href;
                const DocumentIcon = document.icon;
                return (
                  <Link
                    key={document.href}
                    href={document.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 border-b-2 pb-4 pt-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:border-blue-200 hover:text-slate-900"}`}
                  >
                    <DocumentIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {document.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:px-8 sm:py-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:py-14">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <nav aria-label="On this page">
                <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">On this page</p>
                <SectionLinks sections={sections} />
              </nav>
              <div className="mx-3 mt-8 border-t border-slate-200 pt-7">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="font-medium text-slate-900">We’re here to help</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Contact IMPACT R&D with questions about this {type === "privacy-policy" ? "policy" : "document"}.</p>
                <a href="mailto:main@impactrd.org" className="mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
                  main@impactrd.org
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <details className="group mb-6 rounded-xl border border-slate-200 bg-white lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-5 py-4 text-sm font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <nav aria-label="On this page" className="border-t border-slate-100 p-2">
                <SectionLinks sections={sections} />
              </nav>
            </details>

            <article aria-label={current.title} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)]">
              <div className="px-6 py-8 sm:p-10">
                <div className="border-b border-slate-100 pb-8 text-base leading-8 text-slate-700">
                  {introduction}
                </div>
                <div className="divide-y divide-slate-100">
                  {sections.map((section, index) => (
                    <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28 py-8 last:pb-0">
                      <div className="mb-4 flex items-start gap-3 sm:gap-4">
                        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-medium text-blue-600">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h2 id={`${section.id}-title`} className="pt-0.5 text-lg font-semibold leading-7 tracking-tight text-slate-900 sm:text-xl">
                          {section.title}
                        </h2>
                      </div>
                      <div className="text-[15px] leading-8 text-slate-600 sm:text-base [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_a]:decoration-blue-200 [&_a]:underline-offset-4 [&_a:hover]:decoration-blue-700 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-blue-600">
                        {section.content}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
              <div className="border-t border-blue-100/70 bg-blue-50/60 px-6 py-5 text-sm leading-7 text-slate-600 sm:px-10 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-4">
                {closing}
              </div>
            </article>

            <Link href={related.href} className="group mt-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 transition-colors hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              <div>
                <p className="mb-1 text-xs text-slate-500">Also read</p>
                <span className="text-sm font-semibold text-slate-900">{related.title}</span>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-blue-600 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
