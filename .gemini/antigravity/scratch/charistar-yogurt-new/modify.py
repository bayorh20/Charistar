import re

with open(r'C:\Users\Quickprint\.gemini\antigravity\scratch\charistar-yogurt-new\src\pages\Checkout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { loadPaystackScript, payWithPaystack } from '../utils/paystack';",
    "import MockPaystack from '../components/MockPaystack';"
)

# 2. State
content = content.replace(
    "const [createdOrderId, setCreatedOrderId] = useState('');",
    "const [createdOrderId, setCreatedOrderId] = useState('');\n  const [showMockPayment, setShowMockPayment] = useState(false);"
)

# 3. Handle place order
paystack_old = '''// Paystack Card payment flow
        const payReference = 'charistar_' + Math.floor((Math.random() * 1000000000) + 1);
        
        await payWithPaystack({
          email: userEmail || 'guest@charistaryogurt.com',
          amount: finalTotal,
          reference: payReference,
          onSuccess: async (response) => {
            try {
              // Store order on successful checkout callback
              const orderData = {
                userId: userId || 'guest',
                userEmail: userEmail || 'guest@charistaryogurt.com',
                customerDetails,
                latitude: delLatitude,
                longitude: delLongitude,
                nearestPoi: delPlaceName,
                deliveryNote: delNotes,
                paymentMethod: 'card',
                paymentStatus: 'paid',
                paymentRef: response.reference || response.trxref || payReference,
                items: cartItems,
                subtotal: cartTotal,
                discount,
                appliedPromo,
                deliveryFee,
                total: finalTotal,
                status: 'pending',
                createdAt: serverTimestamp()
              };
              const orderRef = await addDoc(collection(db, 'orders'), orderData);
              
              setCreatedOrderId(orderRef.id);
              savePreviousAddress(delAddress);
              setSuccess(true);
              setIsProcessing(false);
              clearCart();
            } catch (err) {
              console.error("Failed to write paid order details:", err);
              alert("Payment was successful, but we failed to record your order. Please contact support.");
              setIsProcessing(false);
            }
          },
          onCancel: () => {
            alert("Payment cancelled.");
            setIsProcessing(false);
          }
        });'''

paystack_new = '''// Mock Paystack Card payment flow
        setShowMockPayment(true);'''

content = content.replace(paystack_old, paystack_new)

# 4. Handle Mock Success / Cancel
mock_handlers = '''
  const handleMockPaymentSuccess = async (response) => {
    setShowMockPayment(false);
    try {
      const customerDetails = {
        name: delName || currentUser?.name || currentUser?.displayName || 'Yogurt Lover',
        phone: delPhone || currentUser?.phone || '',
        address: delAddress,
        notes: delNotes,
        latitude: delLatitude,
        longitude: delLongitude,
        nearestPoi: delPlaceName
      };

      const orderData = {
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || 'guest@charistaryogurt.com',
        customerDetails,
        latitude: delLatitude,
        longitude: delLongitude,
        nearestPoi: delPlaceName,
        deliveryNote: delNotes,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        paymentRef: response.reference,
        items: cartItems,
        subtotal: cartTotal,
        discount,
        appliedPromo,
        deliveryFee,
        total: finalTotal,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      setCreatedOrderId(orderRef.id);
      savePreviousAddress(delAddress);
      setSuccess(true);
      setIsProcessing(false);
      clearCart();
    } catch (err) {
      console.error("Failed to write paid order details:", err);
      alert("Payment was successful, but we failed to record your order. Please contact support.");
      setIsProcessing(false);
    }
  };

  const handleMockPaymentCancel = () => {
    setShowMockPayment(false);
    alert("Payment cancelled.");
    setIsProcessing(false);
  };

  const renderStepHeader = (num, title, isCompleted, isActive) => {'''

content = content.replace('  const renderStepHeader = (num, title, isCompleted, isActive) => {', mock_handlers)

# 5. JSX rendering at the end
jsx_end_old = '''      </div>
    </motion.div>
  );
}'''

jsx_end_new = '''      </div>

      {showMockPayment && (
        <MockPaystack 
          amount={finalTotal} 
          email={currentUser?.email || 'guest@charistaryogurt.com'}
          onSuccess={handleMockPaymentSuccess} 
          onCancel={handleMockPaymentCancel} 
        />
      )}
    </motion.div>
  );
}'''

content = content.replace(jsx_end_old, jsx_end_new)

with open(r'C:\Users\Quickprint\.gemini\antigravity\scratch\charistar-yogurt-new\src\pages\Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced contents successfully.")
