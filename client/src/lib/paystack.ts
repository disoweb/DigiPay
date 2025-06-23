// Paystack integration utilities
export const PAYSTACK_PUBLIC_KEY = "pk_test_7c30d4c30302ab01124b5593a498326ff37000f1";

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callback: (response: any) => void;
  onClose: () => void;
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

    // Create and load the script dynamically if not already loaded
    const existingScript = document.querySelector('script[src*="paystack"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => {
        // Wait a bit for the script to initialize
        setTimeout(() => {
          if (window.PaystackPop) {
            resolve();
          } else {
            reject(new Error('Paystack script loaded but PaystackPop not available'));
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(script);
    } else {
      // Script exists, wait for it to be available
      let attempts = 0;
      const checkPaystack = () => {
        if (window.PaystackPop) {
          resolve();
        } else if (attempts < 20) {
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

export const initializePaystack = async (config: PaystackConfig) => {
  console.log("Loading Paystack script for seamless payment...");
  await loadPaystackScript();
  
  console.log("Paystack script loaded, setting up inline payment...");
  
  if (!window.PaystackPop) {
    throw new Error("PaystackPop is not available after script load");
  }
  
  // Enhanced config for seamless experience
  const enhancedConfig = {
    ...config,
    container: 'paystack-container', // Try to use container if available
    onLoad: (response: any) => {
      console.log("Paystack loaded:", response);
    },
    onCancel: () => {
      console.log("Payment cancelled by user");
      config.onClose();
    },
    onError: (error: any) => {
      console.error("Paystack error:", error);
      config.onClose();
    }
  };
  
  const handler = window.PaystackPop.setup(enhancedConfig);
  console.log("Payment handler created for seamless experience");
  
  if (!handler || !handler.openIframe) {
    throw new Error("Payment handler setup failed");
  }
  
  handler.openIframe();
  console.log("Seamless payment iframe opened");
};