'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  FileText, 
  History, 
  Settings, 
  Plus,
  Trash2,
  Star,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date;
  paid: boolean;
  pdfUrl?: string;
  description?: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: Date;
  description?: string;
  invoiceId?: string;
}

export default function PaymentProcessingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'methods' | 'invoices' | 'history'>('methods');
  const [showAddMethod, setShowAddMethod] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    fetchPaymentData();
  }, [status, router]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment methods
      const methodsResponse = await fetch('/api/billing/payment-methods');
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json();
        setPaymentMethods(methodsData.data || []);
      }

      // Fetch invoices
      const invoicesResponse = await fetch('/api/billing/invoices');
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.data || []);
      }

      // Fetch payment history
      const historyResponse = await fetch('/api/billing/subscription');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        // Transform subscription data to payment history format
        if (historyData.data?.billingHistory) {
          setPaymentHistory(historyData.data.billingHistory);
        }
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId })
      });

      if (response.ok) {
        await fetchPaymentData();
        setShowAddMethod(false);
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      const response = await fetch(`/api/billing/payment-methods?id=${paymentMethodId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPaymentData();
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/billing/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, action: 'set_default' })
      });

      if (response.ok) {
        await fetchPaymentData();
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const handleCustomerPortal = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'customer_portal' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.portalUrl) {
          window.open(data.data.portalUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'active':
        return 'text-accent-strong bg-green-100';
      case 'pending':
      case 'incomplete':
        return 'text-accent-strong bg-yellow-100';
      case 'failed':
      case 'canceled':
        return 'text-accent-strong bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Processing</h1>
          <p className="mt-2 text-gray-600">
            Manage your payment methods, view invoices, and access billing history
          </p>
        </div>

        {/* Customer Portal Access */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Portal</h2>
              <p className="text-gray-600 mt-1">
                Access your Stripe customer portal to manage subscriptions and billing
              </p>
            </div>
            <button
              onClick={handleCustomerPortal}
              className="bg-accent-strong text-white px-6 py-3 rounded-md hover:opacity-90 flex items-center space-x-2"
            >
              <Settings className="w-5 h-5 text-white" />
              <span>Access Portal</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('methods')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'methods'
                    ? 'border-accent-strong text-accent-strong'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-2 text-accent-strong" />
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invoices'
                    ? 'border-accent-strong text-accent-strong'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2 text-accent-strong" />
                Invoices
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-accent-strong text-accent-strong'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                Payment History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Payment Methods Tab */}
            {activeTab === 'methods' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                  <button
                    onClick={() => setShowAddMethod(true)}
                    className="bg-accent-strong text-white px-4 py-2 rounded-md hover:opacity-90 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Add Method</span>
                  </button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-accent-strong mx-auto mb-4 text-accent-strong" />
                    <p className="text-gray-500">No payment methods found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add a payment method to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-accent-strong" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {method.card ? (
                                <>
                                  {method.card.brand.toUpperCase()} •••• {method.card.last4}
                                </>
                              ) : (
                                method.type.toUpperCase()
                              )}
                            </p>
                            {method.card && (
                              <p className="text-sm text-gray-500">
                                Expires {method.card.expMonth}/{method.card.expYear}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            className="text-accent-strong hover:text-blue-700 p-2"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4 text-accent-strong" />
                          </button>
                          <button
                            onClick={() => handleRemovePaymentMethod(method.id)}
                            className="text-accent-strong hover:text-red-700 p-2"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4 text-accent-strong" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Invoices</h3>
                
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-accent-strong mx-auto mb-4 text-accent-strong" />
                    <p className="text-gray-500">No invoices found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-8 bg-green-100 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-accent-strong" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Invoice {invoice.number}
                            </p>
                            <p className="text-sm text-gray-500">
                              Due: {formatDate(invoice.dueDate)}
                            </p>
                            {invoice.description && (
                              <p className="text-sm text-gray-600">{invoice.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {invoice.pdfUrl && (
                              <button
                                onClick={() => window.open(invoice.pdfUrl, '_blank')}
                                className="text-accent-strong hover:text-blue-700 p-2"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4 text-accent-strong" />
                              </button>
                            )}
                            <button
                              onClick={() => {/* View invoice details */}}
                              className="text-gray-600 hover:text-gray-700 p-2"
                              title="View details"
                            >
                              <Eye className="w-4 h-4 text-accent-strong" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Payment History</h3>
                
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-accent-strong mx-auto mb-4" />
                    <p className="text-gray-500">No payment history found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-8 rounded flex items-center justify-center ${
                            payment.status === 'PAID' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {payment.status === 'PAID' ? (
                              <CheckCircle className="w-5 h-5 text-accent-strong" />
                            ) : payment.status === 'FAILED' ? (
                              <XCircle className="w-5 h-5 text-accent-strong" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-accent-strong" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.description || `Payment ${payment.id.slice(-6)}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(payment.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            payment.status === 'REFUNDED' ? 'text-accent-strong' : 'text-gray-900'
                          }`}>
                            {payment.status === 'REFUNDED' ? '-' : ''}{formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Payment Method Modal */}
        {showAddMethod && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-md bg-white/20 backdrop-blur-md">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment Method</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This feature requires Stripe Elements integration. For now, you can add payment methods through the Stripe customer portal.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddMethod(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMethod(false);
                      handleCustomerPortal();
                    }}
                    className="bg-accent-strong text-white px-4 py-2 rounded-md hover:opacity-90"
                  >
                    Go to Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 