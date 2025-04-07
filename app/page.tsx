"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Wave from "react-wavify";
import supabase from "./supabaseClient";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

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

    // Get viewport dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const waveHeight = screenHeight * 0.35; // The wave takes up 35% of the screen
    const waveTop = screenHeight - waveHeight; // Y-position where the wave starts

    // Function to create a new coin
    const createCoin = () => {
      const now = Date.now();
      // Only create a new coin if enough time has passed (150-300ms)
      if (now - lastCoinTimeRef.current > Math.random() * 400 + 300) {
        lastCoinTimeRef.current = now;

        const newCoin: Coin = {
          id: Math.random().toString(),
          x: Math.random() * screenWidth, // Random horizontal position
          y: -50, // Start above viewport
          velocity: 1 + Math.random() * 2, // Random initial velocity
          size: 45 + Math.random() * 15, // Random size between 30-60px
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
            velocity: coin.velocity + 0.1, // Add gravity effect
          }))
          // Remove coins that have touched the wave
          .filter((coin) => coin.y < waveTop)
      );

      animationRef.current = requestAnimationFrame(animateCoins);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animateCoins);

    // Cleanup function
    return () => {
      authListener?.subscription.unsubscribe();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [router]);

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
    <div className="items-center justify-items-center min-h-screen sm:p-20 font-[family-name:var(--font-geist-sans)] relative overflow-hidden">
      <Toaster />

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
                Sign in with your Loomis account
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
