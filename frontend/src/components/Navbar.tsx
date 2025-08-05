import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TreePine, Menu, X, Sun, Moon, Sparkles, LogOut, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/paths', label: 'Paths' },
    { path: '/profile', label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignIn = () => {
    setAuthMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-indigo-800 backdrop-blur-md border-b border-amber-200/50 dark:border-indigo-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <TreePine className="h-8 w-8 text-amber-400 dark:text-indigo-300 group-hover:text-amber-500 dark:group-hover:text-indigo-200 transition-colors" />
                <Sparkles className="h-3 w-3 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="font-bold text-xl text-amber-600 dark:text-indigo-200">
                Chat Me
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-amber-600 dark:text-indigo-300 bg-amber-100 dark:bg-indigo-700'
                      : 'text-amber-800 dark:text-indigo-200 hover:text-amber-600 dark:hover:text-indigo-300 hover:bg-amber-100 dark:hover:bg-indigo-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-amber-100 dark:bg-indigo-700 hover:bg-amber-200 dark:hover:bg-indigo-600 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'goldtag' ? (
                  <Moon className="h-5 w-5 text-amber-700 dark:text-indigo-300" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-700 dark:text-indigo-300" />
                )}
              </button>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-4">
                {loading ? (
                  <div className="w-20 h-8 bg-amber-100 dark:bg-indigo-700 rounded animate-pulse"></div>
                ) : user ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-amber-100 dark:bg-indigo-700 rounded-lg">
                      <User className="w-4 h-4 text-amber-600 dark:text-indigo-300" />
                      <span className="text-sm font-medium text-amber-800 dark:text-indigo-200">
                        {user.email?.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="p-2 text-amber-800 dark:text-indigo-200 hover:text-amber-600 dark:hover:text-indigo-300 hover:bg-amber-100 dark:hover:bg-indigo-700 rounded-lg transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    
                    <button
                      onClick={handleSignIn}
                      className="bg-amber-400 dark:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-500 dark:hover:bg-indigo-500 transition-colors"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-amber-100 dark:bg-indigo-700 hover:bg-amber-200 dark:hover:bg-indigo-600 transition-colors"
              >
                {theme === 'goldtag' ? (
                  <Moon className="h-4 w-4 text-amber-700 dark:text-indigo-300" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-700 dark:text-indigo-300" />
                )}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-amber-800 dark:text-indigo-200 hover:bg-amber-100 dark:hover:bg-indigo-700"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-amber-200/50 dark:border-indigo-700">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(link.path)
                        ? 'text-amber-600 dark:text-indigo-300 bg-amber-100 dark:bg-indigo-700'
                        : 'text-amber-800 dark:text-indigo-200 hover:text-amber-600 dark:hover:text-indigo-300 hover:bg-amber-100 dark:hover:bg-indigo-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-amber-200/50 dark:border-indigo-700 flex flex-col space-y-2">
                  {loading ? (
                    <div className="px-3 py-2">
                      <div className="w-24 h-6 bg-amber-100 dark:bg-indigo-700 rounded animate-pulse"></div>
                    </div>
                  ) : user ? (
                    <>
                      <div className="px-3 py-2 flex items-center space-x-2">
                        <User className="w-4 h-4 text-amber-600 dark:text-indigo-300" />
                        <span className="text-amber-800 dark:text-indigo-200 font-medium">
                          {user.email?.split('@')[0]}
                        </span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="text-left px-3 py-2 text-amber-800 dark:text-indigo-200 hover:text-amber-600 dark:hover:text-indigo-300 font-medium flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                     
                      <button
                        onClick={handleSignIn}
                        className="text-left px-3 py-2 bg-amber-400 dark:bg-indigo-600 text-white rounded-lg font-medium hover:bg-amber-500 dark:hover:bg-indigo-500 transition-colors"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Navbar;