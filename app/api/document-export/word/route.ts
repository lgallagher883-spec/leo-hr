import { NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { parseDocumentBrandSettings } from "@/lib/documents/brandSettings";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportBody = {
  title?: unknown;
  bodyHtml?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&middot;/gi, "·");
}

function stripTags(value: string) {
  return decodeEntities(
    value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\n\s*/g, "\n"),
  ).trim();
}

function hex(value: string) {
  return value.replace(/^#/, "").toUpperCase();
}

function extractBlocks(html: string) {
  const blocks: Array<
    | { kind: "heading"; level: number; text: string }
    | { kind: "paragraph"; text: string }
    | { kind: "bullet"; text: string }
    | { kind: "table"; rows: string[][] }
  > = [];

  const cleaned = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");

  const tokenRegex =
    /<(h[1-4]|p|li|table)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(cleaned))) {
    const tag = match[1].toLowerCase();
    const inner = match[2];

    if (tag.startsWith("h")) {
      const value = stripTags(inner);
      if (value) blocks.push({ kind: "heading", level: Number(tag.slice(1)), text: value });
      continue;
    }

    if (tag === "p") {
      const value = stripTags(inner);
      if (value) blocks.push({ kind: "paragraph", text: value });
      continue;
    }

    if (tag === "li") {
      const value = stripTags(inner);
      if (value) blocks.push({ kind: "bullet", text: value });
      continue;
    }

    if (tag === "table") {
      const rows: string[][] = [];
      const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch: RegExpExecArray | null;
      while ((rowMatch = rowRegex.exec(inner))) {
        const cells: string[] = [];
        const cellRegex = /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
        let cellMatch: RegExpExecArray | null;
        while ((cellMatch = cellRegex.exec(rowMatch[1]))) {
          cells.push(stripTags(cellMatch[1]));
        }
        if (cells.length) rows.push(cells);
      }
      if (rows.length) blocks.push({ kind: "table", rows });
    }
  }

  if (!blocks.length) {
    const fallback = stripTags(cleaned);
    if (fallback) blocks.push({ kind: "paragraph", text: fallback });
  }

  return blocks;
}

async function loadLogo(url: string) {
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";

    const type =
      contentType.includes("png") ? "png" :
      contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" :
      null;

    if (!type) return null;
    return { buffer, type: type as "png" | "jpg" };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportBody;
    const title = text(body.title) || "LEO Document";
    const bodyHtml = text(body.bodyHtml);

    if (!bodyHtml) {
      return NextResponse.json({ success: false, error: "Document content is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "You must be signed in." }, { status: 401 });
    }

    const { data: organisationId, error: organisationError } =
      await supabase.rpc("leo_current_organisation_id");

    if (organisationError || !organisationId) {
      return NextResponse.json(
        { success: false, error: "The current organisation could not be resolved." },
        { status: 403 },
      );
    }

    const [profileResult, organisationResult] = await Promise.all([
      supabase
        .from("organisation_public_profiles")
        .select("display_name, logo_url, primary_colour, secondary_colour, metadata")
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      supabase
        .from("organisations")
        .select("name")
        .eq("id", organisationId)
        .maybeSingle(),
    ]);

    if (profileResult.error) throw new Error(profileResult.error.message);
    if (organisationResult.error) throw new Error(organisationResult.error.message);

    const brand = parseDocumentBrandSettings(
      (profileResult.data as Record<string, unknown> | null) ?? null,
      organisationResult.data?.name || "Organisation",
    );

    const primary = brand.documentLayout === "plain" ? "111827" : hex(brand.primaryColour);
    const secondary = brand.documentLayout === "plain" ? "FFFFFF" : hex(brand.secondaryColour);
    const logo = brand.documentLayout === "branded" ? await loadLogo(brand.logoUrl) : null;

    const headerChildren: Paragraph[] = [];
    if (brand.headerStyle !== "none") {
      const headerRuns: Array<TextRun | ImageRun> = [];

      if (logo) {
        headerRuns.push(
          new ImageRun({
            data: logo.buffer,
            transformation: { width: 120, height: 50 },
            type: logo.type,
          }),
        );
      }

      if (brand.organisationName) {
        headerRuns.push(
          new TextRun({
            text: logo ? "    " + brand.organisationName : brand.organisationName,
            bold: true,
            color: primary,
            size: 22,
          }),
        );
      }

      headerChildren.push(
        new Paragraph({
          children: headerRuns,
          alignment: logo ? AlignmentType.LEFT : AlignmentType.RIGHT,
          spacing: { after: 90 },
          border: brand.headerStyle === "standard"
            ? { bottom: { color: primary, size: 12, style: BorderStyle.SINGLE } }
            : undefined,
        }),
      );
    }

    const footerParts = [
      brand.organisationName,
      brand.companyNumber ? `Company ${brand.companyNumber}` : "",
      brand.telephone,
      brand.email,
    ].filter(Boolean);

    const footerChildren: Paragraph[] = [];
    if (brand.footerStyle !== "none") {
      footerChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: footerParts.join(" · "),
              color: "64748B",
              size: 16,
            }),
          ],
          alignment: AlignmentType.CENTER,
          border: { top: { color: "D8DEE6", size: 4, style: BorderStyle.SINGLE } },
          spacing: { before: 80 },
        }),
      );

      if (brand.pageNumbers) {
        footerChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Page ", color: "64748B", size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], color: "64748B", size: 16 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        );
      }
    }

    const children: Array<Paragraph | Table> = [
      new Paragraph({
        children: [new TextRun({ text: title, bold: true, color: primary, size: 34 })],
        spacing: { after: 220 },
      }),
    ];

    for (const block of extractBlocks(bodyHtml)) {
      if (block.kind === "heading") {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                color: primary,
                size: block.level <= 2 ? 26 : 22,
              }),
            ],
            spacing: { before: 220, after: 90 },
            keepNext: true,
          }),
        );
        continue;
      }

      if (block.kind === "paragraph") {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: block.text, size: 22, color: "334155" })],
            spacing: { after: 120 },
          }),
        );
        continue;
      }

      if (block.kind === "bullet") {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: block.text, size: 22, color: "334155" })],
            bullet: { level: 0 },
            spacing: { after: 70 },
          }),
        );
        continue;
      }

      if (block.kind === "table") {
        const columnCount = Math.max(...block.rows.map((row) => row.length));
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: block.rows.map(
              (row) =>
                new TableRow({
                  children: Array.from({ length: columnCount }, (_, index) =>
                    new TableCell({
                      shading: index === 0
                        ? { type: ShadingType.CLEAR, fill: secondary }
                        : undefined,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: row[index] || "",
                              bold: index === 0,
                              color: index === 0 ? primary : "334155",
                              size: 20,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ),
                }),
            ),
          }),
        );
        children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 850,
                right: 900,
                bottom: 850,
                left: 900,
                header: 300,
                footer: 300,
              },
            },
          },
          headers: headerChildren.length
            ? { default: new Header({ children: headerChildren }) }
            : undefined,
          footers: footerChildren.length
            ? { default: new Footer({ children: footerChildren }) }
            : undefined,
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "LEO-Document"}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Word export failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Word export failed.",
      },
      { status: 500 },
    );
  }
}
