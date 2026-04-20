#!/bin/bash

# Script de Inicialización de Documentación
# Uso: ./init-docs.sh "Nombre del Proyecto"

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
DATE_PLUS_7=$(node -e 'const d = new Date(); d.setDate(d.getDate() + 7); const p = (n) => String(n).padStart(2, "0"); console.log(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);')
DATE_PLUS_30=$(node -e 'const d = new Date(); d.setDate(d.getDate() + 30); const p = (n) => String(n).padStart(2, "0"); console.log(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);')
DATE_PLUS_35=$(node -e 'const d = new Date(); d.setDate(d.getDate() + 35); const p = (n) => String(n).padStart(2, "0"); console.log(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);')

print_info "Inicializando documentación para: $PROJECT_NAME"
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
        dest=$(echo "$dest" | sed 's/\.template$//')
        
        # Copiar y reemplazar placeholders
        sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
            -e "s/{{PROJECT_SLUG}}/$PROJECT_SLUG/g" \
            -e "s/{{FECHA}}/$CURRENT_DATE/g" \
            -e "s/{{FECHA_PROXIMA}}/$DATE_PLUS_7/g" \
            -e "s/{{FECHA_PROXIMA_MES}}/$DATE_PLUS_30/g" \
            -e "s/{{FECHA_LAUNCH}}/$DATE_PLUS_35/g" \
            -e "s/{{ESTADO}}/En planificación/g" \
            -e "s/{{FASE}}/Fase 1/g" \
            -e "s/{{X}}%/0%/g" \
            "$src" > "$dest"
        
        print_success "Creado: $dest"
    fi
}

copy_template_keep_name() {
    local src="$1"
    local dest="$2"

    if [ -f "$src" ]; then
        sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
            -e "s/{{PROJECT_SLUG}}/$PROJECT_SLUG/g" \
            -e "s/{{FECHA}}/$CURRENT_DATE/g" \
            -e "s/{{FECHA_PROXIMA}}/$DATE_PLUS_7/g" \
            -e "s/{{FECHA_PROXIMA_MES}}/$DATE_PLUS_30/g" \
            -e "s/{{FECHA_LAUNCH}}/$DATE_PLUS_35/g" \
            -e "s/{{ESTADO}}/En planificación/g" \
            -e "s/{{FASE}}/Fase 1/g" \
            -e "s/{{X}}%/0%/g" \
            "$src" > "$dest"

        print_success "Creado: $dest"
    fi
}

# Copiar templates de docs/
copy_template "docs-template/docs/INDEX.md.template" "docs/INDEX.md"
copy_template "docs-template/docs/CONTEXTO.md.template" "docs/CONTEXTO.md"
copy_template "docs-template/docs/STATUS.md.template" "docs/STATUS.md"
copy_template "docs-template/docs/WORKFLOW.md.template" "docs/WORKFLOW.md"
copy_template "docs-template/docs/MULTI_AGENT_WORKFLOW.md.template" "docs/MULTI_AGENT_WORKFLOW.md"
copy_template "docs-template/docs/MOCK_DATA_GUIDE.md.template" "docs/MOCK_DATA_GUIDE.md"
copy_template "docs-template/docs/UI_STANDARDS.md.template" "docs/UI_STANDARDS.md"
copy_template "docs-template/docs/GITFLOW_PR_GUIDE.md.template" "docs/GITFLOW_PR_GUIDE.md"
copy_template "docs-template/docs/DOCUMENTATION_GUIDE.md.template" "docs/DOCUMENTATION_GUIDE.md"
copy_template "docs-template/docs/TESTING_GUIDE_FOR_AI.md.template" "docs/TESTING_GUIDE_FOR_AI.md"

# Copiar archivos que no son templates
if [ -f "docs-template/docs/UI_STANDARDS.md" ]; then
    cp "docs-template/docs/UI_STANDARDS.md" "docs/UI_STANDARDS.md"
    print_success "Creado: docs/UI_STANDARDS.md"
fi

if [ -f "docs-template/docs/MOCK_DATA_GUIDE.md" ]; then
    cp "docs-template/docs/MOCK_DATA_GUIDE.md" "docs/MOCK_DATA_GUIDE.md"
    print_success "Creado: docs/MOCK_DATA_GUIDE.md"
fi

# Copiar configuración de IA
if [ -f "docs-template/docs/ai/PRINCIPLES.md" ]; then
    cp "docs-template/docs/ai/PRINCIPLES.md" "docs/ai/PRINCIPLES.md"
    print_success "Creado: docs/ai/PRINCIPLES.md"
fi

if [ -f "docs-template/docs/ai/RULES.yaml" ]; then
    cp "docs-template/docs/ai/RULES.yaml" "docs/ai/RULES.yaml"
    print_success "Creado: docs/ai/RULES.yaml"
fi

# Copiar template de LESSONS (vacío)
copy_template "docs-template/docs/ai/LESSONS.md.template" "docs/ai/LESSONS.md"

# Copiar SPEC del proyecto y artefactos requeridos por gates
copy_template "docs-template/specs/[project-name]/SPEC.md.template" "specs/$PROJECT_SLUG/SPEC.md"
copy_template "docs-template/specs/[project-name]/STATUS.md.template" "specs/$PROJECT_SLUG/STATUS.md"
copy_template "docs-template/specs/[project-name]/EVIDENCE_REPORT.md.template" "specs/$PROJECT_SLUG/EVIDENCE_REPORT.md"

# Copiar template de slice
cp "docs-template/specs/[project-name]/slices/slice-template/slice.json" "specs/$PROJECT_SLUG/slices/slice-template/slice.json"
print_success "Creado: specs/$PROJECT_SLUG/slices/slice-template/slice.json"

# Copiar template de PR del slice
copy_template_keep_name "docs-template/specs/[project-name]/slices/pr.md.template" "specs/$PROJECT_SLUG/slices/slice-template/pr.md.template"

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

# Copiar bootstrap de slices a tools/scripts
if [ -f "docs-template/scripts/start-slice.sh" ]; then
    cp "docs-template/scripts/start-slice.sh" "tools/scripts/start-slice.sh"
    chmod +x "tools/scripts/start-slice.sh"
    print_success "Creado: tools/scripts/start-slice.sh"
fi

if [ -f "docs-template/scripts/refresh-active-slices.sh" ]; then
    cp "docs-template/scripts/refresh-active-slices.sh" "tools/scripts/refresh-active-slices.sh"
    chmod +x "tools/scripts/refresh-active-slices.sh"
    print_success "Creado: tools/scripts/refresh-active-slices.sh"
fi

if [ -f "docs-template/scripts/check-slice-readiness.sh" ]; then
    cp "docs-template/scripts/check-slice-readiness.sh" "tools/scripts/check-slice-readiness.sh"
    chmod +x "tools/scripts/check-slice-readiness.sh"
    print_success "Creado: tools/scripts/check-slice-readiness.sh"
fi

if [ -f "docs-template/scripts/check-pr-readiness.sh" ]; then
    cp "docs-template/scripts/check-pr-readiness.sh" "tools/scripts/check-pr-readiness.sh"
    chmod +x "tools/scripts/check-pr-readiness.sh"
    print_success "Creado: tools/scripts/check-pr-readiness.sh"
fi

if [ -f "docs-template/scripts/cleanup-slice.sh" ]; then
    cp "docs-template/scripts/cleanup-slice.sh" "tools/scripts/cleanup-slice.sh"
    chmod +x "tools/scripts/cleanup-slice.sh"
    print_success "Creado: tools/scripts/cleanup-slice.sh"
fi

if [ -f "docs-template/scripts/check-scope.sh" ]; then
    cp "docs-template/scripts/check-scope.sh" "tools/scripts/check-scope.sh"
    chmod +x "tools/scripts/check-scope.sh"
    print_success "Creado: tools/scripts/check-scope.sh"
fi

# Crear archivo SEARCH.md básico
cat > "docs/SEARCH.md" << EOF
# Búsqueda por Tema

**Última actualización:** $CURRENT_DATE

---

## Autenticación

- **Spec:** \`../specs/$PROJECT_SLUG/slices/slice-01/slice.json\`
- **PR del slice:** \`../specs/$PROJECT_SLUG/slices/slice-01/pr.md\`
- **Bootstrap del slice:** \`../tools/scripts/start-slice.sh ../specs/$PROJECT_SLUG/slices/slice-01/slice.json\`
- **Hook:** \`hooks/useAuth.ts\`
- **API:** \`docs/api/auth/README.md\`
- **Componentes:** \`app/(auth)/\`

---

## IA Configuración

- **Principios:** \`docs/ai/PRINCIPLES.md\`
- **Reglas:** \`docs/ai/RULES.yaml\`
- **Lessons:** \`docs/ai/LESSONS.md\`

---

**Fin de la búsqueda**
EOF

print_success "Creado: docs/SEARCH.md"

# Crear README.md en la raíz del proyecto (si no existe)
if [ ! -f "README.md" ]; then
    cat > "README.md" << EOF
# $PROJECT_NAME

[Descripción breve del proyecto]

## Quick Start

\`\`\`bash
npm install
cp .env.example .env.local
npm run dev
\`\`\`

## Verification Checklist

- [ ] npm install completes
- [ ] npm run dev starts
- [ ] App opens at http://localhost:3000

## Documentation

- [Contexto](./docs/CONTEXTO.md) - Qué es $PROJECT_NAME
- [Workflow](./docs/WORKFLOW.md) - Cómo implementar
- [Status](./docs/STATUS.md) - Estado del proyecto
- [API Docs](./docs/api/) - Endpoint documentation (si aplica)
EOF
    print_success "Creado: README.md"
fi

# Resumen
echo ""
print_success "¡Inicialización completada!"
echo ""
echo "📁 Estructura creada:"
echo "   docs/                    ← Documentación core"
echo "   docs/ai/                 ← Configuración de IA"
echo "   docs/tools/              ← Herramientas (vacío)"
echo "   docs/archive/            ← Histórico (vacío)"
echo "   specs/$PROJECT_SLUG/     ← Especificaciones del proyecto"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Editar docs/CONTEXTO.md con la información de tu proyecto"
echo "   2. Editar docs/STATUS.md con el estado actual"
echo "   3. Crear el primer directorio de slice en specs/$PROJECT_SLUG/slices/[slice-id]/"
echo "   4. Actualizar docs/SEARCH.md con temas específicos"
echo ""
echo "📖 Más información:"
echo "   - Ver docs-template/TEMPLATE.md para guía de personalización"
echo "   - Ver docs-template/README.md para documentación del template"
echo ""
