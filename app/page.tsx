"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Wave from "react-wavify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import supabase from "./supabaseClient";
import { useRouter } from "next/navigation";

export default function Home() {
  const [SUname, setSUname] = useState("");
  const [SUemail, setSUemail] = useState("");
  const [SUpassword, setSUpassword] = useState("");

  const [SIemail, setSIemail] = useState("");
  const [SIpassword, setSIpassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Handle sign-up
  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({
      email: SUemail,
      password: SUpassword,
      options: {
        data: {
          full_name: SUname,
        },
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Sign-up successful! Please check your email for confirmation."
      );
    }
  };

  // Handle sign-in
  const handleSignIn = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: SIemail,
      password: SIpassword,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      if (SIemail == "linda_fisher@loomis.org") {
        router.push("/admin");
      } else {
        router.push("/home");
      }

      setMessage("Sign-in successful!");
    }
  };

  return (
    <div className="items-center justify-items-center min-h-screen sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center text-5xl font-bold mt-[20%] relative">
        pelicoin banking, <br /> made easy
      </div>
      <div>
        <div className="grid grid-cols-[45%_45%] gap-4 mt-[30px] w-[fit-content] ml-[auto] mr-[auto]">
          {/* Sign Up Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Sign up</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Sign up</DialogTitle>
                <DialogDescription>
                  Enter details for your new account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    value={SUname}
                    onChange={(e) => setSUname(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={SUemail}
                    onChange={(e) => setSUemail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={SUpassword}
                    onChange={(e) => setSUpassword(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSignUp} disabled={loading}>
                  {loading ? "Signing up..." : "Complete"}
                </Button>
              </DialogFooter>
              {message && (
                <p className="text-center text-red-500 mt-2">{message}</p>
              )}
            </DialogContent>
          </Dialog>

          {/* Sign In Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button>Sign in</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Sign in</DialogTitle>
                <DialogDescription>
                  Enter your email and password to sign in.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={SIemail}
                    onChange={(e) => setSIemail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={SIpassword}
                    onChange={(e) => setSIpassword(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSignIn} disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </DialogFooter>
              {message && (
                <p className="text-center text-red-500 mt-2">{message}</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
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
        options={{
          height: 70,
          amplitude: 40,
          speed: 0.25,
          points: 4,
        }}
      />
    </div>
  );
}
