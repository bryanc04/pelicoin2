'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from "../supabaseClient.js";
import { toast, Toaster } from "react-hot-toast";
import { isAdminEmail } from '../../lib/utils/adminEmails';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, [router]);

  const checkAdmin = async () => {
    const { data } = await supabase.auth.getSession();
    console.log(data);
    if (!data.session) {
      // No active session, redirect to login
      toast.error("No Access");
      router.replace("/");
      return;
    }

    if (isAdminEmail(data.session?.user.email)) {
      setOk(true);
    }
    else{
      toast.error("No Access");
      router.replace("/home");
      return;
    }
  };

  if (!ok) return null;

  return <>{children}</>;
}
