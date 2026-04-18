# Guide for AI Agents: How to Use docs-template

**Version:** 1.0
**Last Updated:** 2026-03-16
**Audience:** AI agents (Qwen Code, Claude Code, Cursor, etc.)

---

## ⚡ Quick Reference

### If User Wants to Start a New Project

```bash
# Run this command
./docs-template/scripts/init-docs.sh "Project Name"

# Then guide user to edit:
# 1. docs/CONTEXTO.md
# 2. docs/STATUS.md
# 3. specs/[project-name]/SPEC.md
```

### Critical Rules

| Rule | What to Do |
|------|------------|
| **NEVER** modify `docs-template/` | It's generic and portable |
| **ALWAYS** use `init-docs.sh` | Don't copy manually |
| **DISTINGUISH** generic vs specific | `docs-template/` = generic, `docs/` = specific |
| **KNOW** what's optional | Not all projects need all files |

### Placeholder Reference

| Placeholder | Replaced With |
|-------------|---------------|
| `{{PROJECT_NAME}}` | "Project Name" |
| `{{PROJECT_SLUG}}` | "project-name" |
| `{{FECHA}}` | Current date |

---

## 🎯 What is docs-template?

`docs-template/` is a **portable documentation template** for Micro-SaaS projects. It contains:

- **Templates** with placeholders (e.g., `{{PROJECT_NAME}}`)
- **Generic configuration** (e.g., AI principles, rules)
- **Initialization scripts** (e.g., `init-docs.sh`)

**Purpose:** Enable rapid onboarding for new Micro-SaaS projects (5-15 min setup).

---

## 📁 Directory Structure

```
docs-template/
├── README.md                    ← Human-readable guide
├── README_FOR_AI.md             ← This file (AI-specific guide)
├── TEMPLATE.md                  ← Customization guide
│
├── docs/                        ← Documentation templates
│   ├── INDEX.md.template        ← Master index
│   ├── CONTEXTO.md.template     ← Project context
│   ├── STATUS.md.template       ← Project status
│   ├── WORKFLOW.md.template     ← Implementation workflow
│   ├── MOCK_DATA_GUIDE.md.template ← Mock data guide
│   ├── UI_STANDARDS.md.template ← UI standards
│   ├── GITFLOW_PR_GUIDE.md.template ← Git guide
│   ├── DOCUMENTATION_GUIDE.md.template ← Documentation guide
│   └── ai/
│       ├── PRINCIPLES.md        ← 4 fundamental principles (generic)
│       ├── RULES.yaml           ← AI behavior rules (generic)
│       └── LESSONS.md.template  ← Lessons template (empty)
│
├── specs/                       ← Specification templates
│   └── [project-name]/
│       ├── SPEC.md.template     ← Project specification
│       └── slices/
│           └── slice-template/
│               ├── slice.json
│               └── pr.md.template
│
└── scripts/                     ← Initialization scripts
    ├── init-docs.sh             ← Project initialization
    └── migrate-project.sh       ← Migration from existing project
```

---

## 🚀 How to Initialize a New Project

### Step 1: Detect if docs-template Exists

```bash
# Check if docs-template/ exists
if [ -d "docs-template" ]; then
  echo "docs-template found"
else
  echo "ERROR: docs-template not found"
  # Ask user: "Do you want to clone docs-template?"
fi
```

---

### Step 2: Run Initialization Script

**Recommended:** Use the automated script.

```bash
# From project root
./docs-template/scripts/init-docs.sh "Project Name"
```

**What the script does:**
1. Creates directory structure (`docs/`, `docs/ai/`, `specs/`)
2. Copies templates from `docs-template/docs/` to `docs/`
3. Replaces placeholders:
   - `{{PROJECT_NAME}}` → "Project Name"
   - `{{PROJECT_SLUG}}` → "project-name"
   - `{{FECHA}}` → Current date
4. Creates generic files (no placeholders):
   - `docs/ai/PRINCIPLES.md` (copy)
   - `docs/ai/RULES.yaml` (copy)
5. Copies `tools/scripts/start-slice.sh` for slice branch/worktree bootstrap
6. Copies workflow enforcement scripts:
   - `check-slice-readiness.sh`
   - `check-pr-readiness.sh`
   - `cleanup-slice.sh`

---

### Step 3: Help User Customize

After initialization, guide the user to edit these files:

#### Priority 1: Core Files (Edit Immediately)

| File | What to Edit | Time |
|------|--------------|------|
| `docs/CONTEXTO.md` | Project name, description, target, stack | 10 min |
| `docs/STATUS.md` | Current status, progress, next milestone | 5 min |
| `specs/[project-name]/SPEC.md` | Project goal, scope, timeline | 10 min |

**Prompt for user:**
```
📝 Documentation initialized! Next steps:

1. Edit docs/CONTEXTO.md:
   - What is your Micro-SaaS?
   - Who is the target user?
   - What's the tech stack?

2. Edit docs/STATUS.md:
   - Current progress (%)
   - Next milestone
   - Timeline

3. Create first slice directory in specs/[project-name]/slices/[slice-id]/
4. Complete `ticket` + `git.*` in the slice and run `tools/scripts/start-slice.sh`
5. Before implementation, run `tools/scripts/check-slice-readiness.sh <slice.json> --gate execution`
```

---

#### Priority 2: Optional Files (Edit as Needed)

| File | When to Edit | What to Customize |
|------|--------------|-------------------|
| `docs/MOCK_DATA_GUIDE.md` | If using mock data | Replace examples with your entities |
| `docs/UI_STANDARDS.md` | If has UI | Update with your design system |
| `docs/GITFLOW_PR_GUIDE.md` | If using GitFlow | Choose workflow (solo vs team) |
| `docs/ai/LESSONS.md` | After each slice | Add learnings |

---

## ⚠️ Critical Rules for AI

### Rule 1: NEVER Modify docs-template/

```bash
# ❌ WRONG: Editing template for specific project
edit docs-template/docs/CONTEXTO.md.template
  "My Project is a..."

# ✅ CORRECT: Edit generated file
edit docs/CONTEXTO.md
  "My Project is a..."
```

**Why:** `docs-template/` is generic and portable. Never add project-specific content there.

---

### Rule 2: ALWAYS Use init-docs.sh

```bash
# ❌ WRONG: Manual copy
cp docs-template/docs/* docs/

# ✅ CORRECT: Use script
./docs-template/scripts/init-docs.sh "Project Name"
```

**Why:** The script handles placeholder replacement automatically.

---

### Rule 3: Distinguish Generic vs Specific

| File Type | Location | Editable? |
|-----------|----------|-----------|
| **Templates** | `docs-template/*.template` | ❌ No (generic) |
| **Generated** | `docs/*.md` | ✅ Yes (specific) |
| **Generic Config** | `docs/ai/PRINCIPLES.md` | ❌ No (copy from template) |
| **Project Lessons** | `docs/ai/LESSONS.md` | ✅ Yes (accumulate learnings) |

---

### Rule 4: Know What's Optional

Not all projects need all files:

| Project Type | Required Files | Optional Files |
|--------------|----------------|----------------|
| **Simple** (landing, script) | INDEX, CONTEXTO, WORKFLOW | STATUS, MOCK_DATA, UI_STANDARDS |
| **Medium** (SaaS, API) | INDEX, CONTEXTO, STATUS, WORKFLOW | MOCK_DATA, UI_STANDARDS, GITFLOW |
| **Complex** (MVP, team) | All core files | All files |

**Ask user:**
```
What type of Micro-SaaS is this?

1. Simple (landing page, script, 1-3 days)
2. Medium (SaaS, API, 1-2 weeks)
3. Complex (MVP, team, 3+ weeks)

Based on your answer, I'll suggest which files to create.
```

---

## 📋 Checklist for AI

### Before Initialization

- [ ] Check if `docs-template/` exists
- [ ] Check if `docs/` already exists (warn if yes)
- [ ] Ask user for project name
- [ ] Ask user for project type (simple/medium/complex)

---

### During Initialization

- [ ] Run `./docs-template/scripts/init-docs.sh "Project Name"`
- [ ] Verify files were created
- [ ] Check for errors

---

### After Initialization

- [ ] Guide user to edit `docs/CONTEXTO.md`
- [ ] Guide user to edit `docs/STATUS.md`
- [ ] Offer to create first slice
- [ ] Explain which files are optional

---

## 🔍 Placeholder Reference

| Placeholder | Replaced With | Example |
|-------------|---------------|---------|
| `{{PROJECT_NAME}}` | User's project name | "My Project" |
| `{{PROJECT_SLUG}}` | Kebab-case name | "my-project" |
| `{{FECHA}}` | Current date | "2026-03-16" |
| `{{FECHA_PROXIMA}}` | +7 days | "2026-03-23" |
| `{{FECHA_PROXIMA_MES}}` | +30 days | "2026-04-16" |
| `{{FECHA_LAUNCH}}` | +35 days | "2026-04-20" |
| `{{ESTADO}}` | "En planificación" | "En planificación" |
| `{{FASE}}` | "Fase 1" | "Fase 1" |
| `{{X}}%` | "0%" | "0%" |

---

## 🎯 Examples by Project Type

### Example 1: SaaS B2B

```bash
./docs-template/scripts/init-docs.sh "My SaaS"
```

**User should edit:**
- `docs/CONTEXTO.md`: "My SaaS is a B2B platform for..."
- `docs/STATUS.md`: "0% complete, next milestone: MVP"
- `docs/MOCK_DATA_GUIDE.md`: "Tenants: Company A, Company B"
- `docs/UI_STANDARDS.md`: "Tailwind CSS, dark mode"

---

### Example 2: Consumer App (B2C)

```bash
./docs-template/scripts/init-docs.sh "FitTracker"
```

**User should edit:**
- `docs/CONTEXTO.md`: "FitTracker is a fitness app for..."
- `docs/STATUS.md`: "50% complete, next milestone: Beta"
- `docs/MOCK_DATA_GUIDE.md`: "Users: user1@example.com, user2@example.com"
- `docs/UI_STANDARDS.md`: "React Native, light mode"

**User can skip:**
- `docs/GITFLOW_PR_GUIDE.md` (if solo founder)

---

### Example 3: Content Site

```bash
./docs-template/scripts/init-docs.sh "RecipeHub"
```

**User should edit:**
- `docs/CONTEXTO.md`: "RecipeHub is a recipe site for..."
- `docs/STATUS.md`: "20% complete, next milestone: Launch"
- `docs/MOCK_DATA_GUIDE.md`: "Recipes: Recipe 1, Recipe 2"

**User can delete:**
- `docs/MOCK_DATA_GUIDE.md` (if using real content)
- `docs/UI_STANDARDS.md` (if using template)

---

### Example 4: API/CLI Tool (No UI)

```bash
./docs-template/scripts/init-docs.sh "API Wrapper"
```

**User should edit:**
- `docs/CONTEXTO.md`: "API Wrapper is a library for..."
- `docs/STATUS.md`: "80% complete, next milestone: Release"

**User can delete:**
- `docs/UI_STANDARDS.md` (no UI)
- `docs/MOCK_DATA_GUIDE.md` (no backend)

---

## ⚡ Quick Commands for AI

```bash
# Initialize new project
./docs-template/scripts/init-docs.sh "Project Name"

# Migrate existing project
./docs-template/scripts/migrate-project.sh

# Verify structure
ls docs/
ls docs/ai/
ls specs/
```

---

## 🔗 Resources

| Resource | Location |
|----------|----------|
| **Human README** | `docs-template/README.md` |
| **Customization Guide** | `docs-template/TEMPLATE.md` |
| **Migration Summary** | `docs-template/MIGRATION_SUMMARY.md` |
| **Initialization Script** | `docs-template/scripts/init-docs.sh` |

---

## ❓ FAQ for AI

### Q: Can I modify docs-template/ for a specific project?

**A:** NO. `docs-template/` is generic and portable. Edit `docs/` instead.

---

### Q: What if the user doesn't want AI configuration?

**A:** Skip `docs/ai/` files. They're optional.

---

### Q: What if the project is very simple (1-2 files)?

**A:** Suggest minimal setup:
- `docs/INDEX.md`
- `docs/CONTEXTO.md`
- `README.md`

Skip: `STATUS.md`, `WORKFLOW.md`, `specs/`

---

### Q: How do I know if a file is required or optional?

**A:** Check the template:
- Files with `.template` extension → Required (core)
- Files in `docs/ai/` → Optional (only if using AI)
- Files in `docs/tools/` → Optional (only if using tools)
- `docs/api/` → Optional (only if has API)

---

**End of guide**

**Next:** Use this guide to help users set up documentation in 5-15 minutes.
