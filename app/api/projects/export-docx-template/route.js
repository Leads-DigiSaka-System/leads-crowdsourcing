import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType } from "docx";
import { promises as fs } from "fs";
import path from "path";

function heading(text, level = HeadingLevel.HEADING_2) {
  return new Paragraph({ text, heading: level });
}
function para(text) {
  return new Paragraph({ children: [new TextRun(text)] });
}
function table(headers) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({ children: [para(h)] })),
      }),
      // one empty row to hint structure
      new TableRow({ children: headers.map(() => new TableCell({ children: [para("")] })) }),
    ],
  });
}

export async function GET() {
  // 1) Prefer serving a pre-protected static template if available
  try {
    const protectedPath = path.join(process.cwd(), "public", "templates", "Project_Template_Protected.docx");
    const file = await fs.readFile(protectedPath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Project_Template_Protected.docx"`,
      },
    });
  } catch { }

  // 2) Fallback to generating a standard (unprotected) template
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          heading("INSTRUCTIONS", HeadingLevel.HEADING_1),
          para("Fill in the sections below. Do NOT change or remove any heading names or table headers."),

          heading("Title", HeadingLevel.HEADING_1),
          para("<Enter project title>"),

          heading("Authors"),
          para("<Comma-separated names or free text>"),

          heading("Location"),
          para("<City, Country>"),

          heading("Currency"),
          para("PHP"),

          heading("Goal"),
          para("<Number, ex: 250000>"),

          heading("Days Left"),
          para("<Number of days>"),

          heading("Tags"),
          para("example, environment, climate"),

          heading("Category"),
          para("<Category name>"),

          heading("Overview"),
          para("Describe the project. You can use bullet points."),

          heading("Methods"),
          para("Explain the methods. Bullets and formatting are okay."),

          heading("Lab Notes"),
          para("Optional notes."),

          heading("Discussion"),
          para("Optional discussion."),

          heading("Context Answer"),
          para("Scientist Q&A: Context."),

          heading("Significance Answer"),
          para("Scientist Q&A: Significance."),

          heading("Goals Answer"),
          para("Scientist Q&A: Goals."),

          heading("Team Description"),
          para("Describe the team and roles."),

          heading("Team Members"),
          table(["Name", "Role", "Responsibility", "Bio", "Email", "LinkedIn", "Twitter", "Expertise"]),

          heading("Budget Description"),
          para("Describe budget strategy and key items."),

          heading("Budget Items"),
          table(["Item Name", "Description", "Value"]),

          heading("Timeline Description"),
          para("Describe milestones and duration."),

          heading("Timeline Events"),
          table(["Date", "Title"]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Project_Template.docx"`,
    },
  });
}
