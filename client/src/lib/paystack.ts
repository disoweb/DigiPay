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
  container?: string;
  embed?: boolean;
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
  console.log("Loading Paystack script for embedded payment...");
  await loadPaystackScript();
  
  console.log("Paystack script loaded, setting up inline payment...");
  
  if (!window.PaystackPop) {
    throw new Error("PaystackPop is not available after script load");
  }
  
  // Create or get the container for embedded payment
  let container = document.getElementById('paystack-embedded-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'paystack-embedded-container';
    container.style.width = '100%';
    container.style.minHeight = '500px';
    container.style.border = 'none';
    container.style.borderRadius = '8px';
    container.style.overflow = 'hidden';
    
    // Find the modal content to append the container
    const modalContent = document.querySelector('[role="dialog"]');
    if (modalContent) {
      modalContent.appendChild(container);
    }
  }
  
  // Enhanced config for embedded experience
  const enhancedConfig = {
    ...config,
    container: 'paystack-embedded-container',
    embed: true, // Force embedded mode
    onLoad: (response: any) => {
      console.log("Paystack embedded payment loaded:", response);
    },
    onCancel: () => {
      console.log("Payment cancelled by user");
      // Clean up container
      const containerEl = document.getElementById('paystack-embedded-container');
      if (containerEl) {
        containerEl.remove();
      }
      config.onClose();
    },
    onError: (error: any) => {
      console.error("Paystack error:", error);
      // Clean up container
      const containerEl = document.getElementById('paystack-embedded-container');
      if (containerEl) {
        containerEl.remove();
      }
      config.onClose();
    }
  };
  
  const handler = window.PaystackPop.setup(enhancedConfig);
  console.log("Payment handler created for embedded experience");
  
  if (!handler) {
    throw new Error("Payment handler setup failed");
  }
  
  // Use embedded initialization instead of popup
  if (handler.embed) {
    handler.embed();
    console.log("Embedded payment initialized");
  } else {
    // Fallback to iframe if embed method doesn't exist
    handler.openIframe();
    console.log("Fallback to iframe payment");
  }
};