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
    const token = localStorage.getItem('digipay_token');
    console.log("=== CLIENT PAYMENT DEBUG ===");
    console.log("Auth token available:", !!token);
    console.log("Token length:", token?.length || 0);
    console.log("Token first 20 chars:", token ? token.substring(0, 20) + "..." : 'none');
    if (!token) {
      console.error("❌ No authentication token found! User needs to log in.");
      throw new Error("Authentication required");
    }
    console.log("Payment data:", {
      amount: config.amount / 100,
      email: config.email,
      reference: config.reference
    });
    console.log("About to make request to:", '/api/payments/initialize');
    console.log("============================");
    
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

    // Step 2: Open payment in popup window with message listener setup
    console.log("Opening Paystack checkout window...");
    
    // Listen for messages from the payment callback page
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      console.log("Message received from payment window:", event.data);
      
      if (event.data.type === 'PAYMENT_COMPLETED') {
        console.log("Payment completion message received, processing...");
        clearInterval(checkPayment);
        window.removeEventListener('message', messageListener);
        
        // CRITICAL: Prevent any possible iframe refresh or blank page by immediate replacement

        const container = document.getElementById('paystack-iframe-container');
        if (container) {
          // Get the iframe wrapper that has the modal dimensions
          const iframeWrapper = container.querySelector('[data-payment-iframe-wrapper]');
          if (iframeWrapper) {
            // IMMEDIATELY hide iframe and show loading - prevent any blank frame
            const iframe = iframeWrapper.querySelector('iframe');
            if (iframe) {
              iframe.style.display = 'none';
            }
            
            const callbackLoadingDiv = document.createElement('div');
            callbackLoadingDiv.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              z-index: 1000;
              display: flex;
              align-items: center;
              gap: 12px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
          callbackLoadingDiv.innerHTML = `
            <div style="width: 20px; height: 20px; border: 2px solid #e0e7ff; border-top: 2px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="color: #374151;">Processing payment...</span>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          `;
          
            // Add loading indicator to iframe wrapper immediately
            iframeWrapper.appendChild(callbackLoadingDiv);
          }
        }
        
        // Start verification immediately - no delays at all
        verifyAndCompletePayment({ ...config, reference: event.data.reference }).then(() => {
          // Close immediately after verification completes
          const finalContainer = document.getElementById('paystack-iframe-container');
          if (finalContainer) {
            document.body.removeChild(finalContainer);
          }
        });
      }
    };
    
    window.addEventListener('message', messageListener);
    console.log("Message listener added for payment completion");
    
    // Create inline iframe container instead of popup
    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'paystack-iframe-container';
    iframeContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    const iframeWrapper = document.createElement('div');
    iframeWrapper.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 500px;
      height: 80%;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255,255,255,0.9);
      border: none;
      font-size: 24px;
      cursor: pointer;
      border-radius: 50%;
      width: 35px;
      height: 35px;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    const iframe = document.createElement('iframe');
    iframe.src = data.data.authorization_url;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    `;
    
    // Add loading indicator while iframe loads
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    loadingDiv.innerHTML = `
      <div style="width: 20px; height: 20px; border: 2px solid #e0e7ff; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span style="color: #374151;">Loading secure payment...</span>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    // Remove loading indicator when iframe loads
    iframe.onload = () => {
      setTimeout(() => {
        if (loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
        }
      }, 1000);
    };
    
    closeButton.onclick = () => {
      document.body.removeChild(iframeContainer);
      config.onClose();
    };
    
    // Add data attribute for easy selection
    iframeWrapper.setAttribute('data-payment-iframe-wrapper', 'true');
    
    iframeWrapper.appendChild(iframe);
    iframeWrapper.appendChild(closeButton);
    iframeWrapper.appendChild(loadingDiv);
    iframeContainer.appendChild(iframeWrapper);
    document.body.appendChild(iframeContainer);

    console.log("Inline payment iframe created successfully");

    // Step 3: Monitor payment completion
    console.log("Step 3: Monitoring payment completion...");
    
    // Check for payment completion every 3 seconds
    const checkPayment = setInterval(async () => {
      try {
        // Check if iframe container still exists
        const container = document.getElementById('paystack-iframe-container');
        if (!container) {
          console.log("Payment iframe closed, verifying payment...");
          clearInterval(checkPayment);
          window.removeEventListener('message', messageListener);
          
          // Wait a moment for any redirects to complete, then verify
          setTimeout(async () => {
            console.log("Verifying payment after iframe closed...");
            await verifyAndCompletePayment({ ...config, reference: data.data.reference });
          }, 2000);
          
          return;
        }

        // DISABLED: Periodic verification to prevent duplicate processing
        // Payment verification is handled only via message system and manual verification
        
      } catch (error) {
        console.log("Payment check error (continuing monitoring):", error);
      }
    }, 3000);

    // Timeout after 10 minutes
    setTimeout(() => {
      const container = document.getElementById('paystack-iframe-container');
      if (container) {
        clearInterval(checkPayment);
        console.log("Payment timeout - closing iframe");
        document.body.removeChild(container);
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
    const token = localStorage.getItem('digipay_token');
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
    
    const token = localStorage.getItem('digipay_token');
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reference: config.reference })
    });

    const data = await response.json();
    console.log("Payment verification response:", data);

    if (data.success && (data.data?.status === 'success' || data.data?.status === 'duplicate_detected')) {
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
    config.onClose?.();
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
    const token = localStorage.getItem('digipay_token');
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
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