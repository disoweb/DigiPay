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
      console.log("Paystack already loaded");
      resolve();
      return;
    }

    console.log("Loading Paystack script...");
    
    // Remove any existing Paystack scripts first
    const existingScripts = document.querySelectorAll('script[src*="paystack"]');
    existingScripts.forEach(script => script.remove());

    // Load script directly - don't rely on HTML preloading
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.defer = false;
    
    let resolved = false;
    
    script.onload = () => {
      console.log("Paystack script loaded, checking availability...");
      
      // Wait for PaystackPop to be available
      let attempts = 0;
      const checkAvailability = () => {
        if (resolved) return;
        
        if (window.PaystackPop) {
          console.log("Paystack is ready");
          resolved = true;
          resolve();
        } else if (attempts < 50) {
          attempts++;
          setTimeout(checkAvailability, 100);
        } else {
          console.error("Paystack script loaded but PaystackPop not available");
          resolved = true;
          reject(new Error('Payment system initialization failed'));
        }
      };
      
      checkAvailability();
    };
    
    script.onerror = (error) => {
      console.error("Failed to load Paystack script:", error);
      if (!resolved) {
        resolved = true;
        reject(new Error('Payment system loading failed'));
      }
    };
    
    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        console.error("Paystack loading timeout");
        resolved = true;
        reject(new Error('Payment system loading timeout. Please check your internet connection and try again.'));
      }
    }, 15000);
    
    document.head.appendChild(script);
  });
};

export const initializeEnhancedPaystack = async (config: PaystackConfig) => {
  console.log("Initializing Paystack payment...");
  
  try {
    // Ensure Paystack is loaded
    await loadPaystackScript();
    console.log("Paystack script loaded successfully");

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
    
    console.log("Paystack handler created, opening payment...");
    
    // Open iframe and ensure it's clickable
    handler.openIframe();
    console.log("Payment iframe opened");
  } catch (error) {
    console.error("Paystack initialization error:", error);
    throw error;
  }
  
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