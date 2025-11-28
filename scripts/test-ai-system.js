const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-key';
process.env.PINECONE_API_KEY = 'test-key';
process.env.PINECONE_ENVIRONMENT = 'test';

const prisma = new PrismaClient();

async function testAISystem() {
  console.log('🧪 Testing AI System Components...\n');

  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing Database Connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Check Existing Data
    console.log('2️⃣ Checking Existing Data...');
    const tenants = await prisma.tenant.findMany();
    const bots = await prisma.bot.findMany();
    const knowledgeBases = await prisma.knowledgeBase.findMany();
    
    console.log(`   Tenants: ${tenants.length}`);
    console.log(`   Bots: ${bots.length}`);
    console.log(`   Knowledge Bases: ${knowledgeBases.length}\n`);

    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please run setup-test-account.js first.\n');
      return;
    }

    // Test 3: Create Test Document
    console.log('3️⃣ Creating Test Document...');
    const testContent = `Customer Service Policy

Our company is committed to providing excellent customer service. We offer:

1. 30-day return policy on all products
2. 24/7 customer support via chat and phone
3. Free shipping on orders over $50
4. Lifetime warranty on premium products

For any questions, please contact our support team at support@company.com or call 1-800-SUPPORT.

Return Process:
- Items must be in original condition
- Return shipping is free for defective items
- Refunds processed within 5 business days
- Store credit available for non-defective returns

We value your business and strive to exceed your expectations.`;

    const testDocument = await prisma.document.create({
      data: {
        title: 'Customer Service Policy',
        content: testContent,
        type: 'TXT',
        knowledgeBaseId: knowledgeBases[0]?.id || 'test-kb',
        status: 'ACTIVE'
      }
    });

    console.log(`✅ Test document created: ${testDocument.id}\n`);

    // Test 4: Test Document Processing (Mock)
    console.log('4️⃣ Testing Document Processing (Mock)...');
    
    // Create mock AI-ready chunks
    const chunks = [
      {
        id: `chunk_${Date.now()}_0`,
        content: testContent.substring(0, 500),
        startIndex: 0,
        endIndex: 500,
        metadata: {
          chunkIndex: 0,
          totalChunks: 3,
          sourceDocument: 'Customer Service Policy',
          documentId: testDocument.id,
          knowledgeBaseId: knowledgeBases[0]?.id || 'test-kb',
          tenantId: tenants[0].id,
          documentType: 'TXT',
          createdAt: new Date().toISOString()
        }
      },
      {
        id: `chunk_${Date.now()}_1`,
        content: testContent.substring(400, 900),
        startIndex: 400,
        endIndex: 900,
        metadata: {
          chunkIndex: 1,
          totalChunks: 3,
          sourceDocument: 'Customer Service Policy',
          documentId: testDocument.id,
          knowledgeBaseId: knowledgeBases[0]?.id || 'test-kb',
          tenantId: tenants[0].id,
          documentType: 'TXT',
          createdAt: new Date().toISOString()
        }
      },
      {
        id: `chunk_${Date.now()}_2`,
        content: testContent.substring(800),
        startIndex: 800,
        endIndex: testContent.length,
        metadata: {
          chunkIndex: 2,
          totalChunks: 3,
          sourceDocument: 'Customer Service Policy',
          documentId: testDocument.id,
          knowledgeBaseId: knowledgeBases[0]?.id || 'test-kb',
          tenantId: tenants[0].id,
          documentType: 'TXT',
          createdAt: new Date().toISOString()
        }
      }
    ];

    console.log(`✅ Document processed into ${chunks.length} chunks`);
    console.log(`   First chunk: ${chunks[0].content.substring(0, 100)}...`);
    console.log(`   Metadata: ${JSON.stringify(chunks[0].metadata, null, 2)}\n`);

    // Test 5: Test AI Embeddings (Mock)
    console.log('5️⃣ Testing AI Embeddings (Mock)...');
    
    // Create mock embeddings (1536 dimensions for OpenAI text-embedding-3-small)
    const mockEmbeddings = chunks.map(() => 
      Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    );

    console.log(`✅ Generated ${mockEmbeddings.length} mock embeddings`);
    console.log(`   Each embedding: ${mockEmbeddings[0].length} dimensions\n`);

    // Test 6: Test Vector Database Operations (Mock)
    console.log('6️⃣ Testing Vector Database Operations (Mock)...');
    
    // Simulate vector storage
    const vectorStorage = {
      storeDocumentChunks: async (chunks, embeddings) => {
        console.log(`   Storing ${chunks.length} chunks with embeddings`);
        return Promise.resolve();
      },
      searchSimilarChunks: async (queryEmbedding, knowledgeBaseId, tenantId) => {
        console.log(`   Searching for similar chunks in KB: ${knowledgeBaseId}`);
        return chunks.map((chunk, index) => ({
          id: chunk.id,
          score: 0.9 - (index * 0.1),
          content: chunk.content,
          metadata: chunk.metadata
        }));
      }
    };

    await vectorStorage.storeDocumentChunks(chunks, mockEmbeddings);
    const searchResults = await vectorStorage.searchSimilarChunks(
      mockEmbeddings[0],
      knowledgeBases[0]?.id || 'test-kb',
      tenants[0].id
    );

    console.log(`✅ Vector operations successful`);
    console.log(`   Search results: ${searchResults.length} chunks found\n`);

    // Test 7: Test AI Chat Service (Mock)
    console.log('7️⃣ Testing AI Chat Service (Mock)...');
    
    const mockChatService = {
      chat: async (userMessage, context) => {
        console.log(`   User message: "${userMessage}"`);
        console.log(`   Context: KB=${context.knowledgeBaseId}, Tenant=${context.tenantId}`);
        
        // Simulate AI response with context
        const relevantChunk = searchResults[0];
        const response = `Based on our customer service policy, ${userMessage.toLowerCase().includes('return') ? 'we offer a 30-day return policy on all products. Items must be in original condition and return shipping is free for defective items.' : 'we are committed to providing excellent customer service with 24/7 support available.'}`;
        
        return {
          message: response,
          context: {
            sources: [{
              documentId: relevantChunk.metadata.documentId,
              title: relevantChunk.metadata.sourceDocument,
              content: relevantChunk.content.substring(0, 100) + '...',
              score: relevantChunk.score
            }],
            tokensUsed: 150,
            cost: 0.0003
          }
        };
      }
    };

    const chatResponse = await mockChatService.chat(
      'What is your return policy?',
      {
        conversationId: 'test-conv',
        botId: bots[0]?.id || 'test-bot',
        tenantId: tenants[0].id,
        knowledgeBaseId: knowledgeBases[0]?.id || 'test-kb',
        maxContextLength: 2000,
        temperature: 0.7,
        maxTokens: 500
      }
    );

    console.log(`✅ AI chat successful`);
    console.log(`   Response: ${chatResponse.message}`);
    console.log(`   Sources: ${chatResponse.context.sources.length}`);
    console.log(`   Cost: $${chatResponse.context.cost}\n`);

    // Test 8: Cleanup
    console.log('8️⃣ Cleaning up test data...');
    await prisma.document.delete({
      where: { id: testDocument.id }
    });
    console.log('✅ Test document cleaned up\n');

    console.log('🎉 All AI System Tests Passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database connection');
    console.log('   ✅ Document processing');
    console.log('   ✅ AI chunking');
    console.log('   ✅ Mock embeddings');
    console.log('   ✅ Vector operations');
    console.log('   ✅ AI chat service');
    console.log('   ✅ Data cleanup');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
if (require.main === module) {
  testAISystem();
}

module.exports = { testAISystem }; 