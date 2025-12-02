'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Save, ArrowLeft, Sparkles, Settings, Brain, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { AppPage } from '@/components/dashboard/AppPage';
import { typography, spacing } from '@/lib/design-tokens';
import { EmojiPicker } from '@/components/ui/EmojiPicker';

interface BotFormData {
  name: string;
  description: string;
  avatar: string;
  personality: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const aiModels = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model, best for complex tasks', price: 'High' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient, good for most use cases', price: 'Medium' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Excellent reasoning and analysis', price: 'Medium' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest and most cost-effective', price: 'Low' },
];

const personalityTemplates = [
  {
    name: 'Professional Assistant',
    description: 'Formal, helpful, and business-oriented',
    template: 'You are a professional and helpful AI assistant. You provide clear, accurate, and helpful responses while maintaining a professional tone.'
  },
  {
    name: 'Friendly Helper',
    description: 'Warm, approachable, and conversational',
    template: 'You are a friendly and approachable AI assistant. You help users with a warm, conversational tone while being informative and helpful.'
  },
  {
    name: 'Technical Expert',
    description: 'Precise, detailed, and technically accurate',
    template: 'You are a technical expert AI assistant. You provide detailed, accurate technical information with precision and clarity.'
  },
  {
    name: 'Creative Partner',
    description: 'Imaginative, inspiring, and innovative',
    template: 'You are a creative and innovative AI assistant. You help users think outside the box and explore creative solutions.'
  },
  {
    name: 'Custom',
    description: 'Define your own personality',
    template: ''
  }
];

export default function CreateBotPage() {
  const router = useRouter();
  const [showDebug, setShowDebug] = useState(false);
  
  // Always start at step 1 for new bot creation
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BotFormData>({
    name: '',
    description: '',
    avatar: '🤖',
    personality: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    status: 'ACTIVE'
  });

  const [selectedPersonalityTemplate, setSelectedPersonalityTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear sessionStorage on mount and prevent step from being reset
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('botCreationStep');
    }
    setCurrentStep(1);
  }, []);

  // Store step in sessionStorage when it changes
  useEffect(() => {
    if (currentStep > 0 && typeof window !== 'undefined') {
      sessionStorage.setItem('botCreationStep', currentStep.toString());
    }
  }, [currentStep]);

  // Global form submission blocker
  useEffect(() => {
    const form = document.getElementById('bot-creation-form') as HTMLFormElement;
    if (form) {
      const preventSubmit = (e: Event) => {
        if (currentStep !== 3) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      
      form.addEventListener('submit', preventSubmit);
      return () => {
        form.removeEventListener('submit', preventSubmit);
      };
    }
  }, [currentStep]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep !== 3) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentStep !== 3) {
      return;
    }
    
    handleSubmit(e);
  };

  const handleInputChange = (field: keyof BotFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonalityTemplateSelect = (template: { name: string; template: string }) => {
    setSelectedPersonalityTemplate(template.name);
    if (template.name === 'Custom') {
      setFormData(prev => ({ ...prev, personality: '' }));
    } else {
      setFormData(prev => ({ ...prev, personality: template.template }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentStep !== 3) {
      return;
    }
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.personality.trim()) {
      setError('Please complete all required fields before creating the bot');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Bot created successfully!');
        
        if (result.data && result.data.id) {
          setTimeout(() => {
            router.push(`/dashboard/bots/${result.data.id}`);
          }, 1000);
        } else {
          setError('Bot created but redirect failed - no ID returned');
        }
      } else {
        const errorMessage = result.error || 'Failed to create bot';
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBotClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentStep !== 3) {
      return;
    }
    
    handleSubmit(e as React.FormEvent<HTMLFormElement>);
  };

  const nextStep = () => {
    if (currentStep < 3 && isStepValid()) {
      const nextStepNumber = Math.min(currentStep + 1, 3);
      setCurrentStep(nextStepNumber);
      sessionStorage.setItem('botCreationStep', nextStepNumber.toString());
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      const prevStepNumber = Math.max(currentStep - 1, 1);
      setCurrentStep(prevStepNumber);
      sessionStorage.setItem('botCreationStep', prevStepNumber.toString());
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 2:
        return formData.personality.trim() !== '';
      case 3:
        return formData.name.trim() !== '' && formData.description.trim() !== '' && formData.personality.trim() !== '';
      default:
        return false;
    }
  };

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1: return 'Basic Information';
      case 2: return 'Personality & Behavior';
      case 3: return 'Advanced Settings';
      default: return '';
    }
  };

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/bots"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 text-gray-700" />
          </Link>
          <div>
            <h1 className={typography.pageTitleLarge}>Create New AI Bot</h1>
            <p className={typography.pageSubtitle}>Configure your AI chatbot with the settings below</p>
          </div>
        </div>

      {/* Step Indicator */}
      <div className="rounded-2xl bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step < currentStep
                    ? 'bg-emerald-500 text-white'
                    : step === currentStep
                    ? 'bg-accent-soft text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                <span className="text-sm text-gray-500 mt-2 text-center leading-5">{getStepLabel(step)}</span>
              </div>
              {step < 3 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                  step < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className={`${typography.helperTextLarge} leading-5`}>
            Step {currentStep} of 3 · {getStepLabel(currentStep)}
          </p>
        </div>
      </div>

      <form 
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        className="space-y-6" 
        id="bot-creation-form"
        noValidate
      >
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="rounded-2xl bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur px-6 py-5 space-y-4 border border-white/70">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-accent-soft/10 text-accent-soft rounded-full p-2">
                <Bot className="w-5 h-5" />
              </div>
              <h2 className={typography.sectionTitleLarge}>Basic Information</h2>
            </div>
            
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="md:flex-1">
                <label className={`mb-1 block ${typography.labelLarge}`}>
                  Bot Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  placeholder="e.g., Customer Support Bot"
                  required
                />
              </div>
              
              <div className="md:w-1/3">
                <label className={`mb-1 block ${typography.labelLarge}`}>
                  Avatar Emoji
                </label>
                <EmojiPicker
                  value={formData.avatar}
                  onChange={(emoji) => handleInputChange('avatar', emoji)}
                  placeholder="🤖"
                />
              </div>
            </div>

            <div>
              <label className={`block ${typography.labelLarge} mb-2`}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                placeholder="Describe what this bot does and its purpose..."
                required
              />
            </div>

            {/* Step Info Banner */}
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full bg-accent-soft/10 px-4 py-2 ${typography.helperTextLarge} text-[#C0266B]`}>
              <Info className="h-4 w-4" />
              Step 1 of 3 · Complete this step to continue
            </div>
          </div>
        )}

        {/* Step 2: Personality & Behavior */}
        {currentStep === 2 && (
          <div className="rounded-2xl bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur px-6 py-5 space-y-4 border border-white/70">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-accent-soft/10 text-accent-soft rounded-full p-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className={typography.sectionTitleLarge}>Personality & Behavior</h2>
            </div>

            <div>
              <label className={`block ${typography.labelLarge} mb-3`}>
                Choose a Personality Template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {personalityTemplates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => handlePersonalityTemplateSelect(template)}
                    onKeyDown={handleKeyDown}
                    className={`p-4 border rounded-xl text-left transition-colors ${
                      selectedPersonalityTemplate === template.name
                        ? 'border-accent-soft bg-accent-soft/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white/70'
                    }`}
                  >
                    <div className={`font-medium ${typography.bodyLarge} text-gray-900`}>{template.name}</div>
                    <div className={`${typography.helperTextLarge} mt-1`}>{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block ${typography.labelLarge} mb-2`}>
                Customize Personality *
              </label>
              <textarea
                value={formData.personality}
                onChange={(e) => handleInputChange('personality', e.target.value)}
                onKeyDown={handleKeyDown}
                rows={6}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                placeholder="Define how your bot should behave, respond, and interact with users..."
                required
              />
              <p className={`${typography.helperTextLarge} mt-1`}>
                Be specific about tone, style, and behavior patterns you want your bot to follow.
              </p>
            </div>

            {/* Step Info Banner */}
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full bg-accent-soft/10 px-4 py-2 ${typography.helperTextLarge} text-[#C0266B]`}>
              <Info className="h-4 w-4" />
              Step 2 of 3 · Complete this step to continue
            </div>
          </div>
        )}

        {/* Step 3: Advanced Settings */}
        {currentStep === 3 && (
          <div className="rounded-2xl bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur px-6 py-5 space-y-4 border border-white/70">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-accent-soft/10 text-accent-soft rounded-full p-2">
                <Settings className="w-5 h-5" />
              </div>
              <h2 className={typography.sectionTitleLarge}>Advanced Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${typography.labelLarge} mb-2`}>
                  AI Model
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-base text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                >
                  {aiModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.price} cost
                    </option>
                  ))}
                </select>
                <p className={`${typography.helperTextLarge} mt-1`}>
                  {aiModels.find(m => m.id === formData.model)?.description}
                </p>
              </div>

              <div>
                <label className={`block ${typography.labelLarge} mb-2`}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-base text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${typography.labelLarge} mb-2`}>
                  Temperature: {formData.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                />
                <div className={`flex justify-between ${typography.helperTextLarge} mt-1`}>
                  <span>Focused (0.0)</span>
                  <span>Balanced (1.0)</span>
                  <span>Creative (2.0)</span>
                </div>
              </div>

              <div>
                <label className={`block ${typography.labelLarge} mb-2`}>
                  Max Tokens: {formData.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={formData.maxTokens}
                  onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                />
                <div className={`flex justify-between ${typography.helperTextLarge} mt-1`}>
                  <span>Short (100)</span>
                  <span>Medium (2000)</span>
                  <span>Long (4000)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submission Warning */}
        {currentStep < 3 && (
          <div className={`rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 ${typography.helperTextLarge} text-amber-800 flex gap-2`}>
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Complete all steps before creating the bot. You are currently on step {currentStep} of 3.</span>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${typography.bodyLarge}`}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className={`bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg ${typography.bodyLarge}`}>
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* Debug Info - Collapsible */}
        <div className="border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className={`w-full flex items-center justify-between px-4 py-2 ${typography.helperTextLarge} text-gray-500 hover:bg-gray-50 transition-colors`}
          >
            <span>Debug Info</span>
            {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showDebug && (
            <div className={`px-4 py-3 bg-gray-50 border-t border-gray-200 ${typography.helperTextLarge} text-gray-600`}>
              <div className="space-y-1">
                <div><strong>Current Step:</strong> {currentStep}</div>
                <div><strong>Session Storage:</strong> {typeof window !== 'undefined' ? sessionStorage.getItem('botCreationStep') || 'cleared' : 'N/A'}</div>
                <div><strong>Form Data:</strong> {JSON.stringify({
                  name: formData.name ? '✓' : '✗',
                  description: formData.description ? '✓' : '✗',
                  personality: formData.personality ? '✓' : '✗'
                })}</div>
                <div><strong>Step Valid:</strong> {isStepValid() ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              onKeyDown={handleKeyDown}
              className="bg-white text-gray-600 border border-gray-200 rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              onKeyDown={handleKeyDown}
              className="rounded-full bg-accent-soft px-5 py-2 text-base font-medium text-white shadow hover:bg-accent-soft/80 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next (Step {currentStep + 1})
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateBotClick}
              disabled={isLoading || !isStepValid()}
              onKeyDown={handleKeyDown}
              className="rounded-full bg-accent-soft px-5 py-2 text-base font-medium text-white shadow hover:bg-accent-soft/80 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Creating...' : 'Create Bot'}</span>
            </button>
          )}
        </div>
      </form>
      </div>
    </AppPage>
  );
}
