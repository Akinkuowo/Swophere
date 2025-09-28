
import LoginForm from "./components/login";
import Head from 'next/head';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>LetSwap - Login</title>
        <meta name="description" content="Login to your LetSwap account" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <LoginForm />
    </>
  );
}