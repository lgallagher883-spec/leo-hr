Database Philosophy

• One table per logical feature.
• Avoid duplicate data.
• Use foreign keys to link related records.
• Preserve historical data wherever appropriate.
• Design for auditability.
• Design for future reporting and AI reasoning.
# LEO Database Schema

Last Updated: 7 July 2026

---

# Purpose

This document defines the database structure of the LEO HR platform.

It is the single source of truth for all database tables and relationships.

Changes to the schema should be reflected here before implementation.

---

# Current Tables

## employees

Purpose

Stores the master employee record.

Status

🟡 Active development

Columns

| Column | Type | Notes |
|---------|------|-------|
| id | int8 | Primary Key |
| name | text | Employee full name |
| role | text | Job title |
| email | text | Work email |
| start_date | date | Employment start |
| status | text | Active / Former |
| created_at | timestamptz | Auto-generated |

Relationships

One employee can have:

- many Matters
- many Documents
- many Absence records
- many Leave records
- many Training records
- many Warnings

---

## matters

Purpose

Stores HR cases.

Relationships

Many Matters belong to one employee.

---

## matter_messages

Purpose

Stores Leo conversation history.

Relationships

Many messages belong to one Matter.

---

# Planned Tables

employee_documents

Purpose

Documents uploaded against an employee.

Status

⬜ Planned

---

employee_absence

Purpose

Sickness and absence history.

Status

⬜ Planned

---

employee_leave

Purpose

Annual leave and statutory leave.

Status

⬜ Planned

---

employee_training

Purpose

Training register.

Status

⬜ Planned

---

employee_warnings

Purpose

Disciplinary warnings.

Status

⬜ Planned

---

employee_emergency_contacts

Purpose

Emergency contacts.

Status

⬜ Planned

---

employee_notes

Purpose

Internal HR notes.

Status

⬜ Planned

---

employee_professional_registrations

Purpose

Professional memberships.

Status

⬜ Planned

---

employee_sars

Purpose

Subject Access Requests.

Status

⬜ Planned

---

employee_medical

Purpose

Medical context and reasonable adjustments.

Status

⬜ Planned

---

# Design Principles

• Use one table per logical feature.

• Avoid storing repeating data inside the employees table.

• Link supporting tables using employee_id.

• Use created_at timestamps where appropriate.

• Preserve historical records where legally required.

• Design for auditability and future reporting.