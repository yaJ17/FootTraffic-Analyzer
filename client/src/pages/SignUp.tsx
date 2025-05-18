import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import signupImage from '../assets/signup_img.jpg';

// Password validation function
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  const hasCapital = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasCapital) return { isValid: false, message: "Password must contain at least one capital letter" };
  if (!hasNumber) return { isValid: false, message: "Password must contain at least one number" };
  if (!hasSpecial) return { isValid: false, message: "Password must contain at least one special character" };
  
  return { isValid: true, message: "" };
};

// Email validation function
const validateEmail = (email: string): { isValid: boolean; message: string } => {
  const isGmail = email.toLowerCase().endsWith('@gmail.com');
  if (!isGmail) return { isValid: false, message: "Please use a Gmail address" };
  return { isValid: true, message: "" };
};

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { registerWithEmail, loginWithGoogle, logoutUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast({
        title: "Invalid Email",
        description: emailValidation.message,
        variant: "destructive"
      });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: passwordValidation.message,
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await registerWithEmail(email, password);
      toast({
        title: "Registration Success",
        description: "Please check your email to verify your account before signing in.",
        variant: "default"
      });
      // Redirect to sign in page after successful registration
      setTimeout(() => {
        setLocation('/signin?from=signup');
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    }
  };
  
  const handleGoogleSignUp = async () => {
    try {
      const user = await loginWithGoogle();
      // Log out immediately after Google sign-up
      await logoutUser();
      
      toast({
        title: "Registration Success",
        description: "Your account has been created with Google. Please sign in now.",
        variant: "default"
      });
      
      // Redirect to sign in page after successful registration with Google
      setTimeout(() => {
        setLocation('/signin?from=signup');
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to sign up with Google",
        variant: "destructive"
      });
    }
  };

  // Track animation states
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Check if we're coming from SignIn (to add slide-in animation)
  const [comingFromSignIn, setComingFromSignIn] = useState(false);
  
  useEffect(() => {
    // Check if we're coming from the SignIn page via URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'signin') {
      setComingFromSignIn(true);
    }
  }, []);
  
  const handleNavigateToSignIn = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setLocation('/signin?from=signup');
    }, 500); // Wait for animation to complete
  };

  return (
    <div className={`min-h-screen overflow-hidden auth-container signup-container ${comingFromSignIn ? 'slide-in-from-left' : ''} ${isNavigating ? 'slide-out' : ''}`}>
      <div className="flex min-h-screen">
        <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center relative">
          <div className="text-center z-10 p-8">
            <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-md">Welcome back</h2>
            <p className="mb-6 text-white drop-shadow-md">Already have an account? To keep connected with us, please login your account.</p>
            <Button 
              className="px-8 py-2 bg-white text-darkText rounded-full font-medium hover:bg-gray-100 transition"
              onClick={handleNavigateToSignIn}
            >
              SIGN IN
            </Button>
          </div>
          <div 
            className="absolute inset-0 opacity-70 bg-cover bg-center" 
            style={{ 
              backgroundImage: `url(${signupImage})`,
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }} 
          />
        </div>
        
        <div className="w-full md:w-1/2 flex flex-col p-8 justify-center items-center bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center mb-8">
            <Logo textColor="text-white" />
          </div>
          <div className="max-w-md w-full">
            <h2 className="text-3xl font-bold mb-2 text-center text-white drop-shadow-md">Let's get started</h2>
            <p className="text-white mb-8 text-center drop-shadow-md">Enter your details to create an account</p>
            
            <form className="w-full" onSubmit={handleEmailSignUp}>
              <div className="mb-4">
                <div className="flex items-center p-2 border border-gray-300 rounded-md bg-[#E6F0FF]">
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
              
              <div className="mb-4">
                <div className="flex items-center p-2 border border-gray-300 rounded-md bg-[#E6F0FF]">
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
              
              <div className="mb-6">
                <div className="flex items-center p-2 border border-gray-300 rounded-md bg-[#E6F0FF]">
                  <i className="material-icons text-gray-500 mr-2">lock</i>
                  <Input 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password" 
                    className="flex-1 outline-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-transparent" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <i 
                    className="material-icons text-gray-500 cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </i>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full py-2 bg-primary text-white rounded-md font-medium mb-2 hover:bg-secondary transition"
              >
                Sign Up
              </Button>
              
              <div className="text-center my-2 text-white">or</div>
              
              <Button 
                type="button" 
                className="w-full py-2 bg-primary text-white flex items-center justify-center rounded-md font-medium hover:bg-secondary transition"
                onClick={handleGoogleSignUp}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Sign Up with Google
              </Button>
            </form>
            
            {/* Mobile sign in button (only visible on mobile) */}
            <div className="mt-6 text-center md:hidden">
              <p className="text-sm text-white drop-shadow-md mb-2">Already have an account?</p>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white/10"
                onClick={handleNavigateToSignIn}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;