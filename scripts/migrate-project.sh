#!/bin/bash

# Script de Migración de Proyecto Existente
# Uso: ./migrate-project.sh
# Propósito: Migrar proyecto existente a la nueva estructura de docs-template

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

# Verificar que existe docs/ y docs-template/
if [ ! -d "docs" ]; then
    print_error "No se encontró docs/"
    print_error "Este script es para migrar proyectos existentes"
    exit 1
fi

if [ ! -d "docs-template" ]; then
    print_error "No se encontró docs-template/"
    print_error "Asegurate de estar en el directorio correcto"
    exit 1
fi

print_info "Iniciando migración de documentación..."

# Crear backup
BACKUP_DIR="docs-backup-$(date +%Y%m%d-%H%M%S)"
print_info "Creando backup en: $BACKUP_DIR"
cp -r docs "$BACKUP_DIR"
print_success "Backup creado: $BACKUP_DIR"

# Crear directorios necesarios
print_info "Creando nueva estructura..."
mkdir -p "docs/tools/playwright"
mkdir -p "docs/archive"
mkdir -p "docs/archive/analysis"

# ==========================================
# FASE 1: Mover documentación de herramientas a docs/tools/
# ==========================================
print_info "Fase 1: Moviendo documentación de herramientas..."

# Mover archivos de Playwright
if [ -f "docs/PLAYWRIGHT_CLI_COMMANDS.md" ]; then
    mv "docs/PLAYWRIGHT_CLI_COMMANDS.md" "docs/tools/playwright/CLI_COMMANDS.md"
    print_success "Movido: PLAYWRIGHT_CLI_COMMANDS.md → tools/playwright/CLI_COMMANDS.md"
fi

if [ -f "docs/PLAYWRIGHT_CLI_QWEN_CODE.md" ]; then
    mv "docs/PLAYWRIGHT_CLI_QWEN_CODE.md" "docs/tools/playwright/QWEN_CODE.md"
    print_success "Movido: PLAYWRIGHT_CLI_QWEN_CODE.md → tools/playwright/QWEN_CODE.md"
fi

if [ -f "docs/PLAYWRIGHT_CLI_SKILL.md" ]; then
    mv "docs/PLAYWRIGHT_CLI_SKILL.md" "docs/tools/playwright/SKILL.md"
    print_success "Movido: PLAYWRIGHT_CLI_SKILL.md → tools/playwright/SKILL.md"
fi

if [ -f "docs/PLAYWRIGHT_BEST_PRACTICES.md" ]; then
    mv "docs/PLAYWRIGHT_BEST_PRACTICES.md" "docs/tools/playwright/BEST_PRACTICES.md"
    print_success "Movido: PLAYWRIGHT_BEST_PRACTICES.md → tools/playwright/BEST_PRACTICES.md"
fi

if [ -f "docs/PLAYWRIGHT_CLI_IMPLEMENTATION_PLAN.md" ]; then
    mv "docs/PLAYWRIGHT_CLI_IMPLEMENTATION_PLAN.md" "docs/archive/PLAYWRIGHT_CLI_IMPLEMENTATION_PLAN.md"
    print_success "Movido: PLAYWRIGHT_CLI_IMPLEMENTATION_PLAN.md → archive/"
fi

if [ -f "docs/PLAYWRIGHT_CLI_STATUS.md" ]; then
    mv "docs/PLAYWRIGHT_CLI_STATUS.md" "docs/archive/PLAYWRIGHT_CLI_STATUS.md"
    print_success "Movido: PLAYWRIGHT_CLI_STATUS.md → archive/"
fi

# ==========================================
# FASE 2: Mover archivos históricos a archive/
# ==========================================
print_info "Fase 2: Moviendo archivos históricos a archive/..."

if [ -f "docs/DOCUMENTATION_AUDIT.md" ]; then
    mv "docs/DOCUMENTATION_AUDIT.md" "docs/archive/DOCUMENTATION_AUDIT.md"
    print_success "Movido: DOCUMENTATION_AUDIT.md → archive/"
fi

if [ -f "docs/CLEANUP_SUMMARY.md" ]; then
    mv "docs/CLEANUP_SUMMARY.md" "docs/archive/CLEANUP_SUMMARY.md"
    print_success "Movido: CLEANUP_SUMMARY.md → archive/"
fi

# ==========================================
# FASE 3: Actualizar INDEX.md con nueva estructura
# ==========================================
print_info "Fase 3: Actualizando INDEX.md..."

if [ -f "docs/INDEX.md" ]; then
    # Agregar sección de tools si no existe
    if ! grep -q "Tools" "docs/INDEX.md"; then
        # Buscar la línea de "Histórico" y agregar Tools antes
        sed -i.bak '/Histórico/i\
### Herramientas\
\
- **[Tools](./tools/)** - Documentación de herramientas (Playwright, ESLint, etc.)\
' "docs/INDEX.md"
        rm "docs/INDEX.md.bak" 2>/dev/null || true
        print_success "Actualizado: INDEX.md (agregada sección Tools)"
    fi
fi

# ==========================================
# FASE 4: Crear README en tools/
# ==========================================
print_info "Fase 4: Creando README en tools/..."

if [ ! -f "docs/tools/README.md" ]; then
    cat > "docs/tools/README.md" << 'EOF'
# Tools Documentation

Documentación de herramientas específicas del proyecto.

## Herramientas

- **[Playwright](./playwright/)** - Testing E2E

## Agregar Nueva Herramienta

1. Crear directorio: `mkdir docs/tools/[nombre]`
2. Agregar README.md con documentación
3. Actualizar este archivo

EOF
    print_success "Creado: docs/tools/README.md"
fi

# ==========================================
# FASE 5: Crear README en archive/
# ==========================================
print_info "Fase 5: Creando README en archive/..."

if [ ! -f "docs/archive/README.md" ]; then
    cat > "docs/archive/README.md" << 'EOF'
# Archive

Documentación histórica y planes que ya no están activos.

**No leer a menos que sea necesario para contexto histórico.**

## Contenido

- **Analysis** - Análisis y auditorías históricas
- **Plans** - Planes que ya se ejecutaron o cancelaron
- **Old Specs** - Specs viejos reemplazados

EOF
    print_success "Creado: docs/archive/README.md"
fi

# ==========================================
# FASE 6: Validar estructura
# ==========================================
print_info "Fase 6: Validando estructura..."

echo ""
print_info "Estructura final:"
echo ""
echo "docs/"
echo "├── Core (activos)"
echo "│   ├── INDEX.md"
echo "│   ├── CONTEXTO.md"
echo "│   ├── STATUS.md"
echo "│   ├── WORKFLOW.md"
echo "│   └── ai/"
echo "├── Tools (herramientas)"
echo "│   └── playwright/"
echo "├── Archive (histórico)"
echo "│   ├── analysis/"
echo "│   └── [archivos históricos]"
echo "└── [otros archivos específicos del proyecto]"
echo ""

# ==========================================
# Resumen
# ==========================================
echo ""
print_success "¡Migración completada!"
echo ""
echo "📁 Resumen de cambios:"
echo "   - Documentación de herramientas → docs/tools/"
echo "   - Archivos históricos → docs/archive/"
echo "   - Backup creado → $BACKUP_DIR"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Verificar que todos los links en INDEX.md funcionen"
echo "   2. Actualizar referencias a archivos movidos"
echo "   3. Eliminar backup cuando estés seguro: rm -rf $BACKUP_DIR"
echo ""
print_warning "Importante: Verificar que no haya links rotos"
echo ""
