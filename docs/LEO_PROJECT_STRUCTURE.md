# LEO Project Structure

*Last Updated: July 2026*

---

# Overview

This document defines the structure of the LEO HR platform.

The purpose is to ensure all development follows the intended architecture.

LEO is divided into:

* Application Layer
* Leo Intelligence Layer
* Data Layer
* Documentation Layer

---

# Project Tree

```text
LEO HR PLATFORM

app
│
├── api
│   └── ask-leo
│       └── route.ts
│
├── dashboard
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── ask-leo
│   │   └── page.tsx
│   │
│   └── matters
│       ├── MatterContext.tsx
│       ├── page.tsx
│       │
│       ├── new
│       │   └── page.tsx
│       │
│       └── [id]
│           └── page.tsx
│
├── layout.tsx
├── page.tsx
├── globals.css
└── favicon.ico


leo
│
└── core
    ├── classifier.ts
    ├── intent.ts
    ├── risk.ts
    └── router.ts


matters
│
└── MatterStore.ts


lib
│
└── supabase.ts


docs
│
├── LEO_ARCHITECTURE_MAP.md
├── LEO_SYSTEM_ARCHITECTURE.md
├── LEO_BUILD_PLAN.md
├── LEO_DEVELOPMENT_RULES.md
├── LEO_PROJECT_STRUCTURE.md
└── CURRENT_BUILD_STATUS.md


public

.env.local

next.config

next-env.d.ts
```

---

# Folder Responsibilities

## app

User-facing application.

Contains:

* Pages
* Dashboard
* Matter screens
* Ask Leo interface
* API routes

The app displays Leo.

The app does not contain Leo intelligence.

---

## leo

The LEO intelligence system.

Contains:

* Core reasoning
* Future Knowledge layer
* Future Draft layer
* Future Insight layer

---

## leo/core

Current Leo reasoning engine.

Contains:

### Intent

Identifies the HR topic.

### Risk

Assesses risk level.

### Classifier

Determines required action.

### Router

Controls where the request goes next.

---

## matters

Matter data management.

Contains:

* Matter storage
* Matter state
* Matter workflow

---

## lib

Shared technical services.

Currently:

* Supabase connection

---

## docs

The blueprint and rules for the entire platform.

These documents are the source of truth for development.

---

# Architecture Principle

The UI is separate from intelligence.

Correct:

User → App → Leo Core → Response

Incorrect:

User → App containing HR logic

All future Leo intelligence must live inside:

```text
leo/
```

not inside:

```text
app/
```
