// Enhanced Paystack integration utilities for mobile-optimized payments
export const PAYSTACK_PUBLIC_KEY = "pk_test_7c30d4c30302ab01124b5593a498326ff37000f1";

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callback: (response: any) => void;
  onClose: () => void;
  channels?: string[];
  metadata?: Record<string, any>;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

export const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Paystack is already available
    if (window.PaystackPop) {
      resolve();
      return;
    }

    // Since script is in HTML, wait for it to load
    let attempts = 0;
    const checkPaystack = () => {
      if (window.PaystackPop) {
        resolve();
      } else if (attempts < 100) { // Increased attempts
        attempts++;
        setTimeout(checkPaystack, 50); // Faster checking
      } else {
        // Try loading script manually as fallback
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => {
          setTimeout(() => {
            if (window.PaystackPop) {
              resolve();
            } else {
              reject(new Error('Paystack script loaded but not accessible'));
            }
          }, 500);
        };
        script.onerror = () => reject(new Error('Failed to load Paystack script'));
        document.head.appendChild(script);
      }
    };
    checkPaystack();
  });
};

export const initializeEnhancedPaystack = async (config: PaystackConfig) => {
  console.log("Initializing Paystack payment...");
  
  // Ensure Paystack is loaded
  await loadPaystackScript();

  if (!window.PaystackPop) {
    throw new Error("Payment system unavailable. Please refresh the page.");
  }

  // Setup and open payment with enhanced styling
  const handler = window.PaystackPop.setup({
    key: config.key,
    email: config.email,
    amount: config.amount,
    currency: config.currency || 'NGN',
    reference: config.reference,
    channels: config.channels || ['card', 'bank', 'ussd', 'mobile_money'],
    metadata: config.metadata || {},
    callback: config.callback,
    onClose: config.onClose
  });
  
  // Open iframe and ensure it's clickable
  handler.openIframe();
  
  // Fix iframe styling after opening
  setTimeout(() => {
    const paystackIframes = document.querySelectorAll('iframe[src*="paystack"]');
    paystackIframes.forEach((iframe: any) => {
      iframe.style.zIndex = '999999';
      iframe.style.pointerEvents = 'auto';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
    });
    
    // Also check for overlay elements
    const overlays = document.querySelectorAll('[class*="paystack"]');
    overlays.forEach((overlay: any) => {
      overlay.style.zIndex = '999999';
      overlay.style.pointerEvents = 'auto';
    });
  }, 100);
};

export const detectMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getMobileOptimizedChannels = (): string[] => {
  const isMobile = detectMobileDevice();
  
  if (isMobile) {
    // Prioritize mobile-friendly payment methods
    return ['card', 'bank', 'ussd', 'mobile_money'];
  } else {
    // Desktop gets all available channels
    return ['card', 'bank', 'ussd', 'mobile_money', 'qr'];
  }
};

export const formatAmountForPaystack = (amount: number): number => {
  // Convert to kobo and ensure it's an integer
  return Math.round(amount * 100);
};

export const formatAmountFromPaystack = (amount: number): number => {
  // Convert from kobo to naira
  return amount / 100;
};

export const validatePaymentAmount = (amount: number): { valid: boolean; message?: string } => {
  if (!amount || isNaN(amount)) {
    return { valid: false, message: "Please enter a valid amount" };
  }
  
  if (amount < 100) {
    return { valid: false, message: "Minimum deposit amount is ₦100" };
  }
  
  if (amount > 1000000) {
    return { valid: false, message: "Maximum deposit amount is ₦1,000,000" };
  }
  
  return { valid: true };
};

export const generatePaymentReference = (userId: number): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `dp_${userId}_${timestamp}_${random}`;
};

export default {
  PAYSTACK_PUBLIC_KEY,
  loadPaystackScript,
  initializeEnhancedPaystack,
  detectMobileDevice,
  getMobileOptimizedChannels,
  formatAmountForPaystack,
  formatAmountFromPaystack,
  validatePaymentAmount,
  generatePaymentReference
};