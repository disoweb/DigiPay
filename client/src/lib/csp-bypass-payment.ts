// Simplified CSP-Bypass Payment System
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
  try {
    // Initialize payment
    const token = localStorage.getItem('digipay_token');
    if (!token) throw new Error("Authentication required");

    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: config.amount / 100,
        email: config.email,
        reference: config.reference
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success || !data.data?.authorization_url) {
      throw new Error(data.message || "Payment initialization failed");
    }

    // Create payment container
    const container = document.createElement('div');
    container.id = 'paystack-payment-container';
    container.style.cssText = `
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

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 450px;
      height: 80vh;
      max-height: 600px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
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
    closeBtn.onclick = () => {
      document.body.removeChild(container);
      config.onClose();
    };

    // Payment iframe
    const iframe = document.createElement('iframe');
    iframe.src = data.data.authorization_url;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    `;

    // Loading indicator
    const loading = document.createElement('div');
    loading.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
    `;
    loading.innerHTML = `
      <div style="width: 20px; height: 20px; border: 2px solid #e0e7ff; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span style="color: #374151;">Loading payment...</span>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    // Remove loading when iframe loads
    iframe.onload = () => {
      setTimeout(() => {
        if (loading.parentNode) {
          loading.parentNode.removeChild(loading);
        }
      }, 800);
    };

    wrapper.appendChild(iframe);
    wrapper.appendChild(closeBtn);
    wrapper.appendChild(loading);
    container.appendChild(wrapper);
    document.body.appendChild(container);

    // Listen for payment completion
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'PAYMENT_COMPLETED') {
        clearInterval(checkPayment);
        window.removeEventListener('message', messageListener);

        // Show verification loading
        iframe.style.display = 'none';
        loading.innerHTML = `
          <div style="width: 20px; height: 20px; border: 2px solid #e0e7ff; border-top: 2px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span style="color: #374151;">Verifying payment...</span>
        `;
        loading.style.display = 'flex';

        // Verify and complete
        verifyPayment(config, event.data.reference).then(() => {
          document.body.removeChild(container);
        });
      }
    };

    window.addEventListener('message', messageListener);

    // Check for window close every 3 seconds
    const checkPayment = setInterval(async () => {
      const currentContainer = document.getElementById('paystack-payment-container');
      if (!currentContainer) {
        clearInterval(checkPayment);
        window.removeEventListener('message', messageListener);

        // Verify payment after close
        setTimeout(() => {
          verifyPayment(config, data.data.reference);
        }, 1000);
      }
    }, 3000);

    // Timeout after 10 minutes
    setTimeout(() => {
      const currentContainer = document.getElementById('paystack-payment-container');
      if (currentContainer) {
        clearInterval(checkPayment);
        window.removeEventListener('message', messageListener);
        document.body.removeChild(currentContainer);
        config.onClose();
      }
    }, 600000);

  } catch (error) {
    console.error("Payment Error:", error);
    throw error;
  }
};

const verifyPayment = async (config: PaymentConfig, reference: string) => {
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

    if (data.success && data.data?.status === 'success') {
      config.callback({
        status: 'success',
        reference: reference,
        transaction: reference
      });
    } else {
      config.onClose();
    }
  } catch (error) {
    console.error("Verification error:", error);
    config.onClose();
  }
};