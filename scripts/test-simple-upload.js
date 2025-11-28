console.log('🧪 Simple File Type Test\n');

// Test the file type detection logic directly
function testFileTypeDetection() {
  try {
    // Test the logic that should work
    const testCases = [
      'text/plain',
      'application/json',
      'text/markdown',
      'text/html',
      '.txt',
      '.json',
      '.md',
      '.html'
    ];
    
    console.log('📋 Testing file type mapping logic:');
    
    // Simulate the getDocumentType method
    const typeMap = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'text/plain': 'TXT',
      'text/html': 'HTML',
      'text/markdown': 'MARKDOWN',
      'application/json': 'JSON',
      '.pdf': 'PDF',
      '.docx': 'DOCX',
      '.txt': 'TXT',
      '.html': 'HTML',
      '.htm': 'HTML',
      '.md': 'MARKDOWN',
      '.json': 'JSON'
    };
    
    const getDocumentType = (fileType) => {
      const normalizedInput = fileType.toLowerCase();
      const result = typeMap[normalizedInput] || 'TXT';
      console.log(`  "${fileType}" → "${normalizedInput}" → "${result}"`);
      return result;
    };
    
    // Test the mapping
    testCases.forEach(testCase => {
      getDocumentType(testCase);
    });
    
    console.log('\n🔧 Testing the specific case that failed:');
    const textPlainType = getDocumentType('text/plain');
    console.log(`text/plain → ${textPlainType}`);
    
    // Simulate the supported types check
    const supportedTypes = ['TXT', 'HTML', 'MARKDOWN', 'JSON', 'DOCX'];
    console.log(`Supported types: ${supportedTypes.join(', ')}`);
    
    const isSupported = supportedTypes.includes(textPlainType);
    console.log(`Is text/plain supported? ${isSupported ? '✅ YES' : '❌ NO'}`);
    
    if (isSupported) {
      console.log('\n🎉 The logic should work! text/plain → TXT → Supported');
      console.log('The issue might be elsewhere in the code.');
    } else {
      console.log('\n❌ The logic is broken. Need to fix the type mapping.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFileTypeDetection(); 