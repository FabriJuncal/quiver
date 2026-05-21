#!/bin/bash

# Script de Inicialización de Documentación
# Uso: ./init-docs.sh "Nombre del Proyecto"

# shellcheck disable=SC2016
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar argumento
if [ -z "$1" ]; then
    print_error "Nombre del proyecto requerido"
    echo "Uso: ./init-docs.sh \"Nombre del Proyecto\""
    echo "Ejemplo: ./init-docs.sh \"Mi Proyecto\""
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_SLUG=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
CURRENT_DATE=$(date +%Y-%m-%d)
MIGRATE_MODE="${QUIVER_MIGRATE:-0}"
DATE_PLUS_7=$(node -e 'const d = new Date(); d.setDate(d.getDate() + 7); const p = (n) => String(n).padStart(2, "0"); console.log(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);')
DATE_PLUS_30=$(node -e 'const d = new Date(); d.setDate(d.getDate() + 30); const p = (n) => String(n).padStart(2, "0"); console.log(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);')
DATE_PLUS_35=$(node -e 'const d = new Date(); d.setDate(d.getDate() + 35); const p = (n) => String(n).padStart(2, "0"); console.log(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);')
PACKAGE_MANAGER="npm"
STACK_SUMMARY="unknown until analyze"
PRIMARY_INSTALL="npm install"
PRIMARY_DEV="npm run quiver:analyze"
PRIMARY_TEST="npm test"
ANALYZE_COMMAND="npx create-quiver analyze"
PLAN_COMMAND="npx create-quiver plan"
GRAPH_COMMAND="npx create-quiver graph"
NEXT_COMMAND="npx create-quiver next"
DOCTOR_COMMAND="npx create-quiver doctor"
START_SLICE_COMMAND="npx create-quiver start-slice <slice.json>"
CHECK_SLICE_COMMAND="npx create-quiver check-slice <slice.json>"
CHECK_PR_COMMAND="npx create-quiver check-pr <slice.json>"
CLEANUP_SLICE_COMMAND="npx create-quiver cleanup-slice <slice.json>"
CHECK_SCOPE_COMMAND="npx create-quiver check-scope <slice.json>"
REFRESH_ACTIVE_SLICES_COMMAND="npx create-quiver refresh-active-slices"

print_info "Inicializando documentación para: $PROJECT_NAME"
print_warning "Este script es compatibilidad legacy. Para el flujo AI-first default usá: npx create-quiver init --name \"$PROJECT_NAME\""
print_info "Project slug: $PROJECT_SLUG"
print_info "Fecha: $CURRENT_DATE"

# Verificar que existe docs-template/
if [ ! -d "docs-template" ]; then
    print_error "No se encontró docs-template/"
    print_error "Asegurate de estar en el directorio correcto"
    exit 1
fi

# Crear directorios base
print_info "Creando estructura de directorios..."

mkdir -p "docs"
mkdir -p "docs/ai"
mkdir -p "docs/tools"
mkdir -p "docs/archive"
mkdir -p "specs/$PROJECT_SLUG/slices/slice-template"
mkdir -p "tools/scripts"

# Copiar templates y reemplazar placeholders
print_info "Copiando templates..."

# Función para copiar y reemplazar
copy_template() {
    local src="$1"
    local dest="$2"
    
    if [ -f "$src" ]; then
        # Remover .template del nombre si existe
        dest="${dest%.template}"

        if [ "$MIGRATE_MODE" = "1" ] && [ -f "$dest" ]; then
            print_info "Saltado: $dest ya existe"
            return 0
        fi
        
        # Copiar y reemplazar placeholders
        sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
            -e "s/{{PROJECT_SLUG}}/$PROJECT_SLUG/g" \
            -e "s/\[project\]/$PROJECT_SLUG/g" \
            -e "s/\[project-name\]/$PROJECT_SLUG/g" \
            -e "s/\[project-slug\]/$PROJECT_SLUG/g" \
            -e "s/{{FECHA}}/$CURRENT_DATE/g" \
            -e "s/{{FECHA_PROXIMA}}/$DATE_PLUS_7/g" \
            -e "s/{{FECHA_PROXIMA_MES}}/$DATE_PLUS_30/g" \
        -e "s/{{FECHA_LAUNCH}}/$DATE_PLUS_35/g" \
        -e "s/{{ESTADO}}/En planificación/g" \
        -e "s/{{FASE}}/Fase 1/g" \
        -e "s/{{X}}%/0%/g" \
        -e "s/{{PACKAGE_MANAGER}}/$PACKAGE_MANAGER/g" \
        -e "s/{{STACK_SUMMARY}}/$STACK_SUMMARY/g" \
        -e "s/{{PRIMARY_INSTALL}}/$PRIMARY_INSTALL/g" \
        -e "s/{{PRIMARY_DEV}}/$PRIMARY_DEV/g" \
        -e "s/{{PRIMARY_TEST}}/$PRIMARY_TEST/g" \
        -e "s/{{ANALYZE_COMMAND}}/$ANALYZE_COMMAND/g" \
        -e "s/{{DOCTOR_COMMAND}}/$DOCTOR_COMMAND/g" \
        -e "s/{{START_SLICE_COMMAND}}/$START_SLICE_COMMAND/g" \
        -e "s/{{CHECK_SLICE_COMMAND}}/$CHECK_SLICE_COMMAND/g" \
        -e "s/{{CHECK_PR_COMMAND}}/$CHECK_PR_COMMAND/g" \
        -e "s/{{CLEANUP_SLICE_COMMAND}}/$CLEANUP_SLICE_COMMAND/g" \
        -e "s/{{CHECK_SCOPE_COMMAND}}/$CHECK_SCOPE_COMMAND/g" \
        -e "s/{{REFRESH_ACTIVE_SLICES_COMMAND}}/$REFRESH_ACTIVE_SLICES_COMMAND/g" \
        "$src" > "$dest"
        
        print_success "Creado: $dest"
    fi
}

copy_template_keep_name() {
    local src="$1"
    local dest="$2"

    if [ -f "$src" ]; then
        if [ -f "$dest" ]; then
            print_info "Saltado: $dest ya existe"
            return 0
        fi

        sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
            -e "s/{{PROJECT_SLUG}}/$PROJECT_SLUG/g" \
            -e "s/\[project\]/$PROJECT_SLUG/g" \
            -e "s/\[project-name\]/$PROJECT_SLUG/g" \
            -e "s/\[project-slug\]/$PROJECT_SLUG/g" \
            -e "s/{{FECHA}}/$CURRENT_DATE/g" \
            -e "s/{{FECHA_PROXIMA}}/$DATE_PLUS_7/g" \
            -e "s/{{FECHA_PROXIMA_MES}}/$DATE_PLUS_30/g" \
        -e "s/{{FECHA_LAUNCH}}/$DATE_PLUS_35/g" \
        -e "s/{{ESTADO}}/En planificación/g" \
        -e "s/{{FASE}}/Fase 1/g" \
        -e "s/{{X}}%/0%/g" \
        -e "s/{{PACKAGE_MANAGER}}/$PACKAGE_MANAGER/g" \
        -e "s/{{STACK_SUMMARY}}/$STACK_SUMMARY/g" \
        -e "s/{{PRIMARY_INSTALL}}/$PRIMARY_INSTALL/g" \
        -e "s/{{PRIMARY_DEV}}/$PRIMARY_DEV/g" \
        -e "s/{{PRIMARY_TEST}}/$PRIMARY_TEST/g" \
        -e "s/{{ANALYZE_COMMAND}}/$ANALYZE_COMMAND/g" \
        -e "s/{{DOCTOR_COMMAND}}/$DOCTOR_COMMAND/g" \
        -e "s/{{START_SLICE_COMMAND}}/$START_SLICE_COMMAND/g" \
        -e "s/{{CHECK_SLICE_COMMAND}}/$CHECK_SLICE_COMMAND/g" \
        -e "s/{{CHECK_PR_COMMAND}}/$CHECK_PR_COMMAND/g" \
        -e "s/{{CLEANUP_SLICE_COMMAND}}/$CLEANUP_SLICE_COMMAND/g" \
        -e "s/{{CHECK_SCOPE_COMMAND}}/$CHECK_SCOPE_COMMAND/g" \
        -e "s/{{REFRESH_ACTIVE_SLICES_COMMAND}}/$REFRESH_ACTIVE_SLICES_COMMAND/g" \
        "$src" > "$dest"

        print_success "Creado: $dest"
    fi
}

copy_file_if_missing() {
    local src="$1"
    local dest="$2"

    mkdir -p "$(dirname "$dest")"

    if [ -f "$dest" ]; then
        print_info "Saltado: $dest ya existe"
        return 0
    fi

    if [ ! -f "$src" ]; then
        print_warning "No se encontró $src; se omite $dest"
        return 0
    fi

    cp "$src" "$dest"
    print_success "Creado: $dest"
}

# Copiar templates de docs/
copy_template_keep_name "docs-template/AGENTS.md.template" "AGENTS.md"
copy_template "docs-template/docs/INDEX.md.template" "docs/INDEX.md"
copy_template "docs-template/docs/COMMANDS.md.template" "docs/COMMANDS.md"
copy_template "docs-template/docs/QUICK.md.template" "docs/ai/QUICK.md"
copy_template "docs-template/docs/STANDARD.md.template" "docs/ai/STANDARD.md"
copy_template "docs-template/docs/DEEP.md.template" "docs/ai/DEEP.md"
copy_template "docs-template/docs/examples/plan.md.template" "docs/examples/plan.md"
copy_template "docs-template/docs/examples/graph.md.template" "docs/examples/graph.md"
copy_template "docs-template/docs/examples/next.md.template" "docs/examples/next.md"
copy_template "docs-template/docs/DECISIONS.md.template" "docs/DECISIONS.md"
copy_template "docs-template/docs/AI_CONTEXT.md.template" "docs/AI_CONTEXT.md"
copy_template "docs-template/docs/AI_ONBOARDING_PROMPT.md.template" "docs/AI_ONBOARDING_PROMPT.md"
copy_template "docs-template/specs/[project-name]/HANDOFF.md.template" "specs/$PROJECT_SLUG/HANDOFF.md"
copy_template "docs-template/docs/CONTEXTO.md.template" "docs/CONTEXTO.md"
copy_template "docs-template/docs/STATUS.md.template" "docs/STATUS.md"
copy_template "docs-template/docs/WORKFLOW.md.template" "docs/WORKFLOW.md"
copy_template "docs-template/docs/SUPPORT_MATRIX.md.template" "docs/SUPPORT_MATRIX.md"
copy_template "docs-template/docs/TROUBLESHOOTING.md.template" "docs/TROUBLESHOOTING.md"
copy_template "docs-template/docs/MULTI_AGENT_WORKFLOW.md.template" "docs/MULTI_AGENT_WORKFLOW.md"
copy_template "docs-template/docs/MOCK_DATA_GUIDE.md.template" "docs/MOCK_DATA_GUIDE.md"
copy_template "docs-template/docs/UI_STANDARDS.md.template" "docs/UI_STANDARDS.md"
copy_template "docs-template/docs/GITFLOW_PR_GUIDE.md.template" "docs/GITFLOW_PR_GUIDE.md"
copy_template "docs-template/docs/DOCUMENTATION_GUIDE.md.template" "docs/DOCUMENTATION_GUIDE.md"
copy_template "docs-template/docs/TESTING_GUIDE_FOR_AI.md.template" "docs/TESTING_GUIDE_FOR_AI.md"

# Copiar archivos que no son templates
if [ -f "docs-template/docs/UI_STANDARDS.md" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "docs/UI_STANDARDS.md" ]; then
        print_info "Saltado: docs/UI_STANDARDS.md ya existe"
    else
        cp "docs-template/docs/UI_STANDARDS.md" "docs/UI_STANDARDS.md"
        print_success "Creado: docs/UI_STANDARDS.md"
    fi
fi

if [ -f "docs-template/docs/MOCK_DATA_GUIDE.md" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "docs/MOCK_DATA_GUIDE.md" ]; then
        print_info "Saltado: docs/MOCK_DATA_GUIDE.md ya existe"
    else
        cp "docs-template/docs/MOCK_DATA_GUIDE.md" "docs/MOCK_DATA_GUIDE.md"
        print_success "Creado: docs/MOCK_DATA_GUIDE.md"
    fi
fi

# Copiar configuración de IA
if [ -f "docs-template/docs/ai/PRINCIPLES.md" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "docs/ai/PRINCIPLES.md" ]; then
        print_info "Saltado: docs/ai/PRINCIPLES.md ya existe"
    else
        cp "docs-template/docs/ai/PRINCIPLES.md" "docs/ai/PRINCIPLES.md"
        print_success "Creado: docs/ai/PRINCIPLES.md"
    fi
fi

if [ -f "docs-template/docs/ai/RULES.yaml" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "docs/ai/RULES.yaml" ]; then
        print_info "Saltado: docs/ai/RULES.yaml ya existe"
    else
        cp "docs-template/docs/ai/RULES.yaml" "docs/ai/RULES.yaml"
        print_success "Creado: docs/ai/RULES.yaml"
    fi
fi

# Copiar template de LESSONS (vacío)
copy_template "docs-template/docs/ai/LESSONS.md.template" "docs/ai/LESSONS.md"

# Copiar SPEC del proyecto y artefactos requeridos por gates
copy_template "docs-template/specs/[project-name]/SPEC.md.template" "specs/$PROJECT_SLUG/SPEC.md"
copy_template "docs-template/specs/[project-name]/STATUS.md.template" "specs/$PROJECT_SLUG/STATUS.md"
copy_template "docs-template/specs/[project-name]/EVIDENCE_REPORT.md.template" "specs/$PROJECT_SLUG/EVIDENCE_REPORT.md"

# Copiar template de slice
copy_template_keep_name "docs-template/specs/[project-name]/slices/slice-template/slice.json" "specs/$PROJECT_SLUG/slices/slice-template/slice.json"
print_success "Creado: specs/$PROJECT_SLUG/slices/slice-template/slice.json"

# Copiar template de PR del slice
copy_template_keep_name "docs-template/specs/[project-name]/slices/pr.md.template" "specs/$PROJECT_SLUG/slices/slice-template/pr.md.template"

# Copiar baseline legal y OSS cuando faltan
copy_file_if_missing "docs-template/LICENSE" "LICENSE"
copy_file_if_missing "docs-template/CONTRIBUTING.md" "CONTRIBUTING.md"
copy_file_if_missing "docs-template/CODE_OF_CONDUCT.md" "CODE_OF_CONDUCT.md"
copy_file_if_missing "docs-template/SECURITY.md" "SECURITY.md"
copy_file_if_missing "docs-template/CHANGELOG.md" "CHANGELOG.md"
copy_file_if_missing "docs-template/ROADMAP.md" "ROADMAP.md"
copy_file_if_missing "docs-template/.github/pull_request_template.md" ".github/pull_request_template.md"
copy_file_if_missing "docs-template/.github/ISSUE_TEMPLATE/bug_report.md" ".github/ISSUE_TEMPLATE/bug_report.md"
copy_file_if_missing "docs-template/.github/ISSUE_TEMPLATE/feature_request.md" ".github/ISSUE_TEMPLATE/feature_request.md"
copy_file_if_missing "docs-template/.github/workflows/ci.yml" ".github/workflows/ci.yml"

# Sincronizar package.json del host
sync_package_json() {
    local package_template="docs-template/package.template.json"
    local package_json="package.json"

    if [ ! -f "$package_template" ]; then
        print_warning "No se encontró package.template.json; se omite la sincronización de package.json"
        return 0
    fi

    if [ ! -f "$package_json" ]; then
        cp "$package_template" "$package_json"
        print_success "Creado: $package_json"
        return 0
    fi

    node - "$package_json" "$package_template" <<'NODE'
const fs = require('fs');

const [packagePath, templatePath] = process.argv.slice(2);
const existing = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

existing.scripts = {
  ...(existing.scripts || {}),
  ...(template.scripts || {})
};

fs.writeFileSync(packagePath, `${JSON.stringify(existing, null, 2)}\n`);
NODE

    print_success "Actualizado: $package_json (scripts mergeados)"
}

sync_package_json

mkdir -p ".quiver"
node - <<'NODE'
const fs = require('fs');
const path = require('path');

const statePath = path.join('.quiver', 'state.json');
const packageJson = fs.existsSync('package.json') ? JSON.parse(fs.readFileSync('package.json', 'utf8')) : {};
const currentVersion = process.env.QUIVER_VERSION || packageJson.version || '0.0.0';
const migrateMode = process.env.QUIVER_MIGRATE === '1';
const now = new Date().toISOString();
const projectName = process.env.QUIVER_PROJECT_NAME || packageJson.name || '';

let existing = {};
if (fs.existsSync(statePath)) {
  existing = JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

const nextState = migrateMode
  ? {
      ...existing,
      quiver_version: currentVersion,
      project_name: projectName || existing.project_name || '',
      initialized_version: existing.initialized_version ?? null,
      migrated_version: currentVersion,
      last_initialized_at: existing.last_initialized_at ?? null,
      last_migration_at: now,
      last_analysis_at: existing.last_analysis_at ?? null,
    }
  : {
    ...existing,
    quiver_version: currentVersion,
    project_name: projectName || existing.project_name || '',
      initialized_version: existing.initialized_version || currentVersion,
      migrated_version: existing.migrated_version ?? null,
      last_initialized_at: existing.last_initialized_at || now,
      last_migration_at: existing.last_migration_at ?? null,
      last_analysis_at: existing.last_analysis_at ?? null,
    };

fs.writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`);
NODE

# Copiar bootstrap de slices a tools/scripts
if [ -f "docs-template/scripts/start-slice.sh" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "tools/scripts/start-slice.sh" ]; then
        print_info "Saltado: tools/scripts/start-slice.sh ya existe"
    else
        cp "docs-template/scripts/start-slice.sh" "tools/scripts/start-slice.sh"
        chmod +x "tools/scripts/start-slice.sh"
        print_success "Creado: tools/scripts/start-slice.sh"
    fi
fi

if [ -f "docs-template/scripts/refresh-active-slices.sh" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "tools/scripts/refresh-active-slices.sh" ]; then
        print_info "Saltado: tools/scripts/refresh-active-slices.sh ya existe"
    else
        cp "docs-template/scripts/refresh-active-slices.sh" "tools/scripts/refresh-active-slices.sh"
        chmod +x "tools/scripts/refresh-active-slices.sh"
        print_success "Creado: tools/scripts/refresh-active-slices.sh"
    fi
fi

if [ -f "docs-template/scripts/check-slice-readiness.sh" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "tools/scripts/check-slice-readiness.sh" ]; then
        print_info "Saltado: tools/scripts/check-slice-readiness.sh ya existe"
    else
        cp "docs-template/scripts/check-slice-readiness.sh" "tools/scripts/check-slice-readiness.sh"
        chmod +x "tools/scripts/check-slice-readiness.sh"
        print_success "Creado: tools/scripts/check-slice-readiness.sh"
    fi
fi

if [ -f "docs-template/scripts/check-pr-readiness.sh" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "tools/scripts/check-pr-readiness.sh" ]; then
        print_info "Saltado: tools/scripts/check-pr-readiness.sh ya existe"
    else
        cp "docs-template/scripts/check-pr-readiness.sh" "tools/scripts/check-pr-readiness.sh"
        chmod +x "tools/scripts/check-pr-readiness.sh"
        print_success "Creado: tools/scripts/check-pr-readiness.sh"
    fi
fi

if [ -f "docs-template/scripts/cleanup-slice.sh" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "tools/scripts/cleanup-slice.sh" ]; then
        print_info "Saltado: tools/scripts/cleanup-slice.sh ya existe"
    else
        cp "docs-template/scripts/cleanup-slice.sh" "tools/scripts/cleanup-slice.sh"
        chmod +x "tools/scripts/cleanup-slice.sh"
        print_success "Creado: tools/scripts/cleanup-slice.sh"
    fi
fi

if [ -f "docs-template/scripts/check-scope.sh" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "tools/scripts/check-scope.sh" ]; then
        print_info "Saltado: tools/scripts/check-scope.sh ya existe"
    else
        cp "docs-template/scripts/check-scope.sh" "tools/scripts/check-scope.sh"
        chmod +x "tools/scripts/check-scope.sh"
        print_success "Creado: tools/scripts/check-scope.sh"
    fi
fi

if [ -f "docs-template/scripts/migrate-project.sh" ]; then
    if [ "$MIGRATE_MODE" = "1" ] && [ -f "tools/scripts/migrate-project.sh" ]; then
        print_info "Saltado: tools/scripts/migrate-project.sh ya existe"
    else
        cp "docs-template/scripts/migrate-project.sh" "tools/scripts/migrate-project.sh"
        chmod +x "tools/scripts/migrate-project.sh"
        print_success "Creado: tools/scripts/migrate-project.sh"
    fi
fi

# Crear archivo SEARCH.md básico
if [ "$MIGRATE_MODE" = "1" ] && [ -f "docs/SEARCH.md" ]; then
    print_info "Saltado: docs/SEARCH.md ya existe"
else
cat > "docs/SEARCH.md" << EOF
# Búsqueda por Tema

**Última actualización:** $CURRENT_DATE

---

## AI Context

- **Agent context pack:** \`docs/AI_CONTEXT.md\`
- **Project overview:** \`docs/CONTEXTO.md\`
- **Workflow:** \`docs/WORKFLOW.md\`

---

## Autenticación

- **Spec:** \`../specs/$PROJECT_SLUG/slices/slice-01/slice.json\`
- **PR del slice:** \`../specs/$PROJECT_SLUG/slices/slice-01/pr.md\`
- **Bootstrap del slice:** \`npx create-quiver start-slice ../specs/$PROJECT_SLUG/slices/slice-01/slice.json\`
- **Hook:** \`hooks/useAuth.ts\`
- **API:** \`docs/api/auth/README.md\`
- **Componentes:** \`app/(auth)/\`

---

## IA Configuración

- **Principios:** \`docs/ai/PRINCIPLES.md\`
- **Reglas:** \`docs/ai/RULES.yaml\`
- **Lessons:** \`docs/ai/LESSONS.md\`

## Soporte

- **Support Matrix:** \`docs/SUPPORT_MATRIX.md\`
- **Troubleshooting:** \`docs/TROUBLESHOOTING.md\`

---

**Fin de la búsqueda**
EOF
fi

if [ "$MIGRATE_MODE" != "1" ] || [ ! -f "docs/SEARCH.md" ]; then
    print_success "Creado: docs/SEARCH.md"
fi

# Crear README.md en la raíz del proyecto (si no existe)
if [ ! -f "README.md" ]; then
    cat > "README.md" << EOF
# $PROJECT_NAME

[Descripción breve del proyecto]

## Quick Start

Run Quiver from this project root. Do not install it globally.

\`\`\`bash
npm install
$ANALYZE_COMMAND
$PLAN_COMMAND
$GRAPH_COMMAND
$DOCTOR_COMMAND
$NEXT_COMMAND
\`\`\`

If this project needs a pinned Quiver version, install it as a devDependency:

\`\`\`bash
npm install --save-dev create-quiver
\`\`\`

If you need to target another directory from outside the project, pass \`--dir\` explicitly. Quote paths that contain spaces.

## AI-First Workflow

Quiver is designed for an AI-first workflow: a planner agent reads the project context and prepares acceptance criteria, technical plans, specs, slices, and PR notes; executor agents then work one approved slice at a time with minimal context.

Start with dry-runs so you can inspect the provider, role, context pack, and invocation before spending model tokens:

\`\`\`bash
npm run quiver:ai:onboard -- --dry-run
npm run quiver:ai:plan -- --phase acceptance --input requirements.md --dry-run
npm run quiver:ai:approve -- --phase acceptance --input acceptance-approved.md
npm run quiver:ai:plan -- --phase technical-plan --dry-run
npm run quiver:ai:review-plan -- --dry-run
npm run quiver:ai:approve -- --phase technical-plan --version <n>
npm run quiver:spec:create -- --dry-run
npm run quiver:ai:prompt-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
npm run quiver:ai:pr -- --dry-run --ssh-host-alias github-work --identity-file ~/.ssh/github-work
\`\`\`

Remove \`--dry-run\` only after the phase output is approved and the local provider CLI is ready.

When a real spec exists, execute one approved slice at a time:

\`\`\`bash
npm run quiver:ai:prompt-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
npm run quiver:ai:execute-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
\`\`\`

## Project NPM Scripts

The generated project includes \`quiver:*\` npm scripts that call the Node CLI and are the preferred repeatable workflow:

\`\`\`bash
npm run quiver:analyze
npm run quiver:plan
npm run quiver:graph
npm run quiver:next
npm run quiver:doctor
npm run quiver:ai:onboard -- --dry-run
npm run quiver:ai:plan -- --phase acceptance --input requirements.md --dry-run
npm run quiver:ai:prompt-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
npm run quiver:ai:execute-slice -- --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
npm run quiver:ai:doctor -- --dry-run --ssh-host-alias github-work --identity-file ~/.ssh/github-work
npm run quiver:ai:pr -- --dry-run --ssh-host-alias github-work --identity-file ~/.ssh/github-work
npm run quiver:migrate
npm run quiver:start-slice -- specs/$PROJECT_SLUG/slices/slice-01/slice.json
npm run quiver:check-slice -- specs/$PROJECT_SLUG/slices/slice-01/slice.json
npm run quiver:check-pr -- specs/$PROJECT_SLUG/slices/slice-01/slice.json
npm run quiver:check-handoff -- specs/$PROJECT_SLUG/HANDOFF.md
npm run quiver:cleanup-slice -- specs/$PROJECT_SLUG/slices/slice-01/slice.json
npm run quiver:check-scope -- specs/$PROJECT_SLUG/slices/slice-01/slice.json
npm run quiver:refresh-active-slices
\`\`\`

The \`quiver:graph\` script prints the tree view by default; use \`npx create-quiver graph --format mermaid\` for PR-ready Markdown and \`--format dot\` when you want Graphviz source.
The \`quiver:next\` script points to the next ready slice and can auto-start it behind a confirmation prompt.
The \`quiver:ai:*\` scripts standardize planner/executor AI flows. Use dry-run first: onboarding and planning dry-runs do not require provider auth, while \`quiver:ai:pr -- --dry-run\` validates \`gh\`, GitFlow docs, branch/worktree state, and SSH inputs without creating a PR.
Use \`npx create-quiver next --all-ready\` when you want the full ready level instead of a single suggestion.
The legacy Bash wrappers remain in \`tools/scripts/\` for compatibility, but new project-level automation should prefer the \`quiver:*\` scripts and the direct \`npx create-quiver ...\` commands below.
\`npm run check-handoff -- specs/$PROJECT_SLUG/HANDOFF.md\` is available as a legacy-friendly alias for the handoff validator.
If a new bounded transfer is needed, scaffold \`specs/$PROJECT_SLUG/HANDOFF.md\` with \`npx create-quiver new-handoff $PROJECT_SLUG\` and validate it with \`npx create-quiver check-handoff specs/$PROJECT_SLUG/HANDOFF.md\`.
For exceptional context transfers between agents or phases, a dedicated \`HANDOFF.md\` can live alongside the usual spec and docs files.

## Cross-Platform Support

Quiver is targeting native support on macOS, Linux, and Windows PowerShell/CMD. Bash is a legacy compatibility path until the runtime slices land, so the generated workflow should be read as a native Node-first contract rather than a Bash-first one. Windows support is only considered verified once the CI matrix is green.

## Upgrading Existing Projects

If the project already existed before this Quiver version, upgrade it from the project root:

\`\`\`bash
cd /path/to/your-project
npx create-quiver migrate
$ANALYZE_COMMAND
$PLAN_COMMAND
$GRAPH_COMMAND
$NEXT_COMMAND
$DOCTOR_COMMAND
\`\`\`

Use \`$GRAPH_COMMAND --format mermaid\` for GitHub-friendly graph embeds or \`$GRAPH_COMMAND --format dot\` for Graphviz pipelines.

Exportable graph formats are available when you need a PR-ready Mermaid block or Graphviz source:

\`\`\`bash
$GRAPH_COMMAND --format mermaid
$GRAPH_COMMAND --format dot
\`\`\`

If the project never ran Quiver initialization before, do not use \`migrate\` as bootstrap. Run:

\`\`\`bash
npx create-quiver init --name "Project Name"
\`\`\`

If your team prefers a pinned local dependency, update the package first and then run the same flow:

\`\`\`bash
npm install --save-dev create-quiver@latest
npx create-quiver migrate
npx create-quiver analyze
npx create-quiver plan
npx create-quiver graph
npx create-quiver next
npx create-quiver doctor
\`\`\`

The tree output remains the default, but Mermaid and DOT are available on demand for exported docs and slide decks.

## AI Context Onboarding

Lee \`AGENTS.md\` primero y después \`docs/AI_ONBOARDING_PROMPT.md\` tras el análisis.

After analysis and doctor validation, open your AI agent in this project and run:

\`\`\`text
Lee \`docs/AI_ONBOARDING_PROMPT.md\` y ejecútalo como fuente principal de verdad para incorporarte a este repositorio.

Actúa como asistente de onboarding de IA. Prepara el contexto del proyecto para trabajar de forma segura con el workflow documentado, specs y slices.

Usa el rol planner para onboarding, criterios de aceptación, plan técnico y generación de specs/slices. Usa el rol executor solo cuando exista un slice aprobado y debas ejecutar su handoff con contexto mínimo.

No modifiques código de producto salvo autorización explícita. Puedes crear o actualizar documentación de contexto si el onboarding lo requiere.

Usa solo la documentación del repositorio como fuente de verdad. Si encuentras información faltante, ambigua o contradictoria, documenta el supuesto, el riesgo y continúa por el camino más seguro.

Responde en español y finaliza con un reporte breve de archivos leídos, archivos modificados, estado del código de producto, supuestos, riesgos y próximos pasos.
\`\`\`

Review the AI changes to docs/AI_CONTEXT.md, docs/CONTEXTO.md, docs/STATUS.md, and specs/$PROJECT_SLUG/SPEC.md before starting implementation work.
If the work was explicitly transferred through a handoff artifact, read \`specs/$PROJECT_SLUG/HANDOFF.md\` before implementation.

## Decision Log

Record durable decisions in \`docs/DECISIONS.md\` so future AI agents do not re-litigate the same choices.

## First Slice Workflow

Use this section only for the legacy/full scaffold that includes a placeholder spec. In the default AI-first layout, create real specs and slices with \`npx create-quiver spec create\` after acceptance criteria are approved and the technical plan is reviewed and approved.

1. Review or refine specs/$PROJECT_SLUG/SPEC.md.
2. Create the first slice from specs/$PROJECT_SLUG/slices/slice-template/slice.json.
3. Review the plan with \`$PLAN_COMMAND\` or \`npm run quiver:plan\`.
4. Inspect the graph with \`$GRAPH_COMMAND\` or \`npm run quiver:graph\`.
5. Check the next ready slice with \`$NEXT_COMMAND\` or \`npm run quiver:next\`.
6. Start work with \`$START_SLICE_COMMAND\` or \`npm run quiver:start-slice -- <slice.json>\`.
7. Make one commit per slice.
8. Open one PR per spec.

## Verification Checklist

- [ ] npm install completes
- [ ] $ANALYZE_COMMAND completes
- [ ] $PLAN_COMMAND completes
- [ ] $GRAPH_COMMAND completes
- [ ] $NEXT_COMMAND completes
- [ ] $DOCTOR_COMMAND completes
- [ ] AI agent executed docs/AI_ONBOARDING_PROMPT.md
- [ ] Context docs were reviewed before the first slice

## Documentation

- [AI Context](./docs/AI_CONTEXT.md) - Contexto resumido para IA
- [Decision Log](./docs/DECISIONS.md) - Decisiones durables del proyecto
- [AI Onboarding Prompt](./docs/AI_ONBOARDING_PROMPT.md) - Handoff exacto para agentes después del análisis
- [Handoff](./specs/$PROJECT_SLUG/HANDOFF.md) - Transferencia excepcional entre agentes o fases
- [Check Handoff](./docs/WORKFLOW.md) - Valida el handoff con \`npx create-quiver check-handoff\`
- [Commands](./docs/COMMANDS.md) - Tabla canónica de comandos de orquestación
- [Contexto](./docs/CONTEXTO.md) - Qué es $PROJECT_NAME
- [Workflow](./docs/WORKFLOW.md) - Cómo implementar
- [Support Matrix](./docs/SUPPORT_MATRIX.md) - Qué entornos están soportados
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Cómo recuperarse de fallos comunes
- [Status](./docs/STATUS.md) - Estado del proyecto
- [API Docs](./docs/api/) - Endpoint documentation (si aplica)
EOF
    print_success "Creado: README.md"
fi

# Resumen
echo ""
print_success "¡Inicialización completada!"
echo ""
echo "📁 Estructura legacy/full creada:"
echo "   docs/                    ← Documentación core"
echo "   docs/ai/                 ← Configuración de IA"
echo "   docs/tools/              ← Herramientas (vacío)"
echo "   docs/archive/            ← Histórico (vacío)"
echo "   specs/$PROJECT_SLUG/     ← Especificaciones del proyecto"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Editar docs/AI_CONTEXT.md con el contexto resumido para IA"
echo "   2. Editar docs/CONTEXTO.md con la información de tu proyecto"
echo "   3. Editar docs/STATUS.md con el estado actual"
echo "   4. Para el flujo recomendado, crear specs reales con: npx create-quiver spec create"
echo "   5. Usar tools/scripts solo si necesitás compatibilidad legacy"
echo ""
echo "📖 Más información:"
echo "   - Ver README.md y README_FOR_AI.md para el flujo AI-first actual"
echo "   - docs-template/ aplica solo a compatibilidad legacy o templates exportados"
echo ""
