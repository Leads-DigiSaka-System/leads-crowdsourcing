"use client";

import AskScientists from "./ask-scientists";

export default function ScientistsContent({
  contextAnswer,
  significanceAnswer,
  goalsAnswer,
  className = "",
  showJoinDiscussion = true,
}) {
  const questionsData = [
    {
      question: "What is the context of this research?",
      answer: contextAnswer || "No data inputted for context.",
    },
    {
      question: "What is the significance of this project?",
      answer: significanceAnswer || "No data inputted for significance.",
    },
    {
      question: "What are the goals of the project?",
      answer: goalsAnswer || "No data inputted for goals.",
    },
  ];

  const handleJoinDiscussion = () => {
    // Scroll to discussion section
    const discussionElement = document.getElementById("discussion-section");
    if (discussionElement) {
      discussionElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className={className}>
      <AskScientists
        title="Ask the Scientists"
        questions={questionsData}
        {...(showJoinDiscussion
          ? { onJoinDiscussion: handleJoinDiscussion }
          : {})}
      />
    </div>
  );
}
