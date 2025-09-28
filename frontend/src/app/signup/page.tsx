// app/signup/page.tsx

import { Metadata } from 'next';
import SignupForm from '../components/signup';

export const metadata: Metadata = {
  title: 'LetSwap - Sign Up',
  description: 'Create your LetSwap account',
};

export default function SignupPage() {
  return <SignupForm />;
}