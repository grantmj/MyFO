"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { addMonths } from "date-fns";
import { ChatMessage } from "@/components/ui/ChatMessage";
import { ChatInput } from "@/components/ui/ChatInput";
import { TypingIndicator } from "@/components/ui/TypingIndicator";

interface Message {
  text: string;
  isBot: boolean;
  showTyping?: boolean;
}

type QuestionStep = 
  | 'welcome'
  | 'disbursement'
  | 'loans'
  | 'confirmation'
  | 'hasJob'
  | 'jobIncome'
  | 'currentSavings'
  | 'hasParentalSupport'
  | 'parentalSupport'
  | 'weeklyBudget'
  | 'summary'
  | 'done';

// Store collected data outside component to persist across renders
interface CollectedData {
  disbursement: number;
  loans: number;
  hasJob: boolean | null;
  jobIncome: number;
  currentSavings: number;
  hasParentalSupport: boolean | null;
  parentalSupport: number;
  weeklyBudget: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<QuestionStep>('welcome');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Use ref to store collected data - refs update synchronously unlike state
  const dataRef = useRef<CollectedData>({
    disbursement: 0,
    loans: 0,
    hasJob: null,
    jobIncome: 0,
    currentSavings: 0,
    hasParentalSupport: null,
    parentalSupport: 0,
    weeklyBudget: 0,
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId && messages.length === 0) {
      // Start the conversation
      addBotMessage("Hi! I'm MyFO, your financial assistant. Let's set up your semester budget together! 👋", true);
      setTimeout(() => {
        askNextQuestion('welcome');
      }, 1500);
    }
  }, [userId]);

  // Auto-scroll within chat messages container only
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);


  async function fetchUser() {
    try {
      const res = await fetch('/api/user');
      const { user } = await res.json();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  function addBotMessage(text: string, typing: boolean = false) {
    setMessages(prev => [...prev, { text, isBot: true, showTyping: typing }]);
  }

  function addUserMessage(text: string) {
    setMessages(prev => [...prev, { text, isBot: false }]);
  }

  function askNextQuestion(step: QuestionStep) {
    setIsTyping(true);
    
    // Read from ref for immediate access to updated values
    const data = dataRef.current;
    
    setTimeout(() => {
      setIsTyping(false);
      
      switch(step) {
        case 'welcome':
          addBotMessage("What's the total disbursement you received this semester (after tuition was paid)?", true);
          setCurrentStep('disbursement');
          break;
        case 'disbursement':
          addBotMessage("How much of that disbursement is from student loans?", true);
          setCurrentStep('loans');
          break;
        case 'loans':
          const grants = data.disbursement - data.loans;
          addBotMessage(`Great! So you have $${grants.toFixed(2)} in grants/scholarships and $${data.loans.toFixed(2)} in loans. 💰`, true);
          setCurrentStep('confirmation');
          setTimeout(() => askNextQuestion('confirmation'), 2000);
          break;
        case 'confirmation':
          addBotMessage("Do you have a job or work-study position? (yes/no)", true);
          setCurrentStep('hasJob');
          break;
        case 'hasJob':
          if (data.hasJob) {
            addBotMessage("How much do you earn per week from your job?", true);
            setCurrentStep('jobIncome');
          } else {
            addBotMessage("Got it! 👍", true);
            setTimeout(() => askNextQuestion('currentSavings'), 1000);
          }
          break;
        case 'jobIncome':
          addBotMessage(`Perfect! $${data.jobIncome.toFixed(2)}/week is solid income. 💪`, true);
          setCurrentStep('currentSavings');
          setTimeout(() => askNextQuestion('currentSavings'), 1500);
          break;
        case 'currentSavings':
          addBotMessage("How much do you currently have saved up?", true);
          setCurrentStep('currentSavings');
          break;
        case 'hasParentalSupport':
          if (data.hasParentalSupport) {
            addBotMessage("How much do your parents contribute per week?", true);
            setCurrentStep('parentalSupport');
          } else {
            addBotMessage("No worries! 👍", true);
            setTimeout(() => askNextQuestion('weeklyBudget'), 1000);
          }
          break;
        case 'parentalSupport':
          addBotMessage(`Nice! $${data.parentalSupport.toFixed(2)}/week from family helps a lot. 👨‍👩‍👧‍👦`, true);
          setCurrentStep('weeklyBudget');
          setTimeout(() => askNextQuestion('weeklyBudget'), 1500);
          break;
        case 'weeklyBudget':
          addBotMessage("Finally, what's your estimated weekly spending budget?", true);
          setCurrentStep('weeklyBudget');
          break;
        case 'summary':
          addBotMessage(`Perfect! I've got everything I need. Let me set up your budget plan... 🚀`, true);
          setTimeout(() => handleSubmit(), 2000);
          break;
      }
    }, 800);
  }

  function handleUserInput(value: string) {
    // Handle yes/no questions
    if (currentStep === 'hasJob' || currentStep === 'hasParentalSupport') {
      const response = value.toLowerCase().trim();
      if (!['yes', 'no', 'y', 'n'].includes(response)) {
        showToast('Please answer "yes" or "no"', 'error');
        return;
      }
      
      const answer = response === 'yes' || response === 'y';
      addUserMessage(answer ? 'Yes' : 'No');
      
      if (currentStep === 'hasJob') {
        // Update ref immediately (synchronous)
        dataRef.current.hasJob = answer;
        askNextQuestion('hasJob');
      } else if (currentStep === 'hasParentalSupport') {
        dataRef.current.hasParentalSupport = answer;
        askNextQuestion('hasParentalSupport');
      }
      return;
    }
    
    // Handle numeric questions
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    addUserMessage(`$${numValue.toFixed(2)}`);

    switch(currentStep) {
      case 'disbursement':
        // Update ref immediately (synchronous) - value is available right away
        dataRef.current.disbursement = numValue;
        askNextQuestion('disbursement');
        break;
      case 'loans':
        dataRef.current.loans = numValue;
        askNextQuestion('loans');
        break;
      case 'jobIncome':
        dataRef.current.jobIncome = numValue;
        askNextQuestion('jobIncome');
        break;
      case 'currentSavings':
        dataRef.current.currentSavings = numValue;
        // After savings, ask about parental support
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage("Do your parents support you financially? (yes/no)", true);
            setCurrentStep('hasParentalSupport');
          }, 800);
        }, 1000);
        break;
      case 'parentalSupport':
        dataRef.current.parentalSupport = numValue;
        askNextQuestion('parentalSupport');
        break;
      case 'weeklyBudget':
        dataRef.current.weeklyBudget = numValue;
        setCurrentStep('summary');
        askNextQuestion('summary');
        break;
    }
  }

  async function handleSubmit() {
    if (!userId) {
      showToast('Please log in first', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Read all values from ref - guaranteed to have the latest values
      const data = dataRef.current;
      
      const startDate = new Date();
      const endDate = addMonths(startDate, 4);
      const disbursementDate = new Date();
      const grantsAmount = Math.max(0, data.disbursement - data.loans);

      // Calculate monthly income from all sources
      const weeklyJobIncome = data.hasJob ? data.jobIncome : 0;
      const weeklyParentalSupport = data.hasParentalSupport ? data.parentalSupport : 0;
      const totalMonthlyIncome = (weeklyJobIncome + weeklyParentalSupport) * 4.33; // avg weeks per month

      console.log('Submitting plan data:', {
        disbursement: data.disbursement,
        loans: data.loans,
        grants: grantsAmount,
        savings: data.currentSavings,
      });

      const planData = {
        startDate,
        endDate,
        disbursementDate,
        startingBalance: data.currentSavings + data.disbursement, // Include current savings
        grants: grantsAmount,
        loans: data.loans,
        monthlyIncome: totalMonthlyIncome,
        fixedCosts: { rent: 0, utilities: 0, subscriptions: 0, transportation: 0 },
        variableBudgets: {
          groceries: data.weeklyBudget * 0.4,
          dining: data.weeklyBudget * 0.25,
          entertainment: data.weeklyBudget * 0.2,
          misc: data.weeklyBudget * 0.15,
        },
        plannedItems: [],
      };

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data: planData }),
      });

      if (res.ok) {
        addBotMessage("All set! Welcome to MyFO! 🎉", true);
        setTimeout(() => {
          showToast('Plan created!', 'success');
          router.push('/dashboard');
        }, 1500);
      } else {
        showToast('Failed to create plan', 'error');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      showToast('Failed to create plan', 'error');
    } finally {
      setLoading(false);
    }
  }

  const canInput = ['disbursement', 'loans', 'hasJob', 'jobIncome', 'currentSavings', 'hasParentalSupport', 'parentalSupport', 'weeklyBudget'].includes(currentStep);
  const isYesNoQuestion = ['hasJob', 'hasParentalSupport'].includes(currentStep);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '2rem 1rem',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
      }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '0.5rem',
          margin: 0,
        }}>
          Welcome to MyFO
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem', marginTop: '0.5rem' }}>
          Let's set up your semester budget together
        </p>
      </div>

      {/* Main Chat Container */}
      <div style={{
        flex: 1,
        maxWidth: '56rem',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // Important for flex children to respect overflow
      }}>
        {/* Chat Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f3f4f6',
          display: 'flex',
          flexDirection: 'column',
          height: '600px',
          maxHeight: '70vh',
        }}>
          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg.text}
                isBot={msg.isBot}
                showTyping={msg.showTyping}
              />
            ))}
            
            {isTyping && <TypingIndicator />}
          </div>

          {/* Input Area - Always visible */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
          }}>
            <ChatInput
              onSubmit={handleUserInput}
              disabled={!canInput || isTyping || loading}
              type={isYesNoQuestion ? 'text' : 'number'}
              placeholder={
                currentStep === 'disbursement' ? 'e.g., 5000' :
                currentStep === 'loans' ? 'e.g., 2000' :
                currentStep === 'hasJob' ? 'yes or no' :
                currentStep === 'jobIncome' ? 'e.g., 150' :
                currentStep === 'currentSavings' ? 'e.g., 1000' :
                currentStep === 'hasParentalSupport' ? 'yes or no' :
                currentStep === 'parentalSupport' ? 'e.g., 100' :
                currentStep === 'weeklyBudget' ? 'e.g., 200' :
                'Processing...'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
