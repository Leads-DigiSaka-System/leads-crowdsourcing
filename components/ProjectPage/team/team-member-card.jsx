"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Linkedin, Twitter, ExternalLink } from "lucide-react"
import { nameTitleCase } from "@/lib/utils"

export default function TeamMemberCard({
  name,
  role,
  bio,
  responsibility,
  image,
  imageAlt,
  email,
  linkedin,
  twitter,
  website,
  expertise = [],
  className = "",
}) {
  const socialLinks = [
    { icon: Mail, href: email ? `mailto:${email}` : null, label: "Email" },
    { icon: Linkedin, href: linkedin, label: "LinkedIn" },
    { icon: Twitter, href: twitter, label: "Twitter" },
    { icon: ExternalLink, href: website, label: "Website" },
  ].filter((link) => link.href)

  return (
    <div className={`bg-card rounded-lg border p-6 space-y-4 ${className}`}>
      {/* Profile Image */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image || "/placeholder.svg"}
              alt={imageAlt || `${name} profile picture`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground bg-muted">
              {name?.charAt(0) || "?"}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          {role && <p className="text-sm text-primary font-medium">{nameTitleCase(role)}</p>}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div className="text-sm text-muted-foreground leading-relaxed">
          {typeof bio === "string" ? <p>{bio}</p> : bio}
        </div>
      )}

      {/* Responsibility */}
      {responsibility && (
        <div className="text-sm leading-relaxed">
          <span className="font-medium">Responsibility: </span>
          {typeof responsibility === "string" ? <span>{responsibility}</span> : responsibility}
        </div>
      )}

      {/* Expertise Tags */}
      {expertise.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {expertise.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="flex justify-center gap-2 pt-2">
          {socialLinks.map((link, index) => {
            const Icon = link.icon
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => window.open(link.href, "_blank")}
                title={link.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
