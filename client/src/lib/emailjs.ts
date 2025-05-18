import emailjs from '@emailjs/browser';

const TEMPLATE_ID = 'template_phokvql';
const SERVICE_ID = 'service_g74bsuv';
const PUBLIC_KEY = '6zoPFwdoZ-oSFGt4F';

// Initialize with public key
emailjs.init({
  publicKey: PUBLIC_KEY
});

export const sendVerificationCode = async (email: string, code: string) => {
  try {
    if (!email) {
      throw new Error('Email address is required');
    }

    if (!code) {
      throw new Error('Verification code is required');
    }

    console.log('Attempting to send verification code...', {
      serviceId: SERVICE_ID,
      templateId: TEMPLATE_ID,
      email,
      code
    });

    // EmailJS template parameters
    const templateParams = {
      to: email,           // Primary recipient field
      recipient: email,    // Backup recipient field
      email: email,        // Another common field name
      to_name: email.split('@')[0],
      from_name: "FootTraffic",
      verification_code: code,
      message: `Your verification code is: ${code}`, // Backup message field
      content: `Your verification code is: ${code}`, // Another common field name
    };

    console.log('Sending with template params:', templateParams);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    );

    if (!response.status || response.status !== 200) {
      throw new Error(`EmailJS returned status ${response.status || 'unknown'}: ${response.text || 'No details available'}`);
    }

    console.log('Email sent successfully:', response);
    return true;
  } catch (error: any) {
    // More detailed error logging
    console.error('Failed to send verification email:', {
      error,
      status: error?.status,
      text: error?.text,
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    
    let errorMessage = 'Failed to send verification code';
    if (error?.text) {
      errorMessage += `: ${error.text}`;
    } else if (error?.message) {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
