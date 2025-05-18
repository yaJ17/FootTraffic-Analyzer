import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/Logo';
import { sendVerificationCode, generateVerificationCode } from '@/lib/emailjs';

interface VerificationPageProps {
  email: string;
  onVerificationComplete: () => void;
  generatedCode?: string; // Add this prop
}

const VerificationPage: React.FC<VerificationPageProps> = ({ email, onVerificationComplete }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    sendInitialCode();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const sendInitialCode = async () => {
    const code = generateVerificationCode();
    setGeneratedCode(code);
    const success = await sendVerificationCode(email, code);
    
    if (!success) {
      toast({
        title: "Failed to Send Code",
        description: "There was an error sending the verification code. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleResendCode = async () => {
    try {
      setTimeLeft(60);
      setCanResend(false);
      await sendInitialCode();
      
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Resend Code",
        description: error.message || "Failed to send a new verification code",
        variant: "destructive"
      });
      setCanResend(true);
      setTimeLeft(0);
    }
  };
  const handleVerifyCode = () => {
    console.log('Verifying code:', {
      entered: verificationCode,
      generated: generatedCode
    });
    
    if (verificationCode === generatedCode) {
      toast({
        title: "Verification Successful",
        description: "Your email has been verified.",
      });
      onVerificationComplete();
    } else {
      toast({
        title: "Invalid Code",
        description: "The verification code you entered is incorrect. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Logo textColor="text-black" />
          <h2 className="mt-6 text-3xl font-bold text-center">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            We've sent a verification code to {email}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full p-2 border rounded-md"
            maxLength={6}
          />

          <Button
            onClick={handleVerifyCode}
            className="w-full bg-accent text-darkText hover:bg-yellow-500"
          >
            Verify Code
          </Button>

          <div className="text-center">
            {!canResend ? (
              <p className="text-sm text-gray-600">
                Resend code in {timeLeft}s
              </p>
            ) : (
              <Button
                variant="link"
                onClick={handleResendCode}
                className="text-secondary"
              >
                Resend Code
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
