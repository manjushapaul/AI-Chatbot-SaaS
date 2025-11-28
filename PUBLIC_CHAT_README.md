# Public Chat API Documentation

This document describes the public chat endpoint that allows unauthenticated users to interact with chatbots through the widget interface.

## Overview

The public chat endpoint (`/api/chat/public`) provides a way for anonymous users to chat with bots without requiring authentication. This is essential for public-facing chat widgets that can be embedded on any website.

## Endpoints

### POST `/api/chat/public`

Send a message to a bot and receive a response.

**Request Body:**
```json
{
  "message": "Hello, how can you help me?",
  "botId": "bot-uuid-here",
  "conversationId": "optional-existing-conversation-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv-uuid-here",
    "message": "Hello! I'm here to help you with any questions you might have.",
    "sources": ["source1", "source2"],
    "metadata": {}
  }
}
```

**Error Response:**
```json
{
  "error": "Bot not found or inactive"
}
```

### GET `/api/chat/public`

Retrieve conversation history for a specific conversation.

**Query Parameters:**
- `conversationId` (required): The conversation ID
- `botId` (required): The bot ID

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv-uuid-here",
    "sessionId": "session-uuid-here",
    "messages": [
      {
        "id": "msg-uuid-here",
        "content": "Hello",
        "role": "user",
        "timestamp": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "msg-uuid-here-2",
        "content": "Hi there! How can I help you?",
        "role": "assistant",
        "timestamp": "2024-01-01T00:00:01.000Z"
      }
    ]
  }
}
```

## Features

### 1. **No Authentication Required**
- Public endpoint accessible to anyone
- No API keys or user accounts needed
- Perfect for embedded widgets

### 2. **Session Management**
- Automatic conversation creation for new sessions
- Persistent conversation history via conversationId
- Unique session IDs for tracking

### 3. **Rate Limiting**
- Basic rate limiting (50 messages per hour per session)
- Prevents abuse while maintaining usability

### 4. **Error Handling**
- Comprehensive error messages
- Graceful fallbacks for various failure scenarios
- Detailed logging for debugging

### 5. **CORS Support**
- Full CORS headers for cross-origin requests
- Works with widgets embedded on any domain

## Security Features

### 1. **Bot Validation**
- Only active bots can be used
- Bot must belong to an active tenant
- Prevents access to disabled or deleted bots

### 2. **Input Validation**
- Message length limits (1000 characters)
- Required field validation
- Sanitized inputs

### 3. **Rate Limiting**
- Per-session rate limiting
- Prevents spam and abuse
- Configurable limits

## Usage Examples

### Basic Chat Widget Integration

```javascript
// Send a message
const response = await fetch('/api/chat/public', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    botId: 'your-bot-id-here'
  }),
});

const data = await response.json();
if (data.success) {
  console.log('Bot response:', data.data.message);
  console.log('Conversation ID:', data.data.conversationId);
}
```

### Continuing a Conversation

```javascript
// Continue existing conversation
const response = await fetch('/api/chat/public', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Tell me more about that',
    botId: 'your-bot-id-here',
    conversationId: 'existing-conversation-id'
  }),
});
```

### Loading Conversation History

```javascript
// Load conversation history
const response = await fetch(
  `/api/chat/public?conversationId=${conversationId}&botId=${botId}`
);

const data = await response.json();
if (data.success) {
  data.data.messages.forEach(msg => {
    console.log(`${msg.role}: ${msg.content}`);
  });
}
```

## Widget Configuration

The ChatWidget component automatically uses the public endpoint and handles:

- Message sending and receiving
- Conversation persistence
- Error handling and retry logic
- Loading states and user feedback

## Testing

### 1. **Test Page**
Visit `/test-widget.html` to test the public chat functionality with a simple interface.

### 2. **Test Script**
Run the test script to verify API functionality:
```bash
node scripts/test-public-chat.js
```

### 3. **Manual Testing**
Use tools like Postman or curl to test the endpoints directly.

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Message and botId are required | Missing required fields |
| 400 | Message too long | Message exceeds 1000 characters |
| 404 | Bot not found or inactive | Bot doesn't exist or is disabled |
| 404 | Conversation not found | Invalid conversation ID |
| 429 | Rate limit exceeded | Too many messages in short time |
| 503 | Bot service temporarily unavailable | Tenant or service issues |
| 500 | Internal server error | Unexpected server error |

## Best Practices

### 1. **Store Conversation IDs**
- Always store the conversationId returned from the API
- Use it for subsequent messages to maintain context
- Implement local storage for persistence

### 2. **Handle Errors Gracefully**
- Show user-friendly error messages
- Implement retry logic for transient failures
- Log errors for debugging

### 3. **Rate Limiting**
- Implement client-side rate limiting
- Show appropriate messages when limits are reached
- Guide users to wait before sending more messages

### 4. **Security**
- Validate botId on the client side
- Don't expose sensitive information in error messages
- Implement proper CORS policies

## Troubleshooting

### Common Issues

1. **Bot not found errors**
   - Verify the botId is correct
   - Ensure the bot is active
   - Check if the tenant is active

2. **CORS errors**
   - Verify CORS headers are being sent
   - Check if the request origin is allowed

3. **Rate limiting**
   - Implement exponential backoff
   - Show user-friendly rate limit messages

4. **Conversation persistence**
   - Store conversationId in localStorage
   - Handle page refreshes gracefully

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=chat:public
```

## Support

For issues or questions about the public chat API:

1. Check the error logs in the console
2. Verify bot and tenant status
3. Test with the provided test tools
4. Review the error codes and messages 