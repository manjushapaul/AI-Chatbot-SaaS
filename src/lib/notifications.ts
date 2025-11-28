/**
 * Notification event hooks and helpers
 * 
 * These functions can be called from various parts of the app to create notifications.
 * They should be called server-side (in API routes) to ensure proper tenant context.
 */

interface CreateNotificationParams {
  userId: string;
  tenantId: string;
  type: string;
  title: string;
  message: string;
  category: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionUrl?: string;
  metadata?: any;
}

/**
 * Create a notification (server-side only)
 * This should be called from API routes with proper tenant context
 */
export async function createNotification(params: CreateNotificationParams) {
  // This would typically call the database helper
  // For now, this is a placeholder that should be called from API routes
  // The actual implementation should use createTenantDB and call createNotification
  throw new Error('createNotification should be called from API routes with tenant context');
}

/**
 * Event hooks that can be called from various parts of the app
 * These are stubs that should be implemented in the actual API routes
 */

// Bot Activity Notifications
export async function onConversationStarted(
  userId: string,
  tenantId: string,
  conversationId: string,
  botName: string
) {
  // Stub - should be implemented in the conversation creation API route
  console.log('onConversationStarted', { userId, tenantId, conversationId, botName });
}

export async function onConversationResolved(
  userId: string,
  tenantId: string,
  conversationId: string,
  botName: string
) {
  // Stub - should be implemented in the conversation close API route
  console.log('onConversationResolved', { userId, tenantId, conversationId, botName });
}

export async function onUserRatedConversation(
  userId: string,
  tenantId: string,
  conversationId: string,
  rating: number
) {
  // Stub - should be implemented in the rating API route
  console.log('onUserRatedConversation', { userId, tenantId, conversationId, rating });
}

export async function onHighConversationVolume(
  userId: string,
  tenantId: string,
  count: number
) {
  // Stub - should be implemented in analytics/monitoring
  console.log('onHighConversationVolume', { userId, tenantId, count });
}

// System/Performance Notifications
export async function onBotOffline(
  userId: string,
  tenantId: string,
  botId: string,
  botName: string
) {
  // Stub - should be implemented in bot health monitoring
  console.log('onBotOffline', { userId, tenantId, botId, botName });
}

export async function onHighResponseTime(
  userId: string,
  tenantId: string,
  botId: string,
  responseTime: number
) {
  // Stub - should be implemented in performance monitoring
  console.log('onHighResponseTime', { userId, tenantId, botId, responseTime });
}

export async function onTrainingCompleted(
  userId: string,
  tenantId: string,
  knowledgeBaseId: string,
  knowledgeBaseName: string
) {
  // Stub - should be implemented in knowledge base training API route
  console.log('onTrainingCompleted', { userId, tenantId, knowledgeBaseId, knowledgeBaseName });
}

export async function onTrainingFailed(
  userId: string,
  tenantId: string,
  knowledgeBaseId: string,
  knowledgeBaseName: string,
  error: string
) {
  // Stub - should be implemented in knowledge base training API route
  console.log('onTrainingFailed', { userId, tenantId, knowledgeBaseId, knowledgeBaseName, error });
}

// Business Metrics Notifications
export async function onDailySummaryReady(
  userId: string,
  tenantId: string,
  summary: any
) {
  // Stub - should be implemented in daily summary job
  console.log('onDailySummaryReady', { userId, tenantId, summary });
}

export async function onUsageLimitApproaching(
  userId: string,
  tenantId: string,
  usage: number,
  limit: number
) {
  // Stub - should be implemented in usage monitoring
  console.log('onUsageLimitApproaching', { userId, tenantId, usage, limit });
}

// Billing Notifications
export async function onPaymentSuccess(
  userId: string,
  tenantId: string,
  amount: number,
  invoiceId: string
) {
  // Stub - should be implemented in payment webhook handler
  console.log('onPaymentSuccess', { userId, tenantId, amount, invoiceId });
}

export async function onPaymentFailed(
  userId: string,
  tenantId: string,
  amount: number,
  invoiceId: string,
  reason: string
) {
  // Stub - should be implemented in payment webhook handler
  console.log('onPaymentFailed', { userId, tenantId, amount, invoiceId, reason });
}

export async function onSubscriptionExpiring(
  userId: string,
  tenantId: string,
  daysUntilExpiry: number
) {
  // Stub - should be implemented in subscription monitoring
  console.log('onSubscriptionExpiring', { userId, tenantId, daysUntilExpiry });
}

// Security Notifications
export async function onNewLogin(
  userId: string,
  tenantId: string,
  ip: string,
  location: string,
  device: string
) {
  // Stub - should be implemented in auth middleware
  console.log('onNewLogin', { userId, tenantId, ip, location, device });
}

export async function onPasswordChanged(
  userId: string,
  tenantId: string
) {
  // Stub - should be implemented in password change API route
  console.log('onPasswordChanged', { userId, tenantId });
}

export async function onApiKeyCreated(
  userId: string,
  tenantId: string,
  apiKeyId: string,
  apiKeyName: string
) {
  // Stub - should be implemented in API key creation route
  console.log('onApiKeyCreated', { userId, tenantId, apiKeyId, apiKeyName });
}

// Knowledge Base Notifications
export async function onDocumentUploaded(
  userId: string,
  tenantId: string,
  documentId: string,
  documentTitle: string,
  knowledgeBaseId: string
) {
  // Stub - should be implemented in document upload API route
  console.log('onDocumentUploaded', { userId, tenantId, documentId, documentTitle, knowledgeBaseId });
}

export async function onDocumentProcessingFailed(
  userId: string,
  tenantId: string,
  documentId: string,
  documentTitle: string,
  error: string
) {
  // Stub - should be implemented in document processing
  console.log('onDocumentProcessingFailed', { userId, tenantId, documentId, documentTitle, error });
}

// Widget Notifications
export async function onNewWidgetInstalled(
  userId: string,
  tenantId: string,
  widgetId: string,
  widgetName: string
) {
  // Stub - should be implemented in widget creation API route
  console.log('onNewWidgetInstalled', { userId, tenantId, widgetId, widgetName });
}

export async function onWidgetErrorDetected(
  userId: string,
  tenantId: string,
  widgetId: string,
  widgetName: string,
  error: string
) {
  // Stub - should be implemented in widget error monitoring
  console.log('onWidgetErrorDetected', { userId, tenantId, widgetId, widgetName, error });
}

