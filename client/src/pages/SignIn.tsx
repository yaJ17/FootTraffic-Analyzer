import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import signinImage from '../assets/signin_img.jpg';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { 
    loginWithEmail, 
    loginWithGoogle, 
    pendingVerification, 
    verificationEmail,
    verifyCode
  } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      console.log('Login successful, should show verification'); // Debug log
    } catch (error: any) {
      console.error('Login error:', error); // Debug log
      toast({
        title: "Login Failed",
        description: error.message || "Failed to sign in with email and password",
        variant: "destructive"
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      });
    }
  };

  const handleVerifyCode = () => {
    if (verificationCode.trim() === '') {
      toast({
        title: "Verification Code Required",
        description: "Please enter the verification code sent to your email",
        variant: "destructive"
      });
      return;
    }

    const isValid = verifyCode(verificationCode);
    if (isValid) {
      setLocation('/dashboard');
    } else {
      toast({
        title: "Invalid Code",
        description: "The verification code you entered is incorrect",
        variant: "destructive"
      });
      setVerificationCode('');
    }
  };

  // Track animation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [comingFromSignUp, setComingFromSignUp] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'signup') {
      setComingFromSignUp(true);
    }
  }, []);
  
  const handleNavigateToSignUp = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setLocation('/signup?from=signin');
    }, 500);
  };
  // Debug log for verification state
  useEffect(() => {
    console.log('SignIn component verification state:', { 
      pendingVerification, 
      verificationEmail 
    });
  }, [pendingVerification, verificationEmail]);

  // Show verification screen if pending verification
  if (pendingVerification) {
    console.log('Rendering verification screen');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center">
            <Logo textColor="text-black" />
            <h2 className="mt-6 text-3xl font-bold text-center">Enter Verification Code</h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              We've sent a verification code to {verificationEmail}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full p-2 border rounded-md text-center text-2xl tracking-wider"
              maxLength={6}
            />

            <Button
              onClick={handleVerifyCode}
              className="w-full py-2 bg-accent text-darkText rounded-md font-medium hover:bg-yellow-500 transition"
            >
              Verify & Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show login form
  return (
    <div className={`min-h-screen overflow-hidden auth-container signin-container ${comingFromSignUp ? 'slide-in-from-right' : ''} ${isNavigating ? 'slide-out' : ''}`}>
      <div className="flex min-h-screen">
        <div className="w-full md:w-1/2 flex flex-col p-8 justify-center items-center">
          <div className="flex items-center mb-8">
            <Logo textColor="text-black" />
          </div>
          <div className="max-w-md w-full">
            <h2 className="text-3xl font-bold mb-2 text-center text-black drop-shadow-md">Welcome back</h2>
            <p className="text-gray-600 mb-8 text-center drop-shadow-md">Sign in to continue</p>
            
            <form className="w-full" onSubmit={handleEmailLogin}>
              <div className="mb-4">
                <div className="flex items-center p-2 border border-gray-300 rounded-md bg-[#FFF8D6]">
                  <i className="material-icons text-gray-500 mr-2">email</i>
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    className="flex-1 outline-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-transparent" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex items-center p-2 border border-gray-300 rounded-md bg-[#FFF8D6]">
                  <i className="material-icons text-gray-500 mr-2">lock</i>
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password" 
                    className="flex-1 outline-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-transparent" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <i 
                    className="material-icons text-gray-500 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </i>
                </div>
              </div>
              
              <div className="flex items-center mb-6">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="mr-2"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember" className="text-sm drop-shadow-md">Remember me</label>
                </div>
                <a href="#" className="ml-auto text-sm text-secondary drop-shadow-md">Forgot Password</a>
              </div>
              
              <Button 
                type="submit" 
                className="w-full py-2 bg-accent text-darkText rounded-md font-medium mb-2 hover:bg-yellow-500 transition"
              >
                Sign In
              </Button>
              
              <div className="text-center my-2 drop-shadow-md">or</div>
              
              <Button 
                type="button" 
                className="w-full py-2 bg-accent flex items-center justify-center rounded-md font-medium hover:bg-yellow-500 transition text-darkText"
                onClick={handleGoogleLogin}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Sign in with Google
              </Button>
            </form>

            {/* Mobile sign up button (only visible on mobile) */}
            <div className="mt-6 text-center md:hidden">
              <p className="text-sm text-gray-600 mb-2 drop-shadow-md">Don't have an account?</p>
              <Button
                variant="outline"
                className="text-primary border-primary hover:bg-primary/10"
                onClick={handleNavigateToSignUp}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
        
        <div className={`hidden md:flex md:w-1/2 bg-accent items-center justify-center relative auth-panel ${isNavigating ? 'slide-out' : ''}`}>
          <div className="text-center z-10 p-8">
            <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-md">Let's get started</h2>
            <p className="mb-6 text-white drop-shadow-md">Don't have an account? Create an account to start your journey with us.</p>
            <Button 
              className="px-8 py-2 bg-white text-darkText rounded-full font-medium hover:bg-gray-100 transition"
              onClick={handleNavigateToSignUp}
            >
              SIGN UP
            </Button>
          </div>
          <div 
            className="absolute inset-0 opacity-70 bg-cover bg-center" 
            style={{ 
              backgroundImage: `url(${signinImage})`,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;