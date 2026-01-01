/**
 * Script to fix document status for existing documents
 * This ensures all documents have ACTIVE status so they appear in queries
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDocumentStatus() {
  try {
    console.log('🔧 Fixing document status...');
    
    // Update all documents without status or with non-ACTIVE status to ACTIVE
    const result = await prisma.documents.updateMany({
      where: {
        OR: [
          { status: null as unknown as 'ACTIVE' },
          { status: { not: 'ACTIVE' } },
        ],
      },
      data: {
        status: 'ACTIVE',
      },
    });
    
    console.log(`✅ Updated ${result.count} documents to ACTIVE status`);
    
    // Verify the fix
    const activeDocs = await prisma.documents.count({
      where: {
        status: 'ACTIVE',
      },
    });
    
    const totalDocs = await prisma.documents.count();
    
    console.log(`📊 Total documents: ${totalDocs}`);
    console.log(`✅ Active documents: ${activeDocs}`);
    console.log(`⚠️  Inactive documents: ${totalDocs - activeDocs}`);
    
  } catch (error) {
    console.error('❌ Error fixing document status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixDocumentStatus()
  .then(() => {
    console.log('✅ Document status fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Document status fix failed:', error);
    process.exit(1);
  });






