
// Ultra-Streamlined CSP-Bypass Payment System
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

    // Create seamless payment overlay
    const overlay = document.createElement('div');
    overlay.id = 'paystack-payment-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.95);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 420px;
      height: 85vh;
      max-height: 650px;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 80px rgba(0,0,0,0.6);
      transform: scale(0.95);
      opacity: 0;
      transition: all 0.3s ease;
    `;

    // Animate in
    setTimeout(() => {
      container.style.transform = 'scale(1)';
      container.style.opacity = '1';
    }, 50);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255,255,255,0.95);
      border: none;
      font-size: 28px;
      font-weight: 300;
      cursor: pointer;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      z-index: 1000001;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,1)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.95)';
    closeBtn.onclick = () => {
      container.style.transform = 'scale(0.95)';
      container.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        config.onClose();
      }, 200);
    };

    // Payment iframe
    const iframe = document.createElement('iframe');
    iframe.src = data.data.authorization_url;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: white;
      border-radius: 16px;
    `;

    // Completion indicator (hidden initially)
    const completionOverlay = document.createElement('div');
    completionOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 1000;
      border-radius: 16px;
    `;
    completionOverlay.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
          <div style="font-size: 40px;">✓</div>
        </div>
        <h3 style="margin: 0 0 12px; font-size: 24px; font-weight: 600;">Payment Successful!</h3>
        <p style="margin: 0; font-size: 16px; opacity: 0.9;">Processing completion...</p>
      </div>
    `;

    container.appendChild(iframe);
    container.appendChild(closeBtn);
    container.appendChild(completionOverlay);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Listen for payment completion
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'PAYMENT_COMPLETED') {
        clearInterval(checkPayment);
        window.removeEventListener('message', messageListener);

        // Immediately show success state
        iframe.style.display = 'none';
        completionOverlay.style.display = 'flex';
        closeBtn.style.display = 'none';

        // Verify payment and complete
        verifyPayment(config, event.data.reference).then(() => {
          // Quick success animation then close
          setTimeout(() => {
            container.style.transform = 'scale(1.05)';
            container.style.opacity = '0';
            setTimeout(() => {
              if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
              }
            }, 300);
          }, 1200);
        });
      }
    };

    window.addEventListener('message', messageListener);

    // Check for completion every 1.5 seconds
    const checkPayment = setInterval(async () => {
      const currentOverlay = document.getElementById('paystack-payment-overlay');
      if (!currentOverlay) {
        clearInterval(checkPayment);
        window.removeEventListener('message', messageListener);
        verifyPayment(config, data.data.reference);
      }
    }, 1500);

    // Auto-timeout after 8 minutes
    setTimeout(() => {
      const currentOverlay = document.getElementById('paystack-payment-overlay');
      if (currentOverlay) {
        clearInterval(checkPayment);
        window.removeEventListener('message', messageListener);
        container.style.transform = 'scale(0.95)';
        container.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
          config.onClose();
        }, 200);
      }
    }, 480000);

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
