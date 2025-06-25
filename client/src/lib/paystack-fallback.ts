// Fallback payment system for when Paystack scripts fail to load
export interface FallbackPaymentConfig {
  key: string;
  email: string;
  amount: number;
  reference: string;
  callback: (response: any) => void;
  onClose: () => void;
}

export const initializeFallbackPayment = async (config: FallbackPaymentConfig) => {
  console.log("Initializing fallback payment system...");
  
  try {
    // Try direct API call to initialize payment
    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        amount: config.amount / 100, // Convert back from kobo
        email: config.email,
        reference: config.reference
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initialize payment');
    }

    const data = await response.json();
    
    if (data.success && data.data?.authorization_url) {
      console.log("Opening payment in new window...");
      
      // Open payment in popup window
      const popup = window.open(
        data.data.authorization_url,
        'paystack_payment',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Please allow popups and try again');
      }

      // Monitor popup for completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          
          // Verify payment after popup closes
          setTimeout(async () => {
            try {
              const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ reference: config.reference })
              });

              const verifyData = await verifyResponse.json();
              
              if (verifyData.success) {
                config.callback({ status: 'success', reference: config.reference });
              } else {
                config.onClose();
              }
            } catch (error) {
              console.error('Payment verification failed:', error);
              config.onClose();
            }
          }, 1000);
        }
      }, 1000);

      // Auto-close popup after 10 minutes
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          config.onClose();
        }
      }, 600000);

    } else {
      throw new Error(data.message || 'Payment initialization failed');
    }

  } catch (error) {
    console.error('Fallback payment failed:', error);
    throw error;
  }
};

export const createPaystackFallback = () => {
  // Create a mock PaystackPop object that uses the fallback system
  return {
    setup: (config: any) => ({
      openIframe: () => {
        initializeFallbackPayment({
          key: config.key,
          email: config.email,
          amount: config.amount,
          reference: config.reference,
          callback: config.callback,
          onClose: config.onClose
        }).catch(error => {
          console.error('Fallback payment error:', error);
          config.onClose();
        });
      }
    })
  };
};