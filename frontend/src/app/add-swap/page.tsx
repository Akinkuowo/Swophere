'use client'

import { useEffect, useState } from "react";
import Footer from "../components/footer";
import Menu from "../components/menu";
import { useRouter } from "next/navigation";
import CreateSwap from "../components/add-swap";


interface User {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export default function AddSwapPage(){
 const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

   useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        router.push('/login');
      }
    }, [router]);

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
        <Menu user={user} />
        <CreateSwap />
        <Footer />
    </div>
  )
}