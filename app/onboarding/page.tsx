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
  | 'weeklyBudget'
  | 'summary'
  | 'done';

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<QuestionStep>('welcome');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // User data
  const [disbursement, setDisbursement] = useState(0);
  const [loans, setLoans] = useState(0);
  const [weeklyBudget, setWeeklyBudget] = useState(0);

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
          const grants = disbursement - loans;
          addBotMessage(`Great! So you have $${grants.toFixed(2)} in grants/scholarships and $${loans.toFixed(2)} in loans. 💰`, true);
          setCurrentStep('confirmation');
          setTimeout(() => askNextQuestion('confirmation'), 2000);
          break;
        case 'confirmation':
          addBotMessage("Now, what's your estimated weekly spending budget?", true);
          setCurrentStep('weeklyBudget');
          break;
        case 'weeklyBudget':
          addBotMessage(`Perfect! I've got everything I need. Let me set up your budget plan... 🚀`, true);
          setCurrentStep('summary');
          setTimeout(() => handleSubmit(), 2000);
          break;
      }
    }, 800);
  }

  function handleUserInput(value: string) {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    addUserMessage(`$${numValue.toFixed(2)}`);

    switch(currentStep) {
      case 'disbursement':
        setDisbursement(numValue);
        askNextQuestion('disbursement');
        break;
      case 'loans':
        setLoans(numValue);
        askNextQuestion('loans');
        break;
      case 'weeklyBudget':
        setWeeklyBudget(numValue);
        askNextQuestion('weeklyBudget');
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
      const startDate = new Date();
      const endDate = addMonths(startDate, 4);
      const disbursementDate = new Date();
      const grantsAmount = Math.max(0, disbursement - loans);

      const data = {
        startDate,
        endDate,
        disbursementDate,
        startingBalance: disbursement,
        grants: grantsAmount,
        loans: loans,
        monthlyIncome: 0,
        fixedCosts: { rent: 0, utilities: 0, subscriptions: 0, transportation: 0 },
        variableBudgets: {
          groceries: weeklyBudget * 0.4,
          dining: weeklyBudget * 0.25,
          entertainment: weeklyBudget * 0.2,
          misc: weeklyBudget * 0.15,
        },
        plannedItems: [],
      };

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
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

  const canInput = ['disbursement', 'loans', 'weeklyBudget'].includes(currentStep);

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
              type="number"
              placeholder={
                currentStep === 'disbursement' ? 'e.g., 5000' :
                currentStep === 'loans' ? 'e.g., 2000' :
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
