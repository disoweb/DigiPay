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

    // Script is already loaded in HTML, just wait a bit for it to be available
    let attempts = 0;
    const checkPaystack = () => {
      if (window.PaystackPop) {
        resolve();
      } else if (attempts < 10) {
        attempts++;
        setTimeout(checkPaystack, 100);
      } else {
        reject(new Error('Paystack script not available'));
      }
    };
    checkPaystack();
  });
};

export const initializePaystack = async (config: PaystackConfig) => {
  await loadPaystackScript();
  const handler = window.PaystackPop.setup(config);
  handler.openIframe();
};