"use client";
import { SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import NavBar from "@/components/ui/NavBar";

const features = [
  {
    icon: "/globe.svg",
    title: "AI-Powered Prompt Entry",
    desc: "Add expenses in natural language and let AI do the rest.",
  },
  {
    icon: "/window.svg",
    title: "Visual Analytics",
    desc: "See your monthly spending with beautiful graphs.",
  },
  {
    icon: "/file.svg",
    title: "Secure & Private",
    desc: "Your data is protected with Clerk authentication.",
  },
];

export default function Home() {
  useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mt-12"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400 bg-clip-text text-transparent mb-4 animate-fade-in">
            Track. Analyze. <span className="underline decoration-wavy decoration-pink-400">Thrive.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in delay-100">
            The next-gen expense tracker with AI-powered entry, analytics, and a beautiful, secure experience.
          </p>
          <SignedOut>
            <SignInButton forceRedirectUrl={"/inner"}>
              <Button size="lg" className="px-8 py-6 text-lg shadow-lg animate-bounce">Get Started</Button>
            </SignInButton>
          </SignedOut>
        </motion.div>
        {/* Features Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.2 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 mb-16 w-full max-w-5xl"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.2 }}
            >
              <Card className="flex flex-col items-center p-8 shadow-xl hover:scale-105 transition-transform bg-white/80">
                <Image src={f.icon} alt={f.title} width={48} height={48} className="mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-indigo-700">{f.title}</h3>
                <p className="text-muted-foreground text-center">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl font-bold mb-4 text-indigo-700">Ready to take control of your finances?</h2>
          <SignedOut>
            <SignInButton forceRedirectUrl={"/inner"}>
              <Button size="lg" className="px-8 py-6 text-lg shadow-lg animate-bounce">Start Tracking Now</Button>
            </SignInButton>
          </SignedOut>
        </motion.div>
      </main>
      <footer className="text-center text-muted-foreground py-6 text-sm">
        &copy; {new Date().getFullYear()} ExpenseFlow. All rights reserved.
      </footer>
    </div>
  );
}
