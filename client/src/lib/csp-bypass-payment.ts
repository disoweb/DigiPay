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

    // Step 2: For production, redirect directly to Paystack
    if (window.location.hostname.includes('replit.app') || window.location.hostname.includes('replit.dev')) {
      console.log("Production deployment detected - using direct redirect to Paystack");
      
      // Store payment reference for verification after return
      localStorage.setItem('pending_payment_reference', data.data.reference);
      localStorage.setItem('pending_payment_amount', (config.amount / 100).toString());
      
      // Store payment details for success callback and preloading
      sessionStorage.setItem('payment_processing', JSON.stringify({
        reference: data.data.reference,
        amount: config.amount / 100,
        timestamp: Date.now(),
        needsPreload: true
      }));
      
      // Redirect directly to Paystack without modifying the URL
      console.log("Redirecting to Paystack:", data.data.authorization_url);
      
      // Use window.location.href for immediate redirect
      window.location.href = data.data.authorization_url;
      return;
    }

    // Step 2: Open payment in popup window with message listener setup (for development)
    console.log("Development environment - using iframe payment");

    // Listen for messages from the payment callback page
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      console.log("Message received from payment window:", event.data);

      if (event.data.type === 'PAYMENT_COMPLETED') {
        console.log("Payment completion message received - showing loading IMMEDIATELY");
        clearInterval(checkPayment);
        window.removeEventListener('message', messageListener);

        // CRITICAL: Show loading immediately to eliminate any blank state
        const container = document.getElementById('paystack-iframe-container');
        if (container) {
          const iframeWrapper = container.querySelector('[data-payment-iframe-wrapper]') as HTMLElement;
          if (iframeWrapper) {
            // Hide iframe INSTANTLY
            const iframe = iframeWrapper.querySelector('iframe');
            if (iframe) {
              iframe.style.cssText = `
                position: absolute;
                top: -9999px;
                left: -9999px;
                width: 1px;
                height: 1px;
                opacity: 0;
                pointer-events: none;
              `;
            }

            // Create full-screen loading overlay
            const callbackLoadingDiv = document.createElement('div');
            callbackLoadingDiv.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              z-index: 10002;
              border-radius: 12px;
            `;
            callbackLoadingDiv.innerHTML = `
              <div style="margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #22C55E; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              </div>
              <div style="font-size: 18px; font-weight: 600; color: #22C55E; margin-bottom: 10px;">Payment Successful!</div>
              <div style="font-size: 15px; color: #666; text-align: center; max-width: 280px;">Processing your deposit and updating your balance...</div>
              <style>
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              </style>
            `;

            // Insert immediately at the beginning to cover everything
            iframeWrapper.insertBefore(callbackLoadingDiv, iframeWrapper.firstChild);
          }
        }

        // Start verification immediately - no delays
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

    // Create a permanent overlay that shows loading during any potential transitions
    const transitionOverlay = document.createElement('div');
    transitionOverlay.id = 'payment-transition-overlay';
    transitionOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 10003;
      border-radius: 12px;
    `;
    transitionOverlay.innerHTML = `
      <div style="margin-bottom: 20px;">
        <div style="width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #22C55E; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <div style="font-size: 18px; font-weight: 600; color: #22C55E; margin-bottom: 10px;">Payment Successful!</div>
      <div style="font-size: 15px; color: #666; text-align: center; max-width: 280px;">Processing your deposit and updating your balance...</div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
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

    // This will be replaced by the enhanced onload handler below

    closeButton.onclick = () => {
      document.body.removeChild(iframeContainer);
      config.onClose();
    };

    // Add data attribute for easy selection
    iframeWrapper.setAttribute('data-payment-iframe-wrapper', 'true');

    iframeWrapper.appendChild(iframe);
    iframeWrapper.appendChild(closeButton);
    iframeWrapper.appendChild(loadingDiv);
    iframeWrapper.appendChild(transitionOverlay); // Add permanent overlay
    iframeContainer.appendChild(iframeWrapper);
    document.body.appendChild(iframeContainer);

    console.log("Inline payment iframe created successfully");

    // AGGRESSIVE blank state prevention - monitor iframe content changes
    let blankStateCheckInterval: NodeJS.Timeout;
    const startBlankStateMonitoring = () => {
      blankStateCheckInterval = setInterval(() => {
        try {
          // Check for Paystack success indicators in the iframe
          if (iframe.contentDocument) {
            const body = iframe.contentDocument.body;
            if (body) {
              const bodyText = body.textContent || '';
              const bodyHTML = body.innerHTML || '';
              
              // Check for success indicators or blank/white content
              if (bodyText.toLowerCase().includes('success') || 
                  bodyText.toLowerCase().includes('complete') ||
                  bodyText.toLowerCase().includes('approved') ||
                  bodyText.toLowerCase().includes('thank') ||
                  bodyHTML.trim().length < 50 ||  // Very little content = potential blank state
                  body.children.length < 2) {    // Very few elements = likely success page
                
                console.log("SUCCESS or BLANK STATE detected in iframe content - activating overlay IMMEDIATELY");
                clearInterval(blankStateCheckInterval);
                showCallbackLoading(iframeWrapper);
                
                // Trigger verification without delay
                verifyAndCompletePayment({ ...config, reference: data.data.reference });
                return;
              }
            }
          }
        } catch (e) {
          // Cross-origin restrictions are normal, continue monitoring
        }
      }, 200); // Check every 200ms for very responsive detection
    };

    // Start monitoring after iframe loads
    iframe.onload = () => {
      setTimeout(() => {
        if (loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
        }
        startBlankStateMonitoring();
      }, 1000);
    };

    // Step 3: Monitor payment completion
    console.log("Step 3: Monitoring payment completion...");

    // Enhanced payment monitoring with blank state detection
    const checkPayment = setInterval(async () => {
      try {
        // Check if iframe container still exists
        const container = document.getElementById('paystack-iframe-container');
        if (!container) {
          console.log("Payment iframe closed, verifying payment...");
          clearInterval(checkPayment);
          if (blankStateCheckInterval) {
            clearInterval(blankStateCheckInterval);
          }
          window.removeEventListener('message', messageListener);

          // Show loading immediately before verification
          const wrapper = document.querySelector('[data-payment-iframe-wrapper="true"]') as HTMLElement;
          if (wrapper) {
            showCallbackLoading(wrapper);
          }
          
          // Wait a moment for any redirects to complete, then verify
          setTimeout(async () => {
            console.log("Verifying payment after iframe closed...");
            await verifyAndCompletePayment({ ...config, reference: data.data.reference });
          }, 500);

          return;
        }

        // Check for potential success redirects that might cause blank states
        try {
          if (iframe.contentWindow && iframe.contentWindow.location) {
            const currentUrl = iframe.contentWindow.location.href;
            if (currentUrl.includes('success') || currentUrl.includes('callback') || 
                currentUrl.includes('complete') || currentUrl.includes('return')) {
              console.log("Success URL detected, showing loading immediately");
              showCallbackLoading(iframeWrapper);
              clearInterval(checkPayment);
              if (blankStateCheckInterval) {
                clearInterval(blankStateCheckInterval);
              }
              
              // Trigger verification
              setTimeout(async () => {
                await verifyAndCompletePayment({ ...config, reference: data.data.reference });
              }, 200);
            }
          }
        } catch (e) {
          // Cross-origin restrictions prevent URL access - this is normal
        }

      } catch (error) {
        console.log("Payment check error (continuing monitoring):", error);
      }
    }, 1000);

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
      
      // Close the iframe container
      const container = document.getElementById('paystack-iframe-container');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      
      // Trigger success callback
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

// Show callback loading using the permanent overlay system
const showCallbackLoading = (iframeWrapper: HTMLElement) => {
  console.log("Activating payment transition overlay - INSTANT display");
  
  // Use the permanent overlay that's already in the DOM
  const overlay = iframeWrapper.querySelector('#payment-transition-overlay') as HTMLElement;
  if (overlay) {
    overlay.style.display = 'flex';
    console.log("Transition overlay activated - no blank state possible");
  } else {
    // Fallback: create overlay if not found
    const fallbackOverlay = document.createElement('div');
    fallbackOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 10003;
      border-radius: 12px;
    `;
    fallbackOverlay.innerHTML = `
      <div style="margin-bottom: 20px;">
        <div style="width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #22C55E; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <div style="font-size: 18px; font-weight: 600; color: #22C55E; margin-bottom: 10px;">Payment Successful!</div>
      <div style="font-size: 15px; color: #666; text-align: center;">Processing your deposit...</div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    iframeWrapper.appendChild(fallbackOverlay);
    console.log("Fallback overlay created and displayed");
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