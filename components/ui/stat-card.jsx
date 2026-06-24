import { cn } from "@/lib/utils"

function StatCard({
    icon: Icon,
    title,
    value,
    description,
    trend,
    className,
    iconClassName,
    valueClassName,
    ...props
}) {
    return (
        <div
            className={cn(
                "bg-card text-card-foreground rounded-xl border p-6 shadow-sm transition-all hover:shadow-md",
                className
            )}
            {...props}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        {Icon && (
                            <Icon
                                className={cn(
                                    "h-5 w-5 text-primary",
                                    iconClassName
                                )}
                            />
                        )}
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className={cn(
                            "text-2xl font-bold leading-none",
                            valueClassName
                        )}>
                            {value}
                        </p>

                        {description && (
                            <p className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}

                        {trend && (
                            <div className="flex items-center gap-1 text-xs">
                                {trend}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

StatCard.displayName = "StatCard"

export { StatCard }