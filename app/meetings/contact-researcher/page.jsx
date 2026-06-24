import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import ContactResearcherForm from '@/components/contact-researcher/ContactResearcherForm';
import Navbar from "@/components/Navbar";

async function getActiveProjects() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/projects?archived=false`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }

    const projects = await response.json()
    return projects
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export default async function ContactResearcher() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Redirect if admin
  if (session.user?.role === 'admin') {
    redirect('/admin/meetings')
  }

  const projects = await getActiveProjects()

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8 px-6 xl:px-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Contact Our Researcher
            </h1>
            <p className="text-muted-foreground">
              Schedule a meeting with our research team to discuss projects, collaborate, or get expert insights.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Meeting Request Form
              </CardTitle>
              <CardDescription>
                Fill out the form below to request a meeting. Our team will review your request and get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactResearcherForm projects={projects} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}