#!/bin/bash

# This script adds ID generation to all Prisma create operations that are missing it

echo "🔧 Adding ID generation to all Prisma create operations..."

# Function to add ID generation before a create call
add_id_generation() {
  local file="$1"
  local model="$2"
  local var_name="$3"
  
  # Check if file already has ID generation for this model
  if grep -q "const ${var_name}Id = randomUUID" "$file"; then
    echo "  ⏭️  Skipping $file - already has ID generation for $model"
    return
  fi
  
  echo "  ✏️  Fixing: $file ($model)"
  
  # Add randomUUID import if not present
  if ! grep -q "const { randomUUID } = require('crypto')" "$file" && ! grep -q "import { randomUUID } from 'crypto'" "$file"; then
    # For TypeScript files
    if [[ "$file" == *.ts ]]; then
      sed -i '' "1i\\
import { randomUUID } from 'crypto';\\
" "$file"
    fi
  fi
}

# List of files to check
files=(
  "src/app/api/auth/free-trial/route.ts"
  "src/app/api/auth/signup/route.ts"
  "src/app/api/webhooks/stripe/route.ts"
  "src/app/api/chat/public/route.ts"
  "src/lib/subscription-service.ts"
  "src/lib/trial-notifications.ts"
  "src/lib/api-usage-service.ts"
  "src/lib/payment-service.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    add_id_generation "$file" "various" "entity"
  fi
done

echo "✅ Done! Now manually review and add IDs where needed."
echo ""
echo "📝 Pattern to add:"
echo "  const { randomUUID } = require('crypto');"
echo "  const entityId = randomUUID().replace(/-/g, '');"
echo "  await prisma.model.create({ data: { id: entityId, ... } });"





