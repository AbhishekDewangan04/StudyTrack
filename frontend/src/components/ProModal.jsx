import { useState, useEffect } from 'react';
import { Crown, Check, X, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { paymentAPI } from '../services/api';
import { loadRazorpaySDK } from '../utils/loadRazorpay';
import { useAuth } from '../context/AuthContext';

const ProModal = ({ isOpen, onClose }) => {
  const { user, refreshUser, updateUserData } = useAuth();
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' or 'yearly'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyId, setKeyId] = useState(null);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (isOpen) {
      paymentAPI
        .getConfig()
        .then((cfg) => {
          if (cfg?.keyId) {
            setKeyId(cfg.keyId);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const isTestMode = !keyId || keyId.startsWith('rzp_test_');

  if (!isOpen) return null;

  if (user?.isPro) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-md bg-[#0F172A] border border-amber-500/30 text-white rounded-3xl shadow-modal z-10 overflow-hidden p-8 space-y-6 text-center">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
            <Crown className="w-10 h-10 fill-amber-400/30" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">You're a PRO Member! 🎉</h2>
            <p className="text-xs text-amber-300 font-bold uppercase tracking-widest pt-1">PRO Plan Active</p>
            <p className="text-xs text-slate-400 font-medium pt-2">All premium features, unlimited tasks, calendar sync & analytics are fully unlocked on your account.</p>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-2xl transition cursor-pointer shadow-md">
            Back to Application
          </button>
        </div>
      </div>
    );
  }

  const handleUpgradeNow = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Ensure Razorpay Checkout SDK is dynamically loaded
      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded) {
        throw new Error('Failed to load Razorpay Checkout SDK. Please check your internet connection.');
      }

      // 2. Retrieve config
      const config = await paymentAPI.getConfig();

      // 3. Create order using backend API
      const plan = billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly';
      const order = await paymentAPI.createOrder({ plan });

      if (!order || !order.orderId) {
        throw new Error(order?.message || 'Failed to create Razorpay order');
      }

      // 4. Launch Razorpay Checkout directly (No debug popup!)
      const options = {
        key: order.keyId || config.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'StudyTrack PRO',
        description: `StudyTrack PRO (${plan === 'pro_yearly' ? 'Yearly' : 'Monthly'})`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Refetch current user profile so isPro status updates immediately across the app!
            if (refreshUser) {
              await refreshUser();
            } else if (updateUserData) {
              updateUserData({ isPro: true });
            }

            alert('🎉 Upgrade Successful! You are now a StudyTrack PRO member.');
            onClose();
          } catch (err) {
            console.error('Payment verification failed:', err);
            setError('Payment verification failed: ' + err.message);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        theme: {
          color: '#4F46E5',
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay Checkout SDK is unavailable.');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err.message || 'Failed to initiate PRO upgrade.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* PRO Modal Card Surface */}
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-slate-800 text-white rounded-3xl shadow-modal z-10 overflow-hidden p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <Crown className="w-7 h-7 fill-amber-400/20" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Upgrade to PRO
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Unlock your full productivity potential.
            </p>
          </div>
        </div>

        {/* Razorpay Test Mode UX Indicator */}
        {isTestMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Test Mode — No real money will be charged.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTestDetails((prev) => !prev)}
                className="text-amber-400 hover:text-amber-200 text-xs font-bold flex items-center space-x-1 cursor-pointer transition"
              >
                <span>Test Card Details</span>
                {showTestDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTestDetails && (
              <div className="pt-2.5 border-t border-amber-500/20 space-y-2 text-xs text-slate-300">
                <p className="text-[11px] text-amber-200/80 font-medium">
                  Use the following official Razorpay test credentials during checkout:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Card Number</span>
                      <span className="font-mono text-white font-bold select-all">4718 6091 0820 4366</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('4718609108204366');
                        setCopiedField('card');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Copy Card Number"
                    >
                      {copiedField === 'card' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">CVV</span>
                      <span className="font-mono text-white font-bold select-all">123</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('123');
                        setCopiedField('cvv');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Copy CVV"
                    >
                      {copiedField === 'cvv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Expiry</span>
                      <span className="font-mono text-white font-bold">Any future date</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">OTP</span>
                      <span className="font-mono text-white font-bold select-all">12345678</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('12345678');
                        setCopiedField('otp');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Copy OTP"
                    >
                      {copiedField === 'otp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Monthly / Yearly Billing Toggle */}
        <div className="flex justify-center pt-1">
          <div className="bg-slate-900/90 p-1.5 rounded-2xl inline-flex items-center space-x-1 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#4F46E5] text-white shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-[#4F46E5] text-white shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Prominent Price Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1 text-center">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            PRO Plan
          </p>
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-4xl font-black text-white tracking-tight">
              {billingCycle === 'yearly' ? '₹499' : '₹49'}
            </span>
            <span className="text-sm text-slate-400 font-medium">
              /{billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
            <span className="text-sm text-slate-500 line-through">
              {billingCycle === 'yearly' ? '₹999' : '₹99'}
            </span>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 text-sm font-medium text-slate-300">
          {[
            'Unlimited tasks & recurring schedules',
            'Google Calendar two-way synchronization',
            'Study locations & interactive Google Maps',
            'Advanced productivity analytics & streaks',
            'Priority deadline & overdue email reminders',
            'Early access to new features',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">{feature}</span>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/50 p-3 rounded-xl border border-rose-800/60 font-semibold">
            {error}
          </p>
        )}

        {/* Upgrade Button */}
        <button
          onClick={handleUpgradeNow}
          disabled={loading}
          className="w-full py-3.5 bg-[#4F46E5] hover:bg-indigo-600 active:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Opening Checkout...' : 'Upgrade Now'}
        </button>
      </div>
    </div>
  );
};

export default ProModal;
