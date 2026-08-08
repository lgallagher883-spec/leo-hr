"use client";

import Link from "next/link";
import { useState } from "react";

const resourceTitle = "Managing Sickness Absence";
const resourceId = "managing-sickness-absence";
const resourceSummary =
	"A practical guide to handling sickness absence consistently, supportively and in line with fair process expectations.";

const askLeoPrompt = [
	`I am reviewing the LEO guide "${resourceTitle}".`,
	resourceSummary,
	"Please use this guide as the context for my question.",
].join("\n\n");

const askLeoHref =
	`/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
	`&resourceTitle=${encodeURIComponent(resourceTitle)}` +
	`&resourceType=${encodeURIComponent("Guide")}` +
	`&returnUrl=${encodeURIComponent(
		`/dashboard/policies/guides/${resourceId}`
	)}`;

export default function ManagingSicknessAbsencePage() {
	const [added, setAdded] = useState(false);

	function openPdf() {
		const article = document.getElementById("resource-content");

		if (!article) {
			return;
		}

		const pdfDocument = `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="utf-8" />
					<title>${resourceTitle}</title>
					<style>
						@page { size: A4; margin: 18mm; }
						body {
							max-width: 820px;
							margin: 40px auto;
							font-family: Arial, Helvetica, sans-serif;
							color: #334155;
							line-height: 1.65;
						}
						h1, h2 { color: #6e5084; }
						h1 { margin-bottom: 24px; font-size: 30px; }
						h2 { margin-top: 28px; margin-bottom: 10px; font-size: 20px; }
						p, li { font-size: 11pt; }
						li + li { margin-top: 6px; }
						.notice {
							margin-top: 28px;
							padding: 14px;
							border: 1px solid #dcece4;
							background: #f5fff9;
						}
					</style>
				</head>
				<body>
					<h1>${resourceTitle}</h1>
					${article.innerHTML}
				</body>
			</html>
		`;

		const pdfWindow = window.open("", "_blank");

		if (!pdfWindow) {
			return;
		}

		pdfWindow.document.open();
		pdfWindow.document.write(pdfDocument);
		pdfWindow.document.close();
	}

	function downloadWord() {
		const article = document.getElementById("resource-content");

		if (!article) {
			return;
		}

		const wordDocument = `
			<html>
				<head>
					<meta charset="utf-8" />
					<title>${resourceTitle}</title>
					<style>
						body { font-family: Arial, sans-serif; color: #334155; line-height: 1.65; }
						h1, h2 { color: #6e5084; }
						h1 { font-size: 30px; }
						h2 { margin-top: 28px; font-size: 20px; }
						.notice { padding: 14px; background: #f5fff9; border: 1px solid #dcece4; }
					</style>
				</head>
				<body>${article.innerHTML}</body>
			</html>
		`;

		const blob = new Blob(["\ufeff", wordDocument], {
			type: "application/msword",
		});

		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "LEO-Managing-Sickness-Absence.doc";
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	}

	function addToOrganisationResources() {
		setAdded(true);
	}

	return (
		<main className="preview-page">
			<style jsx>{`
				.preview-page {
					min-height: 100%;
					padding: 32px;
					background: linear-gradient(180deg, #fbf8fd 0%, #ffffff 42%);
					color: #334155;
				}

				.page-shell {
					max-width: 1180px;
					margin: 0 auto;
				}

				.back-link {
					display: inline-flex;
					margin-bottom: 22px;
					color: #6e5084;
					font-size: 14px;
					font-weight: 600;
					text-decoration: none;
				}

				.back-link:hover {
					text-decoration: underline;
				}

				.card {
					border: 1px solid #eadff0;
					border-radius: 22px;
					background: #ffffff;
					box-shadow: 0 16px 45px rgba(91, 66, 106, 0.07);
					padding: 30px;
				}

				h1 {
					margin: 0;
					color: #6e5084;
					font-size: clamp(32px, 5vw, 46px);
					font-weight: 500;
					letter-spacing: -0.03em;
				}

				.summary {
					margin: 12px 0 0;
					color: #64748b;
					font-size: 16px;
					line-height: 1.7;
				}

				.actions {
					display: flex;
					flex-wrap: wrap;
					gap: 10px;
					margin-top: 20px;
				}

				.button,
				.button-link {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-height: 42px;
					padding: 0 14px;
					border: 1px solid #d7c8e2;
					border-radius: 12px;
					background: #ffffff;
					color: #6e5084;
					font-size: 13px;
					font-weight: 600;
					text-decoration: none;
					cursor: pointer;
				}

				.button-primary {
					border-color: #6e5084;
					background: #6e5084;
					color: #ffffff;
				}

				.content {
					margin-top: 20px;
					color: #334155;
					line-height: 1.7;
				}

				.content h2 {
					color: #6e5084;
					margin: 24px 0 10px;
					font-size: 22px;
				}

				.notice {
					margin-top: 24px;
					padding: 14px;
					border: 1px solid #dcece4;
					background: #f5fff9;
					border-radius: 12px;
				}
			`}</style>

			<div className="page-shell">
				<Link href="/dashboard/policies/guides" className="back-link">
					← Back to Guides
				</Link>

				<section className="card">
					<h1>{resourceTitle}</h1>
					<p className="summary">{resourceSummary}</p>

					<div className="actions">
						<button type="button" className="button" onClick={openPdf}>
							Open PDF
						</button>
						<button type="button" className="button" onClick={downloadWord}>
							Download Word
						</button>
						<Link href={askLeoHref} className="button-link button-primary">
							Ask Leo
						</Link>
						<button
							type="button"
							className="button"
							onClick={addToOrganisationResources}
							disabled={added}
						>
							{added ? "Added" : "Add to organisation resources"}
						</button>
					</div>

					<article id="resource-content" className="content">
						<h2>Purpose</h2>
						<p>
							This guide helps managers approach sickness absence with fairness,
							consistency and practical support while maintaining reliable
							records and clear communication.
						</p>

						<h2>Key actions</h2>
						<ul>
							<li>Record absence accurately from day one.</li>
							<li>Keep supportive contact during ongoing absence.</li>
							<li>Hold return-to-work discussions after each absence period.</li>
							<li>Consider adjustments where appropriate.</li>
							<li>Escalate concerns using the relevant attendance procedure.</li>
						</ul>

						<h2>Manager reminders</h2>
						<p>
							Decisions should be evidence-based, proportionate and sensitive to
							individual circumstances. Longer or repeated absences may require
							tailored support and formal review stages.
						</p>

						<div className="notice">
							Check current legal guidance and your internal absence policy
							before final decisions.
						</div>
					</article>
				</section>
			</div>
		</main>
	);
}
