import React, { useState, useEffect } from 'react';
import { User, Settings, Calendar, Shield, CreditCard, LogOut, LogIn } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';

export default function ProfilePage() {
  const { theme, toggleTheme, isAutoMode, setAutoMode } = useTheme();
  const { user, loading, userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'subscription'>('overview');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Debug logging for ProfilePage state
  useEffect(() => {
    console.log('🏠 ProfilePage State Debug:', {
      loading,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasUserProfile: !!userProfile,
      userProfileData: userProfile ? {
        id: userProfile.id,
        email: userProfile.email,
        level: userProfile.level,
        points: userProfile.points,
        familiarization_completed: userProfile.familiarization_completed
      } : null
    });
  }, [loading, user, userProfile]);

  const handleSubscribe = () => {
    // Stripe integration would go here
    console.log('Initiating Stripe checkout...');
    alert('Stripe checkout would be initiated here');
  };

  const handleSignOut = async () => {
    try {
      console.log('🏠 ProfilePage: Initiating sign out...');
      await signOut();
    } catch (error) {
      console.error('🏠 ProfilePage: Error during sign out:', error);
    }
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  if (!user) {
    console.log('🏠 ProfilePage: Showing sign-in prompt (no user)');
    return (
      <>
        <div className="min-h-screen pt-8 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-[#fef7e0] dark:bg-indigo-900">
          <div className="max-w-md w-full">
            {/* Welcome Card */}
            <div className="bg-white/80 dark:bg-indigo-800 rounded-2xl p-8 shadow-lg border border-amber-200/50 dark:border-indigo-600 text-center">
              <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-amber-900 dark:text-indigo-100 mb-3">
                Welcome to Your Profile
              </h2>
              
              <p className="text-amber-700 dark:text-indigo-200 mb-8 leading-relaxed">
                Sign in to access your personalized dashboard, track your progress, and continue your growth journey with Lumi.
              </p>

              {/* Sign In Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleSignIn}
                  className="w-full bg-amber-400 dark:bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-amber-500 dark:hover:bg-indigo-500 transition-colors flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
                
                <button
                  onClick={handleSignUp}
                  className="w-full bg-white dark:bg-indigo-700 text-amber-600 dark:text-indigo-200 py-3 px-6 rounded-xl font-semibold border border-amber-300 dark:border-indigo-600 hover:bg-amber-50 dark:hover:bg-indigo-600 transition-colors"
                >
                  Create Account
                </button>
              </div>

              {/* Features Preview */}
              <div className="mt-8 pt-6 border-t border-amber-200/50 dark:border-indigo-600">
                <p className="text-sm text-amber-600 dark:text-indigo-300 mb-4 font-medium">
                  What you'll get access to:
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-amber-700 dark:text-indigo-200">Personal progress tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-amber-700 dark:text-indigo-200">Customized growth paths</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-amber-700 dark:text-indigo-200">Personalized coaching with Lumi</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-sm text-amber-700 dark:text-indigo-200">Achievement system with rewards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />
      </>
    );
  }

  console.log('🏠 ProfilePage: Rendering main profile interface');

  return (
    <>
      <div className="min-h-screen pt-8 pb-12 px-4 sm:px-6 lg:px-8 bg-[#fef7e0] dark:bg-indigo-900">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 dark:text-indigo-100 mb-4">
              Your Profile
            </h1>
            <p className="text-xl text-amber-700 dark:text-indigo-200">
              Manage your account and track your journey
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white/80 dark:bg-indigo-800 rounded-2xl p-8 shadow-lg border border-amber-200/50 dark:border-indigo-600 mb-8">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-24 h-24 bg-amber-400 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold text-amber-900 dark:text-indigo-100 mb-2">
                  {user.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-amber-700 dark:text-indigo-200 mb-2">{user.email}</p>
                <div className="flex items-center justify-center md:justify-start space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-900 dark:text-indigo-100">
                      Level {userProfile?.level || 1}
                    </div>
                    <div className="text-sm text-amber-700 dark:text-indigo-200">Current Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-900 dark:text-indigo-100">
                      {userProfile?.points || 0}
                    </div>
                    <div className="text-sm text-amber-700 dark:text-indigo-200">Total Points</div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-8 bg-white/50 dark:bg-indigo-800/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-indigo-700 text-amber-600 dark:text-indigo-200 shadow-md'
                  : 'text-amber-800 dark:text-indigo-200 hover:bg-white/50 dark:hover:bg-indigo-700/50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-indigo-700 text-amber-600 dark:text-indigo-200 shadow-md'
                  : 'text-amber-800 dark:text-indigo-200 hover:bg-white/50 dark:hover:bg-indigo-700/50'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'subscription'
                  ? 'bg-white dark:bg-indigo-700 text-amber-600 dark:text-indigo-200 shadow-md'
                  : 'text-amber-800 dark:text-indigo-200 hover:bg-white/50 dark:hover:bg-indigo-700/50'
              }`}
            >
              Subscription
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/80 dark:bg-indigo-800 p-6 rounded-xl shadow-lg border border-amber-200/50 dark:border-indigo-600">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-900 dark:text-indigo-100 mb-2">
                      {userProfile?.points || 0}
                    </div>
                    <div className="text-amber-700 dark:text-indigo-200">Total Points</div>
                  </div>
                </div>
                
                <div className="bg-white/80 dark:bg-indigo-800 p-6 rounded-xl shadow-lg border border-amber-200/50 dark:border-indigo-600">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-900 dark:text-indigo-100 mb-2">
                      {userProfile?.silver_keys || 0}
                    </div>
                    <div className="text-amber-700 dark:text-indigo-200">Silver Keys</div>
                  </div>
                </div>
                
                <div className="bg-white/80 dark:bg-indigo-800 p-6 rounded-xl shadow-lg border border-amber-200/50 dark:border-indigo-600">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-900 dark:text-indigo-100 mb-2">
                      {userProfile?.gold_keys || 0}
                    </div>
                    <div className="text-amber-700 dark:text-indigo-200">Gold Keys</div>
                  </div>
                </div>
              </div>

              {/* Growth Path */}
              <div className="bg-white/80 dark:bg-indigo-800 p-6 rounded-xl shadow-lg border border-amber-200/50 dark:border-indigo-600">
                <h3 className="font-bold text-lg text-amber-900 dark:text-indigo-100 mb-4">Your Growth Path</h3>
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h4 className="font-semibold text-xl text-amber-900 dark:text-indigo-100 mb-2">
                    {userProfile?.primary_path ? 
                      userProfile.primary_path.charAt(0).toUpperCase() + userProfile.primary_path.slice(1).replace('-', ' ') : 
                      'Choose Your Path'
                    }
                  </h4>
                  <p className="text-amber-700 dark:text-indigo-200">
                    {userProfile?.primary_path 
                      ? 'Your personalized journey focus' 
                      : 'Visit the Paths page to start your journey'
                    }
                  </p>
                  {userProfile?.motivation_level && (
                    <div className="mt-4">
                      <p className="text-sm text-amber-600 dark:text-indigo-300">
                        Motivation Level: {userProfile.motivation_level}/10
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Familiarization Status */}
              {userProfile?.familiarization_completed && (
                <div className="bg-white/80 dark:bg-indigo-800 p-6 rounded-xl shadow-lg border border-amber-200/50 dark:border-indigo-600">
                  <h3 className="font-bold text-lg text-amber-900 dark:text-indigo-100 mb-4">Your Journey Setup</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-emerald-600 dark:bg-emerald-400 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-indigo-100">Familiarization Complete</h4>
                      <p className="text-sm text-amber-700 dark:text-indigo-200">
                        Completed on {new Date(userProfile.familiarization_completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Theme Settings */}
              <div className="bg-white/80 dark:bg-indigo-800 p-6 rounded-xl shadow-lg border border-amber-200/50 dark:border-indigo-600">
                <h3 className="font-bold text-lg text-amber-900 dark:text-indigo-100 mb-6">Theme Settings</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-amber-900 dark:text-indigo-100">Auto Mode</h4>
                      <p className="text-sm text-amber-700 dark:text-indigo-200">
                        Automatically switch between Goldtag (6AM-6PM) and Silbernacht (6PM-6AM)
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoMode(!isAutoMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isAutoMode ? 'bg-amber-600' : 'bg-amber-300 dark:bg-indigo-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isAutoMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {!isAutoMode && (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-amber-900 dark:text-indigo-100">Manual Theme</h4>
                        <p className="text-sm text-amber-700 dark:text-indigo-200">
                          Current theme: {theme === 'goldtag' ? 'Goldtag (Light)' : 'Silbernacht (Dark)'}
                        </p>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="bg-amber-400 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-500 transition-colors"
                      >
                        Switch Theme
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Settings */}
              <div className="bg-white/80 dark:bg-indigo-800 p-6 rounded-xl shadow-lg border border-amber-200/50 dark:border-indigo-600">
                <h3 className="font-bold text-lg text-amber-900 dark:text-indigo-100 mb-6">Account Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-800 dark:text-indigo-200 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={user.email?.split('@')[0] || ''}
                      className="w-full px-3 py-2 border border-amber-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-indigo-700 text-amber-900 dark:text-indigo-100 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-amber-800 dark:text-indigo-200 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email || ''}
                      className="w-full px-3 py-2 border border-amber-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-indigo-700 text-amber-900 dark:text-indigo-100 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="bg-white/80 dark:bg-indigo-800 p-6 rounded-xl shadow-lg border border-amber-200/50 dark:border-indigo-600">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-amber-900 dark:text-indigo-100">Subscription Status</h3>
                <div className="bg-amber-100 dark:bg-indigo-700 text-amber-700 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">
                  Free Plan
                </div>
              </div>

              <div className="text-center py-8">
                <Shield className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h4 className="font-semibold text-xl text-amber-900 dark:text-indigo-100 mb-2">
                  Unlock Premium Features
                </h4>
                <p className="text-amber-700 dark:text-indigo-200 mb-6 max-w-md mx-auto">
                  Get unlimited access to all quest templates, advanced progress tracking, and personalized coaching from Lumi.
                </p>
                <button
                  onClick={handleSubscribe}
                  className="bg-amber-400 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-amber-500 transition-colors inline-flex items-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Subscribe for $5/month</span>
                </button>
              </div>

              {/* Premium Features */}
              <div className="mt-8">
                <h4 className="font-semibold text-amber-900 dark:text-indigo-100 mb-4">Premium Features</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full"></div>
                    </div>
                    <div>
                      <h5 className="font-medium text-amber-900 dark:text-indigo-100">Unlimited Quest Templates</h5>
                      <p className="text-sm text-amber-700 dark:text-indigo-200">Access to 100+ professionally designed quests</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full"></div>
                    </div>
                    <div>
                      <h5 className="font-medium text-amber-900 dark:text-indigo-100">Advanced Progress Tracking</h5>
                      <p className="text-sm text-amber-700 dark:text-indigo-200">Detailed analytics and insights</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full"></div>
                    </div>
                    <div>
                      <h5 className="font-medium text-amber-900 dark:text-indigo-100">Priority Support</h5>
                      <p className="text-sm text-amber-700 dark:text-indigo-200">Get help when you need it most</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full"></div>
                    </div>
                    <div>
                      <h5 className="font-medium text-amber-900 dark:text-indigo-100">Personalized Coaching</h5>
                      <p className="text-sm text-amber-700 dark:text-indigo-200">AI-powered recommendations from Lumi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}