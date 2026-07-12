# Employee Profile Structure

Last Updated: July 2026

---

# Purpose

This document defines the intended structure of the Employee Profile inside LEO HR.

The Employee Profile must be clear, employer-friendly, organised, and suitable for a real HR system.

The profile should avoid long confusing pages where every section appears at once.

Each section should either work properly or be clearly marked as coming next.

---

# Employee Profile Layout

## Header

The top of the profile should show:

- Employee name
- Role
- Employment status
- Start date
- Key summary

---

# Sections

The employee profile should be organised into the following sections:

1. Overview
2. Employment
3. Notes
4. Matters
5. Leave & Absence
6. Warnings
7. Emergency Contacts
8. Right to Work
9. DBS / Safeguarding
10. Driving
11. Medical
12. Documents
13. Archive

---

# Overview

Purpose:

Give the employer the key facts at a glance.

Should show:

- Full name
- Role
- Status
- Start date
- Manager
- Linked matters
- Important flags

---

# Employment

Purpose:

Store the core employment record.

Editable fields:

- Full name
- Work email
- Job title / role
- Employment status
- Start date
- Line manager
- Probation end date
- Employment end date
- Reason for leaving
- Annual leave allowance

This section should have one save button:

- Save employment details

---

# Notes

Purpose:

Allow internal employer notes to be recorded.

Should include:

- Note text
- Created date
- Author later
- Notes history

Notes should be saved as separate records, not overwritten.

---

# Matters

Purpose:

Show HR matters linked to the employee.

Should include:

- Open matters
- Closed matters
- Create matter for this employee

---

# Leave & Absence

Purpose:

Keep leave and absence records together.

Should include:

- Leave records
- Sickness absence records
- Start date
- End date
- Reason
- Status
- Notes

---

# Warnings

Purpose:

Record disciplinary or conduct warnings.

Should include:

- Warning type
- Date issued
- Expiry / review date
- Summary
- Outcome
- Document link later

Warning types:

- Informal
- Verbal
- Written
- Final written
- Other

---

# Emergency Contacts

Purpose:

Store emergency contact details.

The section should support exactly two contacts.

Each contact should include:

- Full name
- Relationship
- Phone number
- Email
- Address

---

# Right to Work

Purpose:

Track right to work checks.

Should include:

- Nationality / immigration status
- Share code
- Visa details
- Right to work expiry
- Check completed date
- Notes

---

# DBS / Safeguarding

Purpose:

Track DBS and safeguarding checks where relevant.

Should include:

- DBS required
- DBS status
- DBS level
- Certificate number
- Issue date
- Renewal / review date
- Countries
- Notes

---

# Driving

Purpose:

Track driving compliance where driving is required for the role.

This section should be condensed into a two-column layout.

Should include:

- Driving required
- Licence checked
- Licence expiry
- DVLA check completed
- Next DVLA check due
- Licence points
- MOT expiry
- Vehicle tax expiry
- Business insurance expiry

---

# Medical

Purpose:

Record relevant workplace medical context and reasonable adjustments.

Should include:

- Medical condition
- Since date
- Reasonable adjustments
- Additional notes

Medical information should be handled carefully because it is sensitive employee data.

---

# Documents

Purpose:

Store documents linked to the employee.

Should include:

- Upload document
- Document type
- Uploaded date
- Linked matter if relevant

---

# Archive

Purpose:

Remove an employee from active use without deleting their record.

Archive behaviour:

- Archived employees should not appear in the active employee list.
- Archived employees should appear in the archived employee list.
- Archived profiles should still be accessible.
- Archived employees should be restorable later.

The archive action should always show a confirmation warning.

---

# Build Order

The Employee Profile should be built in this order:

1. Employment section fully working
2. Notes fully working
3. Emergency Contacts fully working
4. Warnings fully working
5. Matters linked to employee
6. Leave & Absence
7. Right to Work
8. DBS / Safeguarding
9. Driving
10. Medical
11. Documents
12. Restore archived employee

---

# Development Rule

Do not add pretend buttons.

Every visible save button should either work or the section should be clearly marked as coming next.