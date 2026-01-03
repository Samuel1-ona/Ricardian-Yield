#!/bin/bash

# Script to convert Next.js files to React + Vite

echo "🚀 Converting Next.js project to React + Vite..."

# Create src directories
mkdir -p src/components/ui src/components/layout src/components/dashboard src/components/charts
mkdir -p src/hooks src/lib src/pages

# Copy components (they mostly work as-is, just need import updates)
echo "📦 Copying components..."
cp -r components/* src/components/ 2>/dev/null || true

# Copy hooks
echo "🪝 Copying hooks..."
cp -r hooks/* src/hooks/ 2>/dev/null || true

# Copy lib
echo "📚 Copying lib..."
cp -r lib/* src/lib/ 2>/dev/null || true

# Convert pages
echo "📄 Converting pages..."
for page in app/*/page.tsx; do
  if [ -f "$page" ]; then
    page_name=$(basename $(dirname "$page"))
    echo "  Converting $page_name..."
    # Remove "use client", remove dynamic exports, update imports
    sed -e 's/"use client";//' \
        -e '/export const dynamic/d' \
        -e 's/from "next\/link"/from "react-router-dom"/' \
        -e 's/from "next\/image"/\/\/ Image removed - use <img> tag/' \
        -e 's/<Link href=/<Link to=/g' \
        -e 's/export default function/export default function/' \
        "$page" > "src/pages/${page_name^}.tsx" 2>/dev/null || true
  fi
done

# Convert home page
if [ -f "app/page.tsx" ]; then
  echo "  Converting home page..."
  sed -e '/export const dynamic/d' \
      -e 's/from "next\/link"/from "react-router-dom"/' \
      -e 's/from "next\/image"/\/\/ Image removed/' \
      -e 's/<Link href=/<Link to=/g' \
      "app/page.tsx" > "src/pages/Home.tsx" 2>/dev/null || true
fi

echo "✅ Conversion complete!"
echo ""
echo "⚠️  Manual steps required:"
echo "1. Review and fix imports in src/pages/*.tsx"
echo "2. Replace Next.js Image components with <img> tags"
echo "3. Update any remaining Next.js-specific code"
echo "4. Run: npm install"
echo "5. Run: npm run dev"

