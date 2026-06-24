"use client";

import BudgetSection from "./budget-section";

export default function ProjectBudget({
  budgetDescription,
  budgetItems,
  isCompleted = false,
  className = "",
}) {
  const descriptionToShow =
    budgetDescription || "No budget description provided.";
  const itemsToShow =
    Array.isArray(budgetItems) && budgetItems.length > 0
      ? budgetItems
      : [{ name: "No budget items provided.", value: 0 }];

  return (
    <div className={className}>
      <BudgetSection
        title="Budget"
        description={descriptionToShow}
        budgetItems={itemsToShow}
        showChart={true}
        showBreakdown={true}
        isCompleted={isCompleted}
      />
    </div>
  );
}
