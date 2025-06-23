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
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="paystack"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => {
        setTimeout(() => {
          if (window.PaystackPop) {
            resolve();
          } else {
            reject(new Error('Paystack script loaded but PaystackPop not available'));
          }
        }, 200);
      };
      script.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(script);
    } else {
      let attempts = 0;
      const checkPaystack = () => {
        if (window.PaystackPop) {
          resolve();
        } else if (attempts < 30) {
          attempts++;
          setTimeout(checkPaystack, 100);
        } else {
          reject(new Error('Paystack script not available after waiting'));
        }
      };
      checkPaystack();
    }
  });
};

export const initializeEnhancedPaystack = async (config: PaystackConfig) => {
  console.log("Loading enhanced Paystack script for mobile payment...");
  await loadPaystackScript();

  console.log("Paystack script loaded, setting up enhanced payment...");

  if (!window.PaystackPop) {
    throw new Error("PaystackPop is not available after script load");
  }

  // Ensure callback is a function
  if (typeof config.callback !== 'function') {
    throw new Error("Callback must be a valid function");
  }

  // Enhanced config with mobile optimization and proper callback handling
  const enhancedConfig = {
    key: config.key,
    email: config.email,
    amount: config.amount,
    currency: config.currency,
    reference: config.reference,
    channels: config.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    metadata: config.metadata || {},
    callback: (response: any) => {
      console.log("Payment callback triggered:", response);
      try {
        config.callback(response);
      } catch (error) {
        console.error("Callback execution error:", error);
      }
    },
    onClose: () => {
      console.log("Payment modal closed");
      try {
        if (config.onClose) {
          config.onClose();
        }
      } catch (error) {
        console.error("OnClose execution error:", error);
      }
    }
  };

  const handler = window.PaystackPop.setup(enhancedConfig);
  console.log("Enhanced payment handler created");

  if (!handler || !handler.openIframe) {
    throw new Error("Enhanced payment handler setup failed");
  }

  handler.openIframe();
  console.log("Enhanced payment interface opened");
};

export const detectMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getMobileOptimizedChannels = (): string[] => {
  const isMobile = detectMobileDevice();
  
  if (isMobile) {
    // Prioritize mobile-friendly payment methods
    return ['card', 'bank_transfer', 'ussd', 'mobile_money', 'qr'];
  } else {
    // Desktop gets all available channels
    return ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'];
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