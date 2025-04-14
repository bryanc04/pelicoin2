"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Wave from "react-wavify";
import supabase from "./supabaseClient";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";

// Define the coin type
interface Coin {
  id: string;
  x: number;
  y: number;
  velocity: number;
  size: number;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [coins, setCoins] = useState<Coin[]>([]); // Properly typed state
  const [waveOptions, setWaveOptions] = useState({
    height: 70,
    amplitude: 40,
    speed: 0.25,
    points: 4,
  });
  const router = useRouter();
  const animationRef = useRef<number | null>(null);
  const lastCoinTimeRef = useRef(0);

  useEffect(() => {
    // Check for authentication changes, including OAuth redirects
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN") {
          const user = session?.user;
          console.log(user);
          if (user) {
            // Show toast notification for successful sign-in
            toast.success("Sign in successful");

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

    // Cleanup function for auth listener
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // Set wave options after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWaveOptions({
        height: window.innerWidth < 768 ? 50 : 70,
        amplitude: window.innerWidth < 768 ? 30 : 40,
        speed: 0.25,
        points: 4,
      });
    }
  }, []);

  // Separate useEffect for coin animation
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      // Get viewport dimensions
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const waveHeight = screenHeight * 0.35;
      const waveTop = screenHeight - waveHeight;

      // Function to create a new coin
      const createCoin = () => {
        const now = Date.now();
        const minDelay = 300;
        const maxDelay = 400;

        if (
          now - lastCoinTimeRef.current >
          Math.random() * (maxDelay - minDelay) + minDelay
        ) {
          lastCoinTimeRef.current = now;

          const newCoin: Coin = {
            id: Math.random().toString(),
            x: Math.random() * screenWidth,
            y: -50,
            velocity: 1 + Math.random() * 2,
            size: 45 + Math.random() * 15,
          };

          setCoins((prevCoins) => [...prevCoins, newCoin]);
        }
      };

      // Function to animate all coins
      const animateCoins = () => {
        createCoin();

        setCoins((prevCoins) =>
          prevCoins
            .map((coin) => ({
              ...coin,
              y: coin.y + coin.velocity,
              velocity: coin.velocity + 0.1,
            }))
            .filter((coin) => coin.y < waveTop)
        );

        animationRef.current = requestAnimationFrame(animateCoins);
      };

      // Start animation
      animationRef.current = requestAnimationFrame(animateCoins);

      // Handle window resize
      const handleResize = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setCoins([]);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
        }
      };

      window.addEventListener("resize", handleResize);

      // Cleanup function
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

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
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-20 font-[family-name:var(--font-geist-sans)] relative overflow-hidden">
      <Toaster />
      <Analytics />
      {/* Render all falling coins */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          style={{
            position: "absolute",
            left: `${coin.x}px`,
            top: `${coin.y}px`,
            zIndex: 0,
          }}
        >
          <img
            src="/pelicoin.png"
            alt="Pelicoin"
            width={coin.size}
            height={coin.size}
            style={{ zIndex: 0 }}
          />
        </div>
      ))}

      <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2 w-full px-4">
        <div className="text-center text-3xl sm:text-5xl font-bold">
          Pelicoin banking, <br /> made easy
        </div>
        <div className="flex justify-center mt-6 sm:mt-8 w-full">
          <div className="microsoft-btn-container w-full sm:w-auto">
            <Button
              onClick={handleMicrosoftSignIn}
              disabled={loading}
              className="microsoft-signin-btn flex items-center gap-2 w-full sm:w-auto py-6 sm:py-2"
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
                  Sign in with your Loomis account
                </>
              )}
            </Button>
          </div>
        </div>
        {message && (
          <p className="text-center text-red-500 mt-4 px-4">{message}</p>
        )}
      </div>
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
        options={waveOptions}
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
            rgb(255, 0, 0),
            rgb(255, 255, 0),
            rgb(0, 255, 0),
            rgb(0, 255, 255),
            rgb(0, 0, 255),
            rgb(255, 0, 255)
          );
          background-size: 200% 200%;
          animation: rainbow-move 3s linear infinite;
          width: 100%;
        }

        .microsoft-signin-btn {
          background-color: white;
          color: black;
          width: 100%;
          font-size: 1rem;
          padding: 0.75rem 1.5rem;
        }

        @media (min-width: 768px) {
          .microsoft-btn-container {
            width: auto;
          }
          .microsoft-signin-btn {
            width: auto;
            font-size: 0.875rem;
            padding: 0.5rem 1rem;
          }
        }

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
