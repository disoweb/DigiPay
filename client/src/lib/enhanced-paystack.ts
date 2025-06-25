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

export const detectEnvironment = () => {
  const isProduction = window.location.hostname.includes('.replit.app') || process.env.NODE_ENV === 'production';
  const isDevelopment = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') || window.location.port === '5000';
  
  return {
    isProduction,
    isDevelopment,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent,
    supports: {
      fetch: typeof fetch !== 'undefined',
      modules: 'noModule' in HTMLScriptElement.prototype,
      cors: typeof XMLHttpRequest !== 'undefined'
    }
  };
};

export const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Paystack is already available
    if (window.PaystackPop) {
      console.log("Paystack already loaded");
      resolve();
      return;
    }

    const env = detectEnvironment();
    console.log("=== PAYSTACK SCRIPT LOADING DEBUG ===");
    console.log("Environment detection:", env);
    console.log("Starting Paystack script loading process...");
    
    // Log current document state
    console.log("Document state:");
    console.log("  - readyState:", document.readyState);
    console.log("  - URL:", document.URL);
    console.log("  - domain:", document.domain);
    console.log("  - referrer:", document.referrer);
    
    // Check existing scripts
    const existingPaystackScripts = Array.from(document.querySelectorAll('script[src*="paystack"]'));
    console.log("Existing Paystack scripts before loading:", existingPaystackScripts.length);
    existingPaystackScripts.forEach((script, i) => {
      console.log(`  Script ${i + 1}:`, script.src, script.readyState || 'unknown state');
    });
    
    // Remove any existing Paystack scripts first
    const existingScripts = document.querySelectorAll('script[src*="paystack"]');
    existingScripts.forEach(script => script.remove());

    // Multiple loading strategies for production robustness
    const loadStrategies = [
      'https://js.paystack.co/v1/inline.js',
      'https://js.paystack.co/v2/inline.js',
      'https://checkout.paystack.com/assets/js/inline.js'
    ];

    let strategyIndex = 0;
    let resolved = false;

    const tryLoadStrategy = () => {
      if (resolved || strategyIndex >= loadStrategies.length) {
        if (!resolved) {
          console.error("All Paystack loading strategies failed");
          resolved = true;
          reject(new Error('Payment system unavailable. Please check your internet connection and try again.'));
        }
        return;
      }

      const scriptUrl = loadStrategies[strategyIndex];
      console.log(`\n--- STRATEGY ${strategyIndex + 1} ATTEMPT ---`);
      console.log(`URL: ${scriptUrl}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = false;
      script.crossOrigin = 'anonymous';
      
      // Add comprehensive event logging
      script.addEventListener('loadstart', () => console.log(`Strategy ${strategyIndex + 1}: Script loading started`));
      script.addEventListener('progress', (e) => console.log(`Strategy ${strategyIndex + 1}: Loading progress`, e));
      script.addEventListener('loadend', () => console.log(`Strategy ${strategyIndex + 1}: Script loading ended`));
      
      console.log(`Strategy ${strategyIndex + 1}: Script element created with properties:`, {
        src: script.src,
        async: script.async,
        defer: script.defer,
        crossOrigin: script.crossOrigin,
        type: script.type
      });
      
      script.onload = () => {
        console.log(`\n✓ SCRIPT LOADED: Strategy ${strategyIndex + 1} from ${scriptUrl}`);
        console.log(`Load timestamp: ${new Date().toISOString()}`);
        console.log("Post-load document state:", document.readyState);
        
        // Comprehensive window object analysis
        console.log("Window object analysis:");
        console.log("  - window.PaystackPop:", typeof window.PaystackPop, window.PaystackPop);
        console.log("  - window.Paystack:", typeof (window as any).Paystack, (window as any).Paystack);
        console.log("  - window.paystack:", typeof (window as any).paystack, (window as any).paystack);
        
        // Check all possible Paystack-related properties
        const paystackProps = Object.keys(window).filter(key => 
          key.toLowerCase().includes('paystack')
        );
        console.log("  - All Paystack-related window properties:", paystackProps);
        
        console.log("Script element analysis:");
        console.log("  - Script readyState:", script.readyState);
        console.log("  - Script in DOM:", document.contains(script));
        console.log("  - All scripts count:", document.querySelectorAll('script').length);
        
        // Wait for PaystackPop to be available
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkAvailability = () => {
          if (resolved) return;
          
          attempts++;
          console.log(`\n--- AVAILABILITY CHECK ${attempts}/${maxAttempts} ---`);
          console.log(`Timestamp: ${new Date().toISOString()}`);
          console.log("Checking for PaystackPop...");
          
          // Check multiple possible objects
          const checks = {
            'window.PaystackPop': window.PaystackPop,
            'window.Paystack': (window as any).Paystack,
            'window.paystack': (window as any).paystack,
            'window.PayStack': (window as any).PayStack,
            'window.PAYSTACK': (window as any).PAYSTACK
          };
          
          Object.entries(checks).forEach(([name, obj]) => {
            console.log(`  ${name}:`, typeof obj, obj);
            if (obj && typeof obj === 'object') {
              console.log(`    ${name} properties:`, Object.keys(obj));
            }
          });
          
          if (window.PaystackPop) {
            console.log("✓ PaystackPop found and ready!");
            resolved = true;
            resolve();
          } else if ((window as any).Paystack && (window as any).Paystack.pop) {
            console.log("✓ Found alternative Paystack.pop structure");
            (window as any).PaystackPop = (window as any).Paystack;
            resolved = true;
            resolve();
          } else if ((window as any).paystack && typeof (window as any).paystack.setup === 'function') {
            console.log("✓ Found lowercase paystack with setup method");
            (window as any).PaystackPop = (window as any).paystack;
            resolved = true;
            resolve();
          } else if (attempts < maxAttempts) {
            console.log(`✗ PaystackPop not ready yet, attempt ${attempts}/${maxAttempts}`);
            setTimeout(checkAvailability, 200);
          } else {
            console.error(`✗ Strategy ${strategyIndex + 1} FAILED: PaystackPop not available after ${maxAttempts} attempts`);
            console.error("Final window state:", {
              PaystackPop: typeof window.PaystackPop,
              Paystack: typeof (window as any).Paystack,
              paystack: typeof (window as any).paystack,
              allPaystackProps: Object.keys(window).filter(k => k.toLowerCase().includes('paystack'))
            });
            strategyIndex++;
            tryLoadStrategy();
          }
        };
        
        // Start checking immediately and also wait a bit for slower networks
        checkAvailability();
        setTimeout(checkAvailability, 500);
        setTimeout(checkAvailability, 1000);
      };
      
      script.onerror = (error) => {
        console.error(`\n✗ SCRIPT ERROR: Strategy ${strategyIndex + 1} failed`);
        console.error(`URL: ${scriptUrl}`);
        console.error(`Error timestamp: ${new Date().toISOString()}`);
        console.error(`Error details:`, error);
        console.error(`Error event:`, {
          type: error.type,
          target: error.target,
          message: error.message || 'No message',
          filename: (error as any).filename || 'No filename',
          lineno: (error as any).lineno || 'No line number'
        });
        
        // Check if this is a network error or CSP error
        if (error.type === 'error') {
          console.error("This appears to be a network or CSP blocking error");
          
          // Try to determine the cause
          fetch(scriptUrl, { method: 'HEAD', mode: 'no-cors' })
            .then(() => console.error("Network connectivity OK - likely CSP blocking"))
            .catch(e => console.error("Network connectivity issue:", e));
        }
        
        strategyIndex++;
        console.log(`Moving to strategy ${strategyIndex + 1}...`);
        tryLoadStrategy();
      };
      
      document.head.appendChild(script);
    };

    // Start with first strategy
    tryLoadStrategy();
    
    // Global timeout fallback
    setTimeout(() => {
      if (!resolved) {
        console.error("Paystack loading timeout - all strategies failed");
        console.error("Environment at timeout:", detectEnvironment());
        console.error("CSP might be blocking scripts. Checking manual initialization...");
        
        // Last resort: try manual paystack initialization
        try {
          if (typeof (window as any).paystack !== 'undefined') {
            (window as any).PaystackPop = (window as any).paystack;
            console.log("Found manual paystack object");
            resolved = true;
            resolve();
            return;
          }
        } catch (e) {
          console.error("Manual paystack check failed:", e);
        }
        
        resolved = true;
        reject(new Error('Payment system unavailable. Please check your internet connection and try again.'));
      }
    }, 25000);
  });
};

export const initializeEnhancedPaystack = async (config: PaystackConfig) => {
  console.log("Initializing Paystack payment...");
  console.log("Config:", { ...config, key: config.key.substring(0, 8) + '...' });
  console.log("Environment:", detectEnvironment());
  
  try {
    // Ensure Paystack is loaded
    console.log("Loading Paystack script...");
    await loadPaystackScript();
    console.log("Paystack script loaded successfully");

    if (!window.PaystackPop) {
      console.error("PaystackPop not available after script load");
      console.log("Attempting fallback payment system...");
      
      // Import and use fallback system
      const { createPaystackFallback } = await import('./paystack-fallback');
      window.PaystackPop = createPaystackFallback();
      console.log("Fallback PaystackPop created");
    }

    console.log("PaystackPop available, setting up payment...");
    
    // Setup and open payment with enhanced styling
    const handler = window.PaystackPop.setup({
      key: config.key,
      email: config.email,
      amount: config.amount,
      currency: config.currency || 'NGN',
      reference: config.reference,
      channels: config.channels || ['card', 'bank', 'ussd', 'mobile_money'],
      metadata: config.metadata || {},
      callback: (response: any) => {
        console.log("Paystack callback triggered:", response);
        config.callback(response);
      },
      onClose: () => {
        console.log("Paystack onClose triggered");
        config.onClose();
      }
    });
    
    console.log("Paystack handler created, opening payment...");
    
    if (!handler || typeof handler.openIframe !== 'function') {
      console.error("Invalid handler returned from Paystack setup");
      throw new Error("Payment initialization failed. Please try again.");
    }
    
    // Open iframe and ensure it's clickable
    handler.openIframe();
    console.log("Payment iframe opened successfully");
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