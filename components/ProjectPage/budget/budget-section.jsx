"use client";
import dynamic from "next/dynamic";
import BudgetBreakdown from "./budget-breakdown";
import BudgetChart from "./budget-chart";

export default function BudgetSection({
  title = "Budget",
  description,
  budgetItems = [],
  showChart = true,
  showBreakdown = true,
  className = "",
  isCompleted = false,
}) {
  const RichTextView = dynamic(() => import("@/components/ui/rich-text-view"), {
    ssr: false,
  });
  return (
    <div className={`max-w-6xl mx-auto px-4 py-8  ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          ₱
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      {/* Description - full width */}
      <div className="space-y-4 mb-8">
        {description &&
          (typeof description === "string" ? (
            <RichTextView html={description} />
          ) : (
            <div className="prose prose-gray max-w-none">{description}</div>
          ))}
      </div>

      <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Note:</span> Fund transfers will be
          made once the required amount for a given component or objective has
          been met. This setup allows us to keep our budgeting flexible and
          ensures that funds can be allocated where they are most needed.
        </p>
      </div>

      {/* Budget Visualization: items | items, chart centered below */}
      {(showBreakdown || showChart) && (
        <div className="space-y-10">
          {showBreakdown && (
            <div className="grid gap-8 lg:grid-cols-2 items-start">
              {/* Left column: odd-indexed items */}
              <BudgetBreakdown
                items={budgetItems.filter((_, i) => i % 2 === 0)}
                showTotals={false}
                isCompleted={isCompleted}
              />
              {/* Right column: even-indexed items */}
              <BudgetBreakdown
                items={budgetItems.filter((_, i) => i % 2 === 1)}
                showTotals={false}
                isCompleted={isCompleted}
              />
            </div>
          )}

          {/* Unified totals and centered chart */}
          {(showBreakdown || showChart) && (
            <div className="flex flex-col items-center">
              {showBreakdown && (
                <div className="w-full max-w-2xl mb-4">
                  {/* Render only totals (no items) to prevent duplication above the chart */}
                  <BudgetBreakdown
                    items={budgetItems}
                    showItems={false}
                    className="!space-y-2"
                    isCompleted={isCompleted}
                  />
                </div>
              )}
              {showChart && (
                <div className="w-full max-w-xl">
                  <BudgetChart data={budgetItems} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
