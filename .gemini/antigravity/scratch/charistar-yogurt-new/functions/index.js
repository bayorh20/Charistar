const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendMarketingPush = functions.firestore
  .document('campaigns/{campaignId}')
  .onCreate(async (snap, context) => {
    const campaign = snap.data();

    // Check if the campaign is active
    if (campaign.status !== 'active') {
      return null;
    }

    const payload = {
      notification: {
        title: campaign.title || 'Charistar Update',
        body: campaign.message || 'Check out our latest offers!',
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        campaignId: context.params.campaignId,
        url: campaign.url || '/'
      }
    };

    try {
      // 1. Fetch all user tokens from the 'users' collection
      const usersSnap = await admin.firestore().collection('users').get();
      const tokens = [];

      usersSnap.forEach((doc) => {
        const userData = doc.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      });

      if (tokens.length === 0) {
        console.log('No FCM tokens found. Aborting broadcast.');
        return null;
      }

      // 2. Send multicast message
      const response = await admin.messaging().sendMulticast({
        tokens: tokens,
        notification: payload.notification,
        data: payload.data,
      });

      console.log(`Successfully sent ${response.successCount} messages; Failed ${response.failureCount} messages.`);

      // 3. Mark the campaign as sent
      return snap.ref.update({
        status: 'sent',
        successCount: response.successCount,
        failureCount: response.failureCount,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Error sending marketing push:', error);
      return snap.ref.update({
        status: 'failed',
        error: error.message
      });
    }
  });

// Twilio Client Helper
const twilio = require('twilio');

async function sendSMS(to, body) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || (functions.config().twilio && functions.config().twilio.sid);
  const authToken = process.env.TWILIO_AUTH_TOKEN || (functions.config().twilio && functions.config().twilio.token);
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || (functions.config().twilio && functions.config().twilio.phone_number);

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio keys not configured. Skipping SMS notification. Message body:', body);
    return;
  }

  const client = twilio(accountSid, authToken);
  try {
    const message = await client.messages.create({
      body: body,
      from: fromNumber,
      to: to
    });
    console.log(`SMS sent successfully: ${message.sid}`);
  } catch (error) {
    console.error('Failed to send SMS via Twilio:', error);
  }
}

// 1. Server-Side Price & Discount Validation Trigger (onCreate)
exports.validateOrderPrice = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderId = context.params.orderId;
    const order = snap.data();
    
    const userId = order.userId;
    const items = order.items || [];
    const submittedSubtotal = Number(order.subtotal);
    const submittedDeliveryFee = Number(order.deliveryFee);
    const submittedDiscount = Number(order.discount);
    const submittedTotal = Number(order.total);
    
    // Default Lagos Kitchen coordinates [longitude, latitude] -> [3.3516, 6.6120]
    const KITCHEN_LNG = 3.3516;
    const KITCHEN_LAT = 6.6120;
    
    let calculatedSubtotal = 0;
    
    try {
      // Calculate items subtotal
      for (const item of items) {
        let itemPrice = 0;
        const itemId = item.id;
        const baseProductId = String(itemId).split('_')[0];
        
        if (baseProductId === 'parfait-classic') {
          itemPrice = 1800;
        } else if (baseProductId === 'parfait-mango') {
          itemPrice = 2000;
        } else if (baseProductId === 'parfait-berry') {
          itemPrice = 2200;
        } else {
          // Query Firestore for official product price
          let productDoc = await admin.firestore().collection('products').doc(baseProductId).get();
          
          // Fallback query if stored as numeric field ID
          if (!productDoc.exists) {
            const numericId = Number(baseProductId);
            if (!isNaN(numericId)) {
              const querySnap = await admin.firestore().collection('products').where('id', '==', numericId).get();
              if (!querySnap.empty) {
                productDoc = querySnap.docs[0];
              }
            }
          }
          
          if (productDoc.exists) {
            const productData = productDoc.data();
            const rawPrice = productData.price;
            itemPrice = typeof rawPrice === 'string'
              ? parseFloat(rawPrice.replace(/[^\d.]/g, ''))
              : parseFloat(rawPrice);
            if (isNaN(itemPrice)) {
              itemPrice = 0;
            }

            // Add the prices of any selected addons verified against Firestore
            if (item.selectedAddons && Array.isArray(item.selectedAddons)) {
              const officialAddons = productData.addons || [];
              for (const addon of item.selectedAddons) {
                const matchedOfficial = officialAddons.find(a => a.name === addon.name);
                if (matchedOfficial) {
                  let addonPrice = typeof matchedOfficial.price === 'string'
                    ? parseFloat(matchedOfficial.price.replace(/[^\d.]/g, ''))
                    : parseFloat(matchedOfficial.price || 0);
                  if (isNaN(addonPrice)) {
                    addonPrice = 0;
                  }
                  itemPrice += addonPrice;
                }
              }
            }
          } else {
            console.error(`Product ID ${baseProductId} not found in database. Using submitted price as fallback.`);
            const itemRawPrice = item.price;
            itemPrice = typeof itemRawPrice === 'string'
              ? parseFloat(itemRawPrice.replace(/[^\d.]/g, ''))
              : parseFloat(itemRawPrice);
            if (isNaN(itemPrice)) {
              itemPrice = 0;
            }
          }
        }
        
        calculatedSubtotal += itemPrice * (item.quantity || 1);
      }
      
      // Recalculate Geofenced Delivery Fee
      const customerLng = order.latitude !== undefined && order.longitude !== undefined 
        ? Number(order.longitude) 
        : (order.customerDetails && order.customerDetails.longitude !== undefined ? Number(order.customerDetails.longitude) : 3.4219);
      const customerLat = order.latitude !== undefined && order.longitude !== undefined 
        ? Number(order.latitude) 
        : (order.customerDetails && order.customerDetails.latitude !== undefined ? Number(order.customerDetails.latitude) : 6.4281);
      
      // Haversine distance in meters
      const R = 6371e3;
      const dLat = (customerLat - KITCHEN_LAT) * Math.PI / 180;
      const dLon = (customerLng - KITCHEN_LNG) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(KITCHEN_LAT * Math.PI / 180) * Math.cos(customerLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = (R * c) / 1000;
      
      let expectedDeliveryFee = 3500;
      if (distanceKm > 45) {
        expectedDeliveryFee = 0;
      } else if (distanceKm <= 5) {
        expectedDeliveryFee = 800;
      } else if (distanceKm <= 10) {
        expectedDeliveryFee = 1200;
      } else if (distanceKm <= 20) {
        expectedDeliveryFee = 1800;
      } else if (distanceKm <= 35) {
        expectedDeliveryFee = 2500;
      }
      
      // Recalculate Coupon Discount
      let calculatedDiscount = 0;
      const promoCode = (order.appliedPromo || '').trim().toUpperCase();
      if (promoCode === 'CHARISTAR' || promoCode === 'FREEFEED') {
        calculatedDiscount = 1500;
      } else if (promoCode === 'YOGURT20') {
        calculatedDiscount = Math.round(calculatedSubtotal * 0.20);
      }
      
      // Calculate Final Total
      const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount) + expectedDeliveryFee;
      
      // Compare totals (allow small rounding tolerance of 1 unit)
      const isSubtotalMatch = Math.abs(calculatedSubtotal - submittedSubtotal) <= 1;
      const isDeliveryFeeMatch = Math.abs(expectedDeliveryFee - submittedDeliveryFee) <= 1;
      const isDiscountMatch = Math.abs(calculatedDiscount - submittedDiscount) <= 1;
      const isTotalMatch = Math.abs(calculatedTotal - submittedTotal) <= 1;
      
      if (!isSubtotalMatch || !isDeliveryFeeMatch || !isDiscountMatch || !isTotalMatch) {
        console.warn(`Price validation failed for order ${orderId}. Mismatch details:`, {
          subtotal: { expected: calculatedSubtotal, submitted: submittedSubtotal },
          deliveryFee: { expected: expectedDeliveryFee, submitted: submittedDeliveryFee },
          discount: { expected: calculatedDiscount, submitted: submittedDiscount },
          total: { expected: calculatedTotal, submitted: submittedTotal }
        });
        
        // Cancel order (the client didn't debit anything, so no refund is needed!)
        await snap.ref.update({
          status: 'cancelled',
          priceValidated: false,
          rejectionReason: 'Server-side price verification failed',
          rejectionDetails: {
            expectedSubtotal: calculatedSubtotal,
            expectedDeliveryFee: expectedDeliveryFee,
            expectedDiscount: calculatedDiscount,
            expectedTotal: calculatedTotal
          }
        });
      } else {
        // Validation succeeded -> Check if paymentMethod is wallet
        if (order.paymentMethod === 'wallet') {
          if (!userId || userId === 'guest') {
            await snap.ref.update({
              status: 'cancelled',
              priceValidated: true,
              rejectionReason: 'Guest users cannot pay using wallet'
            });
            return;
          }
          
          const userRef = admin.firestore().collection('users').doc(userId);
          let debitSuccess = false;
          
          try {
            await admin.firestore().runTransaction(async (transaction) => {
              const userSnap = await transaction.get(userRef);
              if (!userSnap.exists) {
                throw new Error('User account not found');
              }
              
              const currentBalance = Number(userSnap.data().walletBalance || 0);
              if (currentBalance < calculatedTotal) {
                throw new Error('Insufficient wallet balance');
              }
              
              const newBalance = currentBalance - calculatedTotal;
              
              // Debit wallet balance
              transaction.update(userRef, { walletBalance: newBalance });
              
              // Write debit transaction log
              const newTxRef = admin.firestore().collection('users').doc(userId).collection('transactions').doc();
              transaction.set(newTxRef, {
                type: 'debit',
                amount: calculatedTotal,
                description: `Yogurt Order Purchase`,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
              debitSuccess = true;
            });
            
            if (debitSuccess) {
              await snap.ref.update({
                priceValidated: true,
                paymentStatus: 'paid'
              });
              console.log(`Wallet debited successfully for user ${userId}, amount: ₦${calculatedTotal}`);
            }
          } catch (txError) {
            console.error(`Wallet transaction failed for user ${userId}:`, txError.message);
            await snap.ref.update({
              status: 'cancelled',
              priceValidated: true,
              rejectionReason: txError.message || 'Wallet transaction failed'
            });
          }
        } else {
          // Standard card / other payment method (already paid via Paystack simulation)
          await snap.ref.update({
            priceValidated: true
          });
          console.log(`Price validation passed for order ${orderId}`);
        }
      }
      
    } catch (err) {
      console.error(`Error validating order price for order ${orderId}:`, err);
    }
  });

// 2. Twilio SMS Status Update Trigger (onUpdate)
exports.sendOrderStatusSMS = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const orderId = context.params.orderId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    // Status transitioned?
    const oldStatus = beforeData.status;
    const newStatus = afterData.status;
    
    if (oldStatus === newStatus) {
      return null;
    }
    
    const customerPhone = afterData.customerDetails?.phone;
    if (!customerPhone) {
      console.log(`No customer phone number found for order ${orderId}. Skipping SMS.`);
      return null;
    }
    
    let smsBody = '';
    const orderNum = orderId.substring(0, 8).toUpperCase();
    
    if (newStatus === 'dispatched') {
      smsBody = `Hi ${afterData.customerDetails.name || 'Valued Customer'}, your Charistar Yogurt order #${orderNum} has been dispatched! Our premium rider Chinedu is on his way with your chilled parfaits. 🛵🍦`;
    } else if (newStatus === 'delivered') {
      smsBody = `Delicious news! Your Charistar Yogurt order #${orderNum} has been delivered. Thank you for choosing us, enjoy your creamy parfait! 🌟🍨`;
    } else if (newStatus === 'cancelled') {
      if (afterData.rejectionReason === 'Server-side price verification failed') {
        smsBody = `Your Charistar Yogurt order #${orderNum} was cancelled due to a security verification mismatch. ${afterData.paymentMethod === 'wallet' ? 'Your wallet balance has been fully refunded.' : 'No charges were captured.'} Please contact support.`;
      } else {
        smsBody = `Your Charistar Yogurt order #${orderNum} has been cancelled. If any payment was made, a refund has been processed.`;
      }
    }
    
    if (smsBody) {
      await sendSMS(customerPhone, smsBody);
    }
    return null;
  });
