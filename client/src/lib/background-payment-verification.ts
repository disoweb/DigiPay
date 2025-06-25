// Background payment verification that runs without user interaction
export async function verifyPaymentInBackground(reference: string): Promise<void> {
  if (!reference) return;
  
  const token = localStorage.getItem('digipay_token');
  if (!token) return;
  
  try {
    console.log('Background verification for reference:', reference);
    
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reference })
    });
    
    const data = await response.json();
    console.log('Background verification result:', data);
    
    if (data.success && data.data.status === 'success') {
      console.log('Payment verified successfully in background');
      // Let WebSocket updates handle the UI refresh
    } else {
      console.log('Background verification failed:', data.message);
    }
  } catch (error) {
    console.error('Background verification error:', error);
  }
}

// Auto-verify pending payments when wallet page loads
export function checkPendingPayments(): void {
  const pendingPayment = sessionStorage.getItem('payment_processing');
  if (pendingPayment) {
    try {
      const paymentData = JSON.parse(pendingPayment);
      const timeSincePayment = Date.now() - paymentData.timestamp;
      
      // Only verify if payment was initiated recently (within last 10 minutes)
      if (timeSincePayment < 10 * 60 * 1000) {
        console.log('Found pending payment, verifying in background');
        verifyPaymentInBackground(paymentData.reference);
      }
      
      // Clean up pending payment data
      sessionStorage.removeItem('payment_processing');
    } catch (error) {
      console.error('Error checking pending payments:', error);
      sessionStorage.removeItem('payment_processing');
    }
  }
}