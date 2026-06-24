import * as mammoth from "mammoth";
import * as cheerio from "cheerio";

// Next.js Route Handler: POST multipart/form-data with a .docx file
export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file field" }), { status: 400 });
    }
    if (!file.name?.toLowerCase().endsWith(".docx")) {
      return new Response(JSON.stringify({ error: "Only .docx files are supported" }), { status: 400 });
    }

    // Convert .docx to HTML using Mammoth
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(arrayBuffer) }, {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ]
    });

    const $ = cheerio.load(html);
    const textOf = (sel) => $(sel).first().text().trim();

    // Helper: get section HTML between headings
    const sectionHtml = (headingText) => {
      const heading = $("h1, h2, h3").filter((_, el) => $(el).text().trim().toLowerCase() === headingText.toLowerCase()).first();
      if (!heading.length) return "";
      const chunks = [];
      let sib = heading.next();
      while (sib.length && !["h1", "h2", "h3"].includes(sib[0].name)) {
        chunks.push($.html(sib));
        sib = sib.next();
      }
      return chunks.join("\n").trim();
    };

    // Simple fields by labels (Title, Authors, etc.) - allow either heading+paragraph or "Label: value" paragraph
    const findLabeledValue = (label) => {
      // Look for a paragraph that starts with "Label:" pattern
      const p = $("p").filter((_, el) => $(el).text().trim().toLowerCase().startsWith(label.toLowerCase() + ":"));
      if (p.length) {
        const txt = p.first().text();
        return txt.substring(txt.indexOf(":") + 1).trim();
      }
      // Or a heading with the label and the next paragraph block
      const sec = sectionHtml(label);
      if (sec) {
        const _$ = cheerio.load(sec);
        return _$("p").map((_, el) => _$(el).text().trim()).get().join("\n\n").trim();
      }
      return "";
    };

    const numberOrEmpty = (v) => {
      const n = Number((v || "").toString().replace(/[,\s]/g, ''));
      return Number.isFinite(n) ? n : "";
    };

    // Arrays via tables (Team, Budget, Timeline)
    const parseTableByHeader = (heading, columns, errorsCollector) => {
      const sec = sectionHtml(heading);
      if (!sec) return [];
      const _$ = cheerio.load(sec);
      const rows = [];
      const table = _$("table").first();
      if (!table.length) return [];
      const thRaw = table.find("tr").first().find("th, td").map((_, el) => _$(el).text().trim()).get();
      const ths = thRaw.map(t => t.toLowerCase());
      const expected = columns.map(c => c.header);
      const expectedLower = expected.map(e => e.toLowerCase());
      const mismatch = [];
      if (ths.length !== expectedLower.length) {
        mismatch.push(`Expected ${expected.join(", ")}, found ${thRaw.join(", ") || "<none>"}`);
      } else {
        expectedLower.forEach((h, i) => { if (ths[i] !== h) mismatch.push(`Column ${i + 1} must be '${expected[i]}'`); });
      }
      if (mismatch.length && errorsCollector) {
        errorsCollector.push({ section: heading, message: `Invalid table headers`, details: mismatch });
        return [];
      }
      const idxMap = Object.fromEntries(columns.map(col => [col.key, ths.findIndex(h => h === col.header.toLowerCase())]));
      table.find("tr").slice(1).each((_, tr) => {
        const tds = _$(tr).find("td");
        if (!tds.length) return;
        const obj = {};
        columns.forEach(col => {
          const idx = idxMap[col.key];
          const cell = idx >= 0 ? _$(tds[idx]).text().trim() : "";
          obj[col.key] = cell;
        });
        rows.push(obj);
      });
      return rows;
    };

    // Collect headings present for validation
    const presentHeadings = $("h1, h2, h3").map((_, el) => $(el).text().trim()).get();
    const presentLower = presentHeadings.map(h => h.toLowerCase());
    const expectedHeadings = [
      "Title", "Authors", "Location", "Currency", "Goal", "Days Left", "Tags", "Category",
      "Overview", "Methods", "Lab Notes", "Discussion",
      "Context Answer", "Significance Answer", "Goals Answer",
      "Team Description", "Team Members",
      "Budget Description", "Budget Items",
      "Timeline Description", "Timeline Events",
    ];
    const warnings = [];
    const missingHeadings = [];
    expectedHeadings.forEach(h => { if (!presentLower.includes(h.toLowerCase())) { warnings.push(`Missing or renamed heading: ${h}`); missingHeadings.push(h); } });

    // If critical template headings are missing/renamed, block import with clear message
    if (missingHeadings.length) {
      return new Response(JSON.stringify({ error: "Template headings missing or changed", missingHeadings, warnings }), { status: 422, headers: { "Content-Type": "application/json" } });
    }

    // Map to your form structure
    const tableHeaderErrors = [];
    const result = {
      title: findLabeledValue("Title"),
      authors: findLabeledValue("Authors"),
      location: findLabeledValue("Location"),
      currency: findLabeledValue("Currency") || "PHP",
      goal: numberOrEmpty(findLabeledValue("Goal")),
      daysLeft: numberOrEmpty(findLabeledValue("Days Left")),
      tags: (findLabeledValue("Tags") || "").split(/,|;|\n/).map(s => s.trim()).filter(Boolean),
      // category is returned by name; client will resolve to id
      categoryName: findLabeledValue("Category"),

      overview: sectionHtml("Overview"),
      methods: sectionHtml("Methods"),
      labNotes: sectionHtml("Lab Notes"),
      discussion: sectionHtml("Discussion"),

      contextAnswer: sectionHtml("Context Answer"),
      significanceAnswer: sectionHtml("Significance Answer"),
      goalsAnswer: sectionHtml("Goals Answer"),

      teamDescription: sectionHtml("Team Description"),
      teamMembers: parseTableByHeader("Team Members", [
        { key: "name", header: "Name" },
        { key: "role", header: "Role" },
        { key: "responsibility", header: "Responsibility" },
        { key: "bio", header: "Bio" },
        { key: "email", header: "Email" },
        { key: "linkedin", header: "LinkedIn" },
        { key: "twitter", header: "Twitter" },
        { key: "expertise", header: "Expertise" },
      ], tableHeaderErrors).map(r => ({
        name: r.name || "",
        role: r.role || "",
        responsibility: r.responsibility || "",
        bio: r.bio || "",
        image: "",
        imageAlt: "",
        email: r.email || "",
        linkedin: r.linkedin || "",
        twitter: r.twitter || "",
        expertise: (r.expertise || "").split(/,|;|\n/).map(s => s.trim()).filter(Boolean),
      })),

      budgetDescription: sectionHtml("Budget Description"),
      budgetItems: parseTableByHeader("Budget Items", [
        { key: "name", header: "Item Name" },
        { key: "description", header: "Description" },
        { key: "value", header: "Value" },
      ], tableHeaderErrors).map(r => ({ name: r.name || "", description: r.description || "", value: numberOrEmpty(r.value) || 0 })),

      timelineDescription: sectionHtml("Timeline Description"),
      timelineEvents: parseTableByHeader("Timeline Events", [
        { key: "date", header: "Date" },
        { key: "title", header: "Title" },
      ], tableHeaderErrors).map(r => ({ date: (r.date || "").trim(), title: r.title || "" })),
    };

    if (tableHeaderErrors.length) {
      return new Response(
        JSON.stringify({
          error: "Table headers changed",
          tableHeaderErrors,
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ data: result, warnings }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Import .docx error", e);
    return new Response(JSON.stringify({ error: "Failed to parse document" }), { status: 500 });
  }
}
