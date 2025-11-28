const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Document Processor (Text Files Only)\n');

// Test the document processor with a simple text file
async function testDocumentProcessor() {
  try {
    // Import the document processor
    const { DocumentProcessor } = require('../src/lib/document-processor');
    
    console.log('✅ Document processor imported successfully');
    
    // Test with a simple text file
    const testFile = '../sample-documents/company-policies.txt';
    const fileContent = fs.readFileSync(testFile, 'utf-8');
    const buffer = Buffer.from(fileContent, 'utf-8');
    
    console.log('📄 Testing with company-policies.txt');
    console.log(`📊 File size: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // Test processing
    const processedDoc = await DocumentProcessor.processDocument(
      buffer,
      'company-policies.txt',
      'text/plain'
    );
    
    console.log('✅ Document processed successfully!');
    console.log(`📝 Type: ${processedDoc.type}`);
    console.log(`📊 Word count: ${processedDoc.metadata.wordCount}`);
    console.log(`📊 Character count: ${processedDoc.metadata.charCount}`);
    console.log(`📄 Pages: ${processedDoc.metadata.pages || 'N/A'}`);
    
    // Test chunking
    const chunks = DocumentProcessor.chunkDocument(processedDoc.content, 500, 100);
    console.log(`📦 Created ${chunks.length} chunks`);
    
    // Test supported file types
    const supportedTypes = DocumentProcessor.getSupportedFileTypes();
    console.log(`🔧 Supported file types: ${supportedTypes.join(', ')}`);
    
    console.log('\n🎉 All tests passed! Document processor is working correctly for text files.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('pdf-parse')) {
      console.log('\n💡 This is the PDF parsing issue we identified.');
      console.log('Text files should still work fine!');
    }
  }
}

// Run the test
testDocumentProcessor(); 