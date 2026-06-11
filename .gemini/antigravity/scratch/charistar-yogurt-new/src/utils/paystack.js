/**
 * Paystack Inline payment helper.
 * The Paystack script (https://js.paystack.co/v1/inline.js) is loaded
 * directly in index.html so window.PaystackPop is always available
 * synchronously when the user clicks the button — this preserves the
 * browser's "user gesture" context and prevents popup blockers.
 */

export function payWithPaystack({ email, amount, reference, onSuccess, onCancel }) {
  const publicKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY &&
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY.startsWith('pk_'))
    ? import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
    : null;

  if (!publicKey) {
    alert('Paystack public key is not configured. Please contact support.');
    onCancel();
    return;
  }

  if (!window.PaystackPop) {
    alert('Paystack payment script failed to load. Please check your internet connection and refresh the page.');
    onCancel();
    return;
  }

  console.log('Opening Paystack popup:', {
    keyPrefix: publicKey.substring(0, 8) + '...',
    email,
    amountInKobo: Math.round(amount * 100),
    reference
  });

  try {
    // Modern Paystack inline API (v1 inline.js uses PaystackPop.setup + openIframe)
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: email,
      amount: Math.round(amount * 100), // kobo
      currency: 'NGN',
      ref: reference,
      callback: function (response) {
        console.log('Paystack payment success:', response);
        onSuccess(response);
      },
      onClose: function () {
        console.log('Paystack popup closed by user.');
        onCancel();
      }
    });
    handler.openIframe();
  } catch (err) {
    console.error('Paystack popup failed:', err);
    alert('Could not open the payment window. Please disable any popup blockers and try again.');
    onCancel();
  }
}
