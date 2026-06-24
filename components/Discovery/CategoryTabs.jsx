"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProjectCard from "@/components/ProjectCard"
import { featuredExperiments, impact_rd, leads_agri } from "@/mockupData/FeaturedExperiments"

export default function CategoryTabs({ categories, selectedFilter, filterOptions }) {
  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="relative mb-8">
        
        <TabsList className="relative grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2 h-auto p-2 bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="group flex flex-col items-center gap-2 p-4 h-auto rounded-xl transition-all duration-300 ease-in-out
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 
                data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25
                data-[state=active]:scale-105 data-[state=active]:border-primary/20
                hover:bg-gradient-to-br hover:from-accent/50 hover:to-accent/30 hover:scale-102 hover:shadow-md
                border border-transparent hover:border-accent/20"
              >
                <IconComponent className="h-6 w-6 transition-all duration-300 group-data-[state=active]:scale-110 group-hover:scale-105" />
                <span className="text-xs text-center font-semibold transition-all duration-300">{category.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>
      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id} className="mt-8  duration-500">
          <div className="text-center py-8 mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-primary/50"></div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {category.label} Projects
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-primary/50"></div>
            </div>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-muted/50 via-background to-muted/50 rounded-full border border-primary/10 shadow-sm backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm text-muted-foreground font-medium">Current filter:</span>
              <span className="text-sm font-bold text-primary px-2 py-1 bg-primary/10 rounded-full">
                {filterOptions.find((f) => f.value === selectedFilter)?.label}
              </span>
            </div>
          </div>
          {category.id === "all" && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...impact_rd, ...leads_agri].map((experiment, index) => (
                <div 
                  key={experiment.id} 
                  className=" slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProjectCard
                    project={experiment.projectDetail}
                    teams={experiment.projectTeam?.teamMembers || []}
                    description={experiment.projectContent?.overview || experiment.description}
                  />
                </div>
              ))}
            </div>
          )}
          {category.id === "impact-rd" && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {impact_rd.map((experiment, index) => (
                <div 
                  key={experiment.id} 
                  className=" slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProjectCard 
                    project={experiment.projectDetail} 
                    teams={experiment.projectTeam.teamMembers} 
                    description={experiment.projectContent.overview} 
                  />
                </div>
              ))}
            </div>
          )}
          {category.id === "leads-agri" && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {leads_agri.map((experiment, index) => (
                <div 
                  key={experiment.id} 
                  className=" slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProjectCard 
                    project={experiment.projectDetail} 
                    teams={experiment.projectTeam.teamMembers} 
                    description={experiment.projectContent.overview} 
                  />
                </div>
              ))}
            </div>
          )}
          {category.id !== "all" && category.id !== "impact-rd" && category.id !== "leads-agri" && (
            <div className="text-center py-12  duration-500">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <span className="text-2xl">🔬</span>
                </div>
                <p className="text-muted-foreground text-lg font-medium mb-2">No projects yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Mockup data for this category is coming soon!
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
