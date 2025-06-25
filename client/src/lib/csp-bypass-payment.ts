// CSP-Bypass Payment System - Direct redirect approach
// This system completely bypasses CSP by not loading any external scripts

interface PaymentConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callback: (response: any) => void;
  onClose: () => void;
}

export const initializeCSPBypassPayment = async (config: PaymentConfig) => {
  console.log("CSP-Bypass Payment: Starting secure payment flow");
  
  try {
    // Step 1: Initialize payment via our API
    console.log("Initializing payment...");
    const token = localStorage.getItem('token');
    console.log("Auth token available:", !!token, token ? `(length: ${token.length})` : 'none');
    
    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: config.amount / 100, // Convert from kobo to naira
        email: config.email,
        reference: config.reference
      })
    });

    const data = await response.json();
    console.log("Payment API response status:", response.status);
    console.log("Payment API response data:", data);
    
    if (!response.ok) {
      throw new Error(`Payment API Error: ${response.status} - ${data.message || data.error || 'Unknown error'}`);
    }

    if (!data.success || !data.data?.authorization_url) {
      throw new Error("Invalid payment initialization response");
    }

    // Step 2: Open payment in popup window (better for monitoring)
    console.log("Opening Paystack checkout window...");
    const paymentWindow = window.open(
      data.data.authorization_url,
      'paystack_checkout',
      'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=yes'
    );

    console.log("Popup window created:", !!paymentWindow);

    if (!paymentWindow) {
      // Fallback: Direct redirect in same window
      console.log("New tab blocked, redirecting in same window...");
      const userConfirmed = confirm(
        "Payment window was blocked. Click OK to continue to payment page (you'll return here after payment)."
      );
      
      if (userConfirmed) {
        // Store return URL and payment reference
        localStorage.setItem('payment_reference', config.reference);
        localStorage.setItem('payment_return_url', window.location.href);
        
        // Redirect to payment
        window.location.href = data.data.authorization_url;
      } else {
        config.onClose();
      }
      return;
    }

    // Step 3: Monitor payment completion
    console.log("Step 3: Monitoring payment completion...");
    
    // Check for payment completion every 2 seconds
    const checkPayment = setInterval(async () => {
      try {
        // Check if window is closed
        if (paymentWindow.closed) {
          console.log("Payment window closed, verifying payment...");
          clearInterval(checkPayment);
          
          // Wait a moment for any redirects to complete
          setTimeout(async () => {
            await verifyAndCompletePayment(config);
          }, 2000);
          
          return;
        }

        // Also try to verify payment periodically (in case window doesn't close)
        await verifyPayment(config.reference);
        
      } catch (error) {
        console.log("Payment check error (continuing monitoring):", error);
      }
    }, 3000);

    // Timeout after 10 minutes
    setTimeout(() => {
      if (!paymentWindow.closed) {
        clearInterval(checkPayment);
        console.log("Payment timeout - closing window");
        paymentWindow.close();
        config.onClose();
      }
    }, 600000);

  } catch (error) {
    console.error("CSP-Bypass Payment Error:", error);
    throw error;
  }
};

const verifyPayment = async (reference: string) => {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reference })
    });

    const data = await response.json();
    return data.success && data.data?.status === 'success';
  } catch (error) {
    console.log("Verification check failed:", error);
    return false;
  }
};

const verifyAndCompletePayment = async (config: PaymentConfig) => {
  try {
    console.log("Verifying payment completion...");
    
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reference: config.reference })
    });

    const data = await response.json();
    console.log("Payment verification response:", data);

    if (data.success && data.data?.status === 'success') {
      console.log("✅ Payment verified successfully!");
      config.callback({
        status: 'success',
        reference: config.reference,
        transaction: config.reference
      });
    } else {
      console.log("❌ Payment verification failed or cancelled");
      config.onClose();
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    config.onClose();
  }
};

// Check for returning payment on page load
export const checkReturnPayment = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference') || localStorage.getItem('payment_reference');
  const returnUrl = localStorage.getItem('payment_return_url');
  
  if (reference && window.location.search.includes('reference')) {
    console.log("Payment return detected, verifying...");
    
    // Clean up stored data
    localStorage.removeItem('payment_reference');
    localStorage.removeItem('payment_return_url');
    
    // Verify payment and show result
    verifyReturnPayment(reference, returnUrl);
  }
};

const verifyReturnPayment = async (reference: string, returnUrl?: string) => {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reference })
    });

    const data = await response.json();
    
    if (data.success) {
      alert("Payment successful! Your deposit will be processed shortly.");
      
      // Redirect back to original page if available
      if (returnUrl && returnUrl !== window.location.href) {
        window.location.href = returnUrl;
      } else {
        // Refresh current page to update balance
        window.location.reload();
      }
    } else {
      alert("Payment verification failed. Please contact support if you believe this is an error.");
    }
  } catch (error) {
    console.error("Return payment verification error:", error);
    alert("Unable to verify payment. Please check your transaction history.");
  }
};