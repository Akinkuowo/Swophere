'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SwapDetailPage from "@/app/components/listing";
import Menu from '../components/menu';
import { User } from '../components/menu';
import Footer from '../components/footer';



export default function Swops(){
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Check if we're in browser environment
                if (typeof window !== 'undefined') {
                  const storedUser = localStorage.getItem('user');
                  if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                  } else {
                    // If no user in localStorage, redirect to login
                    router.push('/login');
                    return;
                  }
                }
              } catch (error) {
                console.error('Error fetching user data:', error);
                router.push('/login');
              }
            };
    
        fetchUserData();
      }, [router]);

    return(
        <>
            <Menu user={user} />
            <SwapDetailPage />
            <Footer />
        </>
    )
}