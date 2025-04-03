"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Wave from "react-wavify";
import supabase from "./supabaseClient";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check for authentication changes, including OAuth redirects
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN") {
          const user = session?.user;
          console.log(user);
          if (user) {
            // Show toast notification for successful sign-in
            toast("Sign in successful");

            // If the user is an admin (change this to your admin email)
            if (user.email === "linda_fisher@loomis.org") {
              router.push("/admin");
            } else {
              router.push("/home");
            }
          }
        }
      }
    );

    // Handle OAuth redirect
    const handleRedirect = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error.message);
      }
    };

    handleRedirect();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, toast]);

  // Handle Microsoft sign-in
  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email profile openid",
        // You can add additional options like redirectTo if needed
        // redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="items-center justify-items-center min-h-screen sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Toaster />
      <div className="text-center text-5xl font-bold mt-[20%] relative">
        Pelicoin banking, <br /> made easy
      </div>
      <div className="flex justify-center mt-[30px]">
        {/* Microsoft Sign In Button with Always-Visible Rainbow Border */}
        <div className="microsoft-btn-container">
          <Button
            onClick={handleMicrosoftSignIn}
            disabled={loading}
            className="microsoft-signin-btn flex items-center gap-2"
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 23 23"
                >
                  <path fill="#f1511b" d="M1 1h10v10H1z" />
                  <path fill="#80cc28" d="M12 1h10v10H12z" />
                  <path fill="#00adef" d="M1 12h10v10H1z" />
                  <path fill="#fbbc09" d="M12 12h10v10H12z" />
                </svg>
                Sign in with Microsoft
              </>
            )}
          </Button>
        </div>
      </div>
      {message && <p className="text-center text-red-500 mt-4">{message}</p>}
      <Wave
        fill="black"
        paused={false}
        style={{
          display: "flex",
          position: "absolute",
          bottom: "0",
          left: "0",
          height: "35%",
        }}
        options={{
          height: 70,
          amplitude: 40,
          speed: 0.25,
          points: 4,
        }}
      />

      {/* Add styles for the always-visible rainbow animation */}
      <style jsx>{`
        .microsoft-btn-container {
          position: relative;
          display: inline-block;
          border-radius: 0.375rem;
          padding: 2px;
          background: linear-gradient(
            90deg,
            rgb(255, 0, 255),
            /* Bright magenta */ rgb(255, 0, 0),
            /* Bright red */ rgb(255, 255, 0),
            /* Bright yellow */ rgb(0, 255, 0),
            /* Bright green */ rgb(0, 255, 255),
            /* Bright cyan */ rgb(0, 0, 255),
            /* Bright blue */ rgb(255, 0, 255) /* Bright magenta again */
          );
          background-size: 200% 200%;
          animation: rainbow-move 3s linear infinite;
        }

        /* Make sure the button itself preserves its styling */
        .microsoft-signin-btn {
          background-color: white;
          color: black;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .microsoft-signin-btn {
            background-color: #1e293b;
            color: white;
          }
        }

        @keyframes rainbow-move {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
