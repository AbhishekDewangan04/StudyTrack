import { useState, useEffect } from 'react';
import { Crown, Check, X, Copy, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
        <div className="fixed inset-0 bg-[#090B12]/80 backdrop-blur-md transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-md bg-[#191B2B] border border-[#FFBF69]/40 text-white rounded-3xl shadow-2xl z-10 overflow-hidden p-8 space-y-6 text-center">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#111522] transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-3xl bg-[#FFBF69]/20 border border-[#FFBF69]/40 flex items-center justify-center text-[#FFBF69] mx-auto shadow-lg">
            <Crown className="w-10 h-10 fill-[#FFBF69]/30" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight font-display">You're a PRO Member! 🎉</h2>
            <p className="text-xs text-[#FFBF69] font-bold uppercase tracking-widest pt-1">PRO Plan Active</p>
            <p className="text-xs text-slate-300 font-medium pt-2">All premium features, unlimited tasks, calendar sync & AI study assistant are fully unlocked on your account.</p>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-[#FFBF69] hover:bg-[#ffe3b3] text-[#090B12] font-black text-xs rounded-2xl transition cursor-pointer shadow-md uppercase tracking-wider">
            Back to Platform
          </button>
        </div>
      </div>
    );
  }

  const handleUpgradeNow = async () => {
    setLoading(true);
    setError(null);
    try {
      const sdkLoaded = await loadRazorpaySDK();
      if (!sdkLoaded) {
        throw new Error('Failed to load Razorpay Checkout SDK. Please check your internet connection.');
      }

      const config = await paymentAPI.getConfig();
      const plan = billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly';
      const order = await paymentAPI.createOrder({ plan });

      if (!order || !order.orderId) {
        throw new Error(order?.message || 'Failed to create Razorpay order');
      }

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
          color: '#9B6BFF',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#090B12]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* PRO Modal Card Surface */}
      <div className="relative w-full max-w-lg bg-[#191B2B] border border-[#9B6BFF]/30 text-white rounded-3xl shadow-2xl z-10 overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#111522] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFBF69]/20 border border-[#FFBF69]/40 flex items-center justify-center text-[#FFBF69] shrink-0 shadow-lg">
            <Crown className="w-7 h-7 fill-[#FFBF69]/30" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
              Upgrade to PRO
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Unlock AI Assistant, unlimited tasks & Google sync.
            </p>
          </div>
        </div>

        {/* Razorpay Test Mode Indicator */}
        {isTestMode && (
          <div className="bg-[#FFBF69]/10 border border-[#FFBF69]/30 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#FFBF69] font-bold">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#FFBF69] animate-pulse" />
                <span>Test Mode Active (Razorpay Sandbox)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTestDetails((prev) => !prev)}
                className="text-[#FFBF69] hover:underline text-[11px] font-extrabold flex items-center space-x-1 cursor-pointer"
              >
                <span>Test Card Info</span>
                {showTestDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTestDetails && (
              <div className="pt-2 border-t border-[#FFBF69]/20 text-[11px] text-slate-300 space-y-1">
                <p>Card Number: <strong className="font-mono text-white select-all">4718 6091 0820 4366</strong></p>
                <p>CVV: <strong className="font-mono text-white select-all">123</strong> | OTP: <strong className="font-mono text-white select-all">123456</strong></p>
              </div>
            )}
          </div>
        )}

        {/* Monthly / Yearly Billing Toggle */}
        <div className="flex justify-center pt-1">
          <div className="bg-[#111522] p-1.5 rounded-2xl inline-flex items-center space-x-1 border border-[#191B2B] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#9B6BFF] text-white font-bold shadow-md'
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
                  ? 'bg-[#9B6BFF] text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-[#FFBF69]/20 text-[#FFBF69] px-2 py-0.5 rounded-full border border-[#FFBF69]/30 font-extrabold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Prominent Price Card */}
        <div className="p-4 rounded-2xl bg-[#111522] border border-[#191B2B] space-y-1 text-center">
          <p className="text-xs font-bold text-[#FFBF69] uppercase tracking-widest">
            PRO Plan
          </p>
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-4xl font-black text-white tracking-tight font-display">
              {billingCycle === 'yearly' ? '₹499' : '₹49'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              /{billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-2 text-xs font-semibold text-slate-300">
          {[
            'AI Study Assistant with Gemini integration',
            'Unlimited assignments & recurring tasks',
            'Google Calendar synchronization',
            'Productivity analytics & trend charts',
            'Priority deadline notifications',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center space-x-2.5">
              <div className="w-4 h-4 rounded-full bg-[#9B6BFF]/20 border border-[#9B6BFF]/40 text-[#C4A7FF] flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span className="text-slate-200">{feature}</span>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/30 font-bold">
            {error}
          </p>
        )}

        {/* Upgrade Button */}
        <button
          onClick={handleUpgradeNow}
          disabled={loading}
          className="w-full py-3.5 gradient-btn-purple text-white font-extrabold text-xs rounded-2xl shadow-xl transition cursor-pointer disabled:opacity-50 uppercase tracking-wider"
        >
          {loading ? 'Opening Checkout...' : 'Upgrade Now'}
        </button>
      </div>
    </div>
  );
};

export default ProModal;
