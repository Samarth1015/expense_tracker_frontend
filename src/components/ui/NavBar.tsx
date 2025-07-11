"use client";
import { SignedOut, SignInButton, SignedIn, SignOutButton } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "./button";
import { motion } from "framer-motion";

export default function NavBar() {
  return (
    <header className="flex justify-between items-center px-6 py-4">
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
        <div className="flex items-center gap-2">
          <Image src="/globe.svg" alt="logo" width={36} height={36} />
          <span className="text-2xl font-bold tracking-tight text-indigo-700">ExpenseFlow</span>
        </div>
      </motion.div>
      <div>
        <SignedOut>
          <SignInButton forceRedirectUrl={"/inner"}>
            <Button variant="outline">Sign In</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <SignOutButton>
            <Button variant="outline">Sign Out</Button>
          </SignOutButton>
        </SignedIn>
      </div>
    </header>
  );
} 