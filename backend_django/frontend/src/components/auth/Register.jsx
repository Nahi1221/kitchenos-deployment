import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  business_name: z.string().min(2, 'Business name is required'),
  business_location: z.string().min(5, 'Location is required'),
  plan: z.enum(['Free', 'Basic', 'Popular', 'Premium']),
});

const plans = [
  { id: 'Free', price: 'Free', features: ['1 Branch', '20 Items', 'Basic QR'] },
  { id: 'Basic', price: '500 ETB/mo', features: ['1 Branch', '50 Items', 'Custom QR'] },
  { id: 'Popular', price: '1,500 ETB/mo', features: ['3 Branches', 'Unlimited Items', 'Custom QR', 'Full Analytics'] },
  { id: 'Premium', price: '3,000 ETB/mo', features: ['Unlimited Branches', 'Unlimited Items', 'Custom QR', 'Full Analytics', 'Priority Support'] },
];

function Register() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { register: registerUser } = useAuth();
  const isDark = theme === 'dark';
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { plan: 'Free' },
  });

  const [paymentFile, setPaymentFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentPlan = watch('plan');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('full_name', data.full_name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('business_name', data.business_name);
    formData.append('business_location', data.business_location);
    formData.append('plan', data.plan);
    if (data.business_description) {
      formData.append('business_description', data.business_description);
    }
    if (paymentFile) {
      formData.append('payment_screenshot', paymentFile);
    }

    const result = await registerUser(formData);
    
    if (result.success) {
      navigate('/login');
    }
    setIsSubmitting(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white text-xl font-bold">K</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
            Get Started with KitchenOS
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errors && Object.keys(errors).length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                Please fill in all required fields
              </div>
            )}

            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name *
                  </label>
                  <input
                    {...register('full_name')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="John Doe"
                  />
                  {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="you@restaurant.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone *
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="+251 9XX XXX XXX"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Business Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Business Name *
                  </label>
                  <input
                    {...register('business_name')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="My Restaurant"
                  />
                  {errors.business_name && <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Business Location *
                  </label>
                  <input
                    {...register('business_location')}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Bole, Addis Ababa"
                  />
                  {errors.business_location && <p className="mt-1 text-sm text-red-600">{errors.business_location.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Business Description (Optional)
                  </label>
                  <textarea
                    {...register('business_description')}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tell us about your restaurant..."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Your Plan
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setValue('plan', plan.id)}
                    className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
                      currentPlan === plan.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{plan.id}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.price}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {plan.features.slice(0, 2).map((f, i) => (
                        <div key={i}>✓ {f}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {errors.plan && <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>}
            </div>

            {currentPlan !== 'Free' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">Please upload payment screenshot</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-blue-300"
                />
                {paymentFile && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {paymentFile.name} uploaded</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;