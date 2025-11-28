console.log('🧪 Testing File Type Detection and Validation\n');

// Test the file type detection logic
function testFileTypes() {
  try {
    // Import the document processor
    const { DocumentProcessor } = require('../src/lib/document-processor');
    
    console.log('✅ Document processor imported successfully\n');
    
    // Test cases
    const testCases = [
      { input: 'text/plain', expected: 'TXT', description: 'MIME type for text files' },
      { input: 'application/json', expected: 'JSON', description: 'MIME type for JSON files' },
      { input: 'text/markdown', expected: 'MARKDOWN', description: 'MIME type for markdown files' },
      { input: 'text/html', expected: 'HTML', description: 'MIME type for HTML files' },
      { input: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', expected: 'DOCX', description: 'MIME type for Word files' },
      { input: '.txt', expected: 'TXT', description: 'File extension for text files' },
      { input: '.json', expected: 'JSON', description: 'File extension for JSON files' },
      { input: '.md', expected: 'MARKDOWN', description: 'File extension for markdown files' },
      { input: '.html', expected: 'HTML', description: 'File extension for HTML files' },
      { input: '.docx', expected: 'DOCX', description: 'File extension for Word files' },
      { input: 'unknown/type', expected: 'TXT', description: 'Unknown type (should default to TXT)' }
    ];
    
    console.log('📋 Testing file type detection:');
    testCases.forEach((testCase, index) => {
      const result = DocumentProcessor.getDocumentType(testCase.input);
      const status = result === testCase.expected ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${testCase.input} → ${result} (expected: ${testCase.expected}) - ${testCase.description}`);
    });
    
    console.log('\n🔧 Testing file type validation:');
    const supportedTypes = DocumentProcessor.getSupportedFileTypes();
    console.log(`Supported types: ${supportedTypes.join(', ')}`);
    
    const validationTests = [
      'text/plain',
      'application/json', 
      'text/markdown',
      'text/html',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'unknown/type'
    ];
    
    validationTests.forEach((fileType, index) => {
      const isSupported = DocumentProcessor.isFileTypeSupported(fileType);
      const status = isSupported ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${fileType} - ${isSupported ? 'Supported' : 'Not supported'}`);
    });
    
    console.log('\n🎯 Key test for your issue:');
    const textPlainType = DocumentProcessor.getDocumentType('text/plain');
    const isTextPlainSupported = DocumentProcessor.isFileTypeSupported('text/plain');
    console.log(`text/plain → ${textPlainType} → Supported: ${isTextPlainSupported}`);
    
    if (isTextPlainSupported) {
      console.log('🎉 text/plain should now work correctly!');
    } else {
      console.log('❌ text/plain is still not supported - need to debug further');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFileTypes(); 