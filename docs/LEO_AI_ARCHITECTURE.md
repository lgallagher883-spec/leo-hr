# LEO AI Architecture

*Last Updated: July 2026*

---

# Purpose

This document defines how LEO uses AI.

LEO is not a rule-based chatbot.

LEO is an AI HR operating system that uses OpenAI as the language and reasoning engine, controlled by LEO’s own architecture.

---

# Core Principle

OpenAI does not run LEO.

LEO controls what OpenAI receives, what context it uses, what boundaries it follows, and how its response is presented.

---

# Correct AI Flow

```text
Employer message
    ↓
Leo Core
    ↓
Leo Knowledge
    ↓
Leo Reasoning
    ↓
Prompt Builder
    ↓
OpenAI
    ↓
Leo Response Formatter
    ↓
Matter Workspace
```

---

# Responsibilities

## Leo Core

Leo Core identifies:

* HR intent
* Risk level
* Whether the issue belongs in a Matter
* Basic routing decision

Core does not write the final response.

---

## Leo Knowledge

Leo Knowledge supplies relevant information, including:

* Uploaded company policies
* Contracts
* Handbooks
* Procedures
* ACAS guidance
* Employment law references
* Company-specific context

Knowledge is the source of truth for organisation-specific advice.

---

## Leo Reasoning

Leo Reasoning identifies HR issues that must not be missed.

Examples:

* Disability
* Flexible working
* Grievance
* Disciplinary
* Absence
* Redundancy
* TUPE
* Investigations
* Regulatory concerns

Reasoning does not replace OpenAI.

Reasoning produces structured context for OpenAI.

---

## Prompt Builder

The Prompt Builder combines:

* Employer message
* Core output
* Knowledge output
* Reasoning output
* Leo tone
* Safety boundaries
* Required response structure

It prepares the instruction package for OpenAI.

---

## OpenAI

OpenAI writes the natural-language response.

OpenAI is responsible for:

* Interpreting nuance
* Producing clear language
* Asking sensible follow-up questions
* Explaining HR considerations
* Writing in Leo’s professional tone

OpenAI must stay inside the boundaries provided by LEO.

---

## Leo Response Formatter

The Response Formatter makes the final answer consistent.

It controls structure such as:

* Situation
* Risk Assessment
* Key Considerations
* Information Needed
* Recommended Next Steps

It should not contain HR decision logic.

---

# Important Rule

Do not build HR intelligence inside UI pages.

Do not hardcode final HR advice inside the Response layer.

The Response layer formats.

The Reasoning layer identifies issues.

The Knowledge layer supplies policy and source material.

OpenAI writes the final human response.

---

# Matter Workspace Role

The Matter Workspace is the user interface.

It displays:

* Employer message
* Leo response
* Matter summary
* Next steps
* Documents
* Timeline

It must not contain Leo intelligence.

---

# Final Architecture Decision

LEO uses OpenAI, but OpenAI is not the product.

The product is the HR system around OpenAI:

* Core
* Knowledge
* Reasoning
* Draft
* Insight
* Matter Workspace

This is the architecture LEO will follow going forward.
