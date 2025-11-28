const testPublicChat = async () => {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Create a new conversation
    console.log('🧪 Testing public chat endpoint...');
    
    const response = await fetch(`${baseUrl}/api/chat/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, this is a test message',
        botId: 'test-bot-id', // You'll need to replace this with a real bot ID
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Public chat POST successful:', data);
      
      if (data.success && data.data.conversationId) {
        // Test 2: Retrieve conversation history
        const getResponse = await fetch(
          `${baseUrl}/api/chat/public?conversationId=${data.data.conversationId}&botId=test-bot-id`
        );
        
        if (getResponse.ok) {
          const historyData = await getResponse.json();
          console.log('✅ Conversation history GET successful:', historyData);
        } else {
          console.log('❌ Failed to get conversation history:', getResponse.status);
        }
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Public chat POST failed:', response.status, errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testPublicChat(); 