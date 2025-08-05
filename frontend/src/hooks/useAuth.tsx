import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: any | null;
  needsFamiliarization: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Initial auth status check
  const [isProfileFetching, setIsProfileFetching] = useState(false); // Profile data fetching
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [needsFamiliarization, setNeedsFamiliarization] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const currentUserId = useRef<string | null>(null);
  const profileFetchPromiseRef = useRef<Promise<void> | null>(null);
  
  // Ref to hold the latest userProfile value for use in closures
  const userProfileRef = useRef<any | null>(null);

  // Computed loading state - true if either auth checking or profile fetching
  const loading = isAuthChecking || isProfileFetching;

  const clearError = () => setError(null);

  // Update userProfileRef whenever userProfile changes
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  // Cleanup function to prevent state updates on unmounted components
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleUserProfile = async (user: User): Promise<void> => {
    // If a profile fetch is already in progress, return the existing promise
    if (profileFetchPromiseRef.current) {
      console.log('🔄 Profile fetch already in progress, waiting for completion...');
      return profileFetchPromiseRef.current;
    }

    // Create and store the profile fetch promise
    profileFetchPromiseRef.current = (async () => {
      console.log('🔄 Starting optimized handleUserProfile for user:', user.id);
      
      if (!isMounted.current) return;
      
      setIsProfileFetching(true);
      setError(null);
      
      try {
        // Single optimized query with fallback
        console.log('📋 Fetching user profile with single query...');
        
        const queryStartTime = Date.now();
        
        const { data: profile, error } = await supabase
          .from('users')
          .select(`
            id, email, created_at, last_active, path, level, points, 
            silver_keys, gold_keys, last_emotion, familiarization_completed,
            familiarization_completed_at, familiarization_answers, primary_path,
            motivation_level, main_challenges, support_needs
          `)
          .eq('id', user.id)
          .single();
        
        console.log('🔍 Executing profile query...');
        
        const queryEndTime = Date.now();
        console.log(`⏱️ Profile query completed in ${queryEndTime - queryStartTime}ms`);

        if (error && error.code === 'PGRST116') {
          // User not found - create new profile
          console.log('ℹ️ User profile not found, creating new user...');
          
          const now = new Date().toISOString();
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              created_at: now,
              last_active: now,
              level: 1,
              points: 0,
              silver_keys: 0,
              gold_keys: 0,
              familiarization_completed: false
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Error creating user profile:', insertError);
            setError(`Failed to create profile: ${insertError.message}`);
            return;
          }

          if (isMounted.current) {
            setUserProfile(newUser);
            setNeedsFamiliarization(true);
            console.log('🎯 New user profile created, needs familiarization');
          }
        } else if (error) {
          // Other database error
          console.error('❌ Profile fetch error:', error);
          setError(`Profile fetch failed: ${error.message}`);
          return;
        } else {
          // User exists - set profile and familiarization status
          if (isMounted.current) {
            setUserProfile(profile);
            setNeedsFamiliarization(!profile.familiarization_completed);
            console.log('🎯 Existing user profile loaded, familiarization:', !profile.familiarization_completed);
          }

          // Update last_active in background
          const updateLastActive = async () => {
            try {
              await supabase
                .from('users')
                .update({ last_active: new Date().toISOString() })
                .eq('id', user.id);
              console.log('✅ Background last_active update completed');
            } catch (updateError) {
              console.error('❌ Background last_active update failed (non-critical):', updateError);
            }
          };
          updateLastActive();
        }
        
        console.log('✅ Two-step handleUserProfile completed successfully');
      } catch (error) {
        console.error('❌ Error in two-step handleUserProfile:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Profile loading failed: ${errorMessage}`);
        
        // Preserve familiarization_completed status if it was previously true for this user
        const preserveFamiliarizationStatus = userProfileRef.current?.id === user.id && userProfileRef.current?.familiarization_completed === true;
        
        // Default to false for new users, preserve true for existing users
        const finalFamiliarizationStatus = preserveFamiliarizationStatus;
        
        const fallbackProfile = {
          id: user.id,
          email: user.email || '',
          familiarization_completed: finalFamiliarizationStatus,
          level: 1,
          points: 0,
          silver_keys: 0,
          gold_keys: 0,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        };
        
        if (isMounted.current) {
          console.log('🔄 Using fallback profile due to error');
          console.log('🔒 Preserved familiarization status:', preserveFamiliarizationStatus);
          setUserProfile(fallbackProfile);
          setNeedsFamiliarization(!finalFamiliarizationStatus);
        }
      } finally {
        if (isMounted.current) {
          setIsProfileFetching(false);
        }
        // Clear the promise reference when done
        profileFetchPromiseRef.current = null;
      }
    })();

    return profileFetchPromiseRef.current;
  };

  useEffect(() => {
    console.log('🚀 Initializing authentication with onAuthStateChange...');
    
    // Listen for auth state changes - this is our single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Always mark auth as checking when any auth state change occurs
        if (isMounted.current) {
          setIsAuthChecking(true);
          setError(null);
        }
        
        console.log('🔄 Auth state changed:', event, session?.user?.id || 'no user');
        
        // Don't process if component is unmounted
        if (!isMounted.current) {
          console.log('⚠️ Component unmounted, skipping auth state change');
          return;
        }

        // Check if this is the same user and we already have their profile
        const newUserId = session?.user?.id || null;
        const isSameUser = newUserId === currentUserId.current;
        // Use userProfileRef.current to get the latest profile value
        const hasExistingProfile = userProfileRef.current && userProfileRef.current.id === newUserId;

        console.log('🔍 Auth state analysis:', {
          event,
          newUserId,
          currentUserId: currentUserId.current,
          isSameUser,
          hasExistingProfile,
          isProfileFetching: !!profileFetchPromiseRef.current
        });

        // If it's the same user and we already have their profile, don't reload
        if (isSameUser && hasExistingProfile && event !== 'SIGNED_OUT') {
          console.log('✅ Same user with existing profile, skipping reload');
          
          // Just update the session and user state without any loading states
          setSession(session);
          setUser(session?.user ?? null);
          
          // Explicitly ensure loading states are false
          setIsProfileFetching(false);
          setIsAuthChecking(false);
          return;
        }
        
        try {
          console.log('🔄 Updating session and user state...');
          setSession(session);
          setUser(session?.user ?? null);
          
          // Update current user ID
          currentUserId.current = newUserId;
          
          if (event === 'SIGNED_OUT' || !session?.user) {
            console.log('👋 User signed out, clearing profile data');
            setIsProfileFetching(false);
            setUserProfile(null);
            setNeedsFamiliarization(false);
            setError(null);
            currentUserId.current = null;
            // Clear any pending profile fetch
            profileFetchPromiseRef.current = null;
          } else if (session?.user) {
            // Only fetch profile if we don't already have it for this user AND no fetch is in progress
            if (!hasExistingProfile && !profileFetchPromiseRef.current) {
              console.log('👤 Processing user profile for auth event:', event);
              
              const profileStartTime = Date.now();
              await handleUserProfile(session.user);
              const profileEndTime = Date.now();
              
              console.log(`⏱️ handleUserProfile completed in ${profileEndTime - profileStartTime}ms`);
            } else if (profileFetchPromiseRef.current) {
              console.log('⏳ Profile fetch already in progress, waiting...');
              await profileFetchPromiseRef.current;
            } else {
              console.log('✅ Using existing profile for user:', session.user.id);
            }
          }
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Authentication error occurred';
          setError(errorMessage);
          
          // Create a basic fallback profile to prevent infinite loading
          if (session?.user && isMounted.current) {
            console.log('🔄 Creating emergency fallback profile');
            
            // Preserve familiarization_completed status if it was previously true for this user
            const preserveFamiliarizationStatus = userProfileRef.current?.id === session.user.id && userProfileRef.current?.familiarization_completed === true;
            
            const emergencyProfile = {
              id: session.user.id,
              email: session.user.email || '',
              familiarization_completed: preserveFamiliarizationStatus,
              level: 1,
              points: 0,
              silver_keys: 0,
              gold_keys: 0,
              created_at: new Date().toISOString(),
              last_active: new Date().toISOString()
            };
            
            console.log('🔒 Emergency fallback - preserving familiarization status:', preserveFamiliarizationStatus ? 'true (sticky)' : 'false (default)');
            setUserProfile(emergencyProfile);
            setNeedsFamiliarization(!preserveFamiliarizationStatus);
            currentUserId.current = session.user.id;
          }
          
          // Ensure profile fetching is reset in error scenarios
          setIsProfileFetching(false);
        } finally {
          if (isMounted.current) {
            console.log('✅ Auth state change processed, setting isAuthChecking to false for event:', event);
            setIsAuthChecking(false);
          }
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - this effect should only run once

  const refreshUserProfile = async () => {
    if (!user) {
      console.log('⚠️ No user to refresh profile for');
      return;
    }

    // If a refresh is already in progress, wait for it
    if (profileFetchPromiseRef.current) {
      console.log('🔄 Profile refresh already in progress, waiting...');
      await profileFetchPromiseRef.current;
      return;
    }

    console.log('🔄 Refreshing user profile...');
    setIsAuthChecking(true);
    setError(null);
    
    // Create and store the refresh promise
    profileFetchPromiseRef.current = (async () => {
      try {
        const refreshStartTime = Date.now();
        
        const { data, error } = await supabase
          .from('users')
          .select(`
            id, email, created_at, last_active, path, level, points, 
            silver_keys, gold_keys, last_emotion, familiarization_completed,
            familiarization_completed_at, familiarization_answers, primary_path,
            motivation_level, main_challenges, support_needs
          `)
          .eq('id', user.id)
          .single();
        
        console.log('🔍 Executing refresh query...');
        
        const refreshEndTime = Date.now();
        console.log(`⏱️ Refresh query completed in ${refreshEndTime - refreshStartTime}ms`);

        if (error) {
          console.error('❌ Error refreshing user profile:', error);
          setError(`Profile refresh failed: ${error.message}`);
          
          // If refresh fails, keep the current profile but log the error
          console.log('🔄 Keeping current profile due to refresh error');
        } else {
          console.log('✅ User profile refreshed successfully');
          if (isMounted.current) {
            setUserProfile(data);
            setNeedsFamiliarization(!data.familiarization_completed);
          }
        }
      } catch (error) {
        console.error('❌ Error refreshing user profile:', error);
        const errorMessage = error instanceof Error ? error.message : 'Profile refresh failed';
        setError(errorMessage);
        // Don't clear the profile on refresh error - keep what we have
      } finally {
        if (isMounted.current) {
          setIsAuthChecking(false);
        }
        // Clear the promise reference when done
        profileFetchPromiseRef.current = null;
      }
    })();

    return profileFetchPromiseRef.current;
  };

  const signOut = async () => {
    console.log('👋 Signing out user...');
    setIsAuthChecking(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
        setError(`Sign out failed: ${error.message}`);
        throw error;
      }
      console.log('✅ Sign out successful, waiting for auth state change');
    } catch (error) {
      console.error('❌ Error in signOut:', error);
      if (isMounted.current) {
        console.log('🔄 Resetting isAuthChecking to false due to sign out error');
        setIsAuthChecking(false);
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    needsFamiliarization,
    signOut,
    refreshUserProfile,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};