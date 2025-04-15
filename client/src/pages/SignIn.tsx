import React, { useState } from 'react';
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
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      setLocation('/dashboard');
    } catch (error: any) {
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
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full md:w-1/2 flex flex-col p-8 justify-center items-center">
        <div className="flex items-center mb-8">
          <Logo textColor="text-black" />
        </div>
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold mb-2 text-center">Welcome back</h2>
          <p className="text-gray-600 mb-8 text-center">Sign in to continue</p>
          
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
                <label htmlFor="remember" className="text-sm">Remember me</label>
              </div>
              <a href="#" className="ml-auto text-sm text-secondary">Forgot Password</a>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-2 bg-accent text-darkText rounded-md font-medium mb-2 hover:bg-yellow-500 transition"
            >
              Sign In
            </Button>
            
            <div className="text-center my-2">or</div>
            
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
        </div>
      </div>
      
      <div className="hidden md:flex md:w-1/2 bg-accent items-center justify-center relative">
        <div className="text-center z-10 p-8">
          <h2 className="text-3xl font-bold mb-4 text-darkText">Let's get started</h2>
          <p className="mb-6 text-darkText">Don't have an account? Create an account to start your journey with us.</p>
          <Button 
            className="px-8 py-2 bg-white text-darkText rounded-full font-medium hover:bg-gray-100 transition"
            onClick={() => setLocation('/signup')}
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
  );
};

export default SignIn;