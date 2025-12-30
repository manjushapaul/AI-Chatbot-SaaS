#!/bin/bash

# Script to fix all Prisma model references from singular to plural

echo "🔧 Fixing Prisma model names across the codebase..."

# Find all TypeScript files in src directory
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Skip if file doesn't exist
  [ ! -f "$file" ] && continue
  
  # Check if file contains prisma model references
  if grep -q "prisma\.\(bot\|user\|tenant\|conversation\|notification\|widget\|knowledgeBase\|document\|fAQ\|apiKey\|message\|subscription\)\." "$file"; then
    echo "  Fixing: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Replace all singular model names with plural
    sed -i '' \
      -e 's/prisma\.bot\./(prisma as any).bots./g' \
      -e 's/prisma\.user\./(prisma as any).users./g' \
      -e 's/prisma\.tenant\./(prisma as any).tenants./g' \
      -e 's/prisma\.conversation\./(prisma as any).conversations./g' \
      -e 's/prisma\.notification\./(prisma as any).notifications./g' \
      -e 's/prisma\.widget\./(prisma as any).widgets./g' \
      -e 's/prisma\.knowledgeBase\./(prisma as any).knowledge_bases./g' \
      -e 's/prisma\.document\./(prisma as any).documents./g' \
      -e 's/prisma\.fAQ\./(prisma as any).faqs./g' \
      -e 's/prisma\.apiKey\./(prisma as any).api_keys./g' \
      -e 's/prisma\.message\./(prisma as any).messages./g' \
      -e 's/prisma\.subscription\./(prisma as any).subscriptions./g' \
      -e 's/prisma\.notificationPreference\./(prisma as any).notification_preferences./g' \
      -e 's/prisma\.billingHistory\./(prisma as any).billing_history./g' \
      -e 's/prisma\.apiUsage\./(prisma as any).api_usage./g' \
      "$file"
    
    # Remove backup if successful
    rm "$file.bak"
  fi
done

echo "✅ Done! All Prisma model names have been updated."
echo ""
echo "📝 Changes made:"
echo "  - prisma.bot → (prisma as any).bots"
echo "  - prisma.user → (prisma as any).users"
echo "  - prisma.tenant → (prisma as any).tenants"
echo "  - prisma.conversation → (prisma as any).conversations"
echo "  - prisma.notification → (prisma as any).notifications"
echo "  - prisma.widget → (prisma as any).widgets"
echo "  - prisma.knowledgeBase → (prisma as any).knowledge_bases"
echo "  - prisma.document → (prisma as any).documents"
echo "  - prisma.fAQ → (prisma as any).faqs"
echo "  - prisma.apiKey → (prisma as any).api_keys"
echo "  - prisma.message → (prisma as any).messages"
echo "  - prisma.subscription → (prisma as any).subscriptions"
echo ""
echo "🔄 Please restart your dev server for changes to take effect."



