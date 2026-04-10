"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, ClipboardList, Shield, ChevronRight, Menu, X, Star, Target, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";

/* ─── Reusable animation variants ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.7, ease: "easeOut", delay: i * 0.1 },
  }),
};

const slideLeft = {
  hidden: { opacity: 0, x: -50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const slideRight = {
  hidden: { opacity: 0, x: 50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

/** Triggers children once when the section scrolls into view */
function ScrollReveal({ children, className, variants = fadeUp, custom, once = true, amount = 0.15 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount });
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      custom={custom}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoaded, logout } = useAuth();
  const isLoggedIn = isLoaded && !!user;

  /* Parallax scroll for hero image */
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(heroScroll, [0, 1], ["0%", "25%"]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <motion.header
        className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md shadow-sm"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">

          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              transition={{ delay: 1, duration: 0.8, ease: "easeInOut" }}
            >
              <Brain className="h-9 w-9 text-indigo-600" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="text-indigo-600">Bright</span>
              <span className="ml-2 text-slate-900">Steps</span>
            </h1>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            {["How It Works", "About ASD", "Features", "FAQ"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="hover:text-indigo-600 transition-colors"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
                whileHover={{ y: -2 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <motion.div
            className="hidden md:flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {isLoggedIn ? (
              <>
                <Button className="text-sm bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5" onClick={() => router.push("/dashboard")}>Dashboard</Button>
                <Button variant="ghost" className="text-sm" onClick={logout}>Sign Out</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-sm" onClick={() => router.push("/sign-in")}>Sign In</Button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button className="text-sm bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5" onClick={() => router.push("/sign-up")}>Get Started</Button>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen
                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><X className="h-5 w-5" /></motion.div>
                : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Menu className="h-5 w-5" /></motion.div>
              }
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="md:hidden border-t bg-white px-4 py-4 space-y-3"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              {["How It Works", "About ASD", "Features", "FAQ"].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  className="block text-sm font-medium text-gray-700 hover:text-indigo-600 py-1"
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  {item}
                </motion.a>
              ))}
              <div className="flex gap-2 pt-2 items-center">
                {isLoggedIn ? (
                  <>
                    <Button className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => { router.push("/dashboard"); setMenuOpen(false); }}>Dashboard</Button>
                    <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1 text-sm rounded-xl" onClick={() => router.push("/sign-in")}>Sign In</Button>
                    <Button className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => router.push("/sign-up")}>Get Started</Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Parallax background */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/hero.jpg')`,
            y: heroBgY,
            scale: 1.1,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/40 via-transparent to-transparent" />

        <div className="relative container mx-auto px-8 md:px-16 py-24">
          <div className="max-w-2xl">
            <motion.div
              className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <motion.div animate={{ rotate: 360 }} transition={{ delay: 1.2, duration: 0.6 }}>
                <Star className="h-3 w-3" />
              </motion.div>
              AI-Enabled Decision Support Platform for Early Detection of Autism
            </motion.div>

            <div className="overflow-hidden">
              <motion.h1
                className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                Small Signs Today.
                <br />
                <motion.span
                  className="bg-gradient-to-r from-indigo-300 to-indigo-500 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  Stronger Steps Tomorrow.
                </motion.span>
              </motion.h1>
            </div>

            <motion.p
              className="text-lg text-slate-300 leading-relaxed mb-10 max-w-xl"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.6 }}
            >
              Bright Steps helps families notice early developmental patterns through simple guidance and structured observations at home, giving you clearer insight when it matters most.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 text-base shadow-lg shadow-indigo-900/40"
                  onClick={() => router.push(isLoggedIn ? "/dashboard" : "/sign-up")}
                >
                  {isLoggedIn ? "Go to Dashboard" : "Begin Screening"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 text-base backdrop-blur-sm bg-white/5"
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Learn How It Works
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-indigo-600 py-10 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: "5,000+", label: "Screenings Completed" },
              { value: "94%",    label: "Accuracy Rate"        },
              { value: "4",      label: "Age Groups Covered"   },
              { value: "10 min", label: "Avg. Time to Complete"},
            ].map(({ value, label }, i) => (
              <ScrollReveal key={label} variants={scaleIn} custom={i}>
                <motion.div
                  whileHover={{ scale: 1, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-3xl md:text-4xl font-extrabold">{value}</div>
                  <div className="text-indigo-200 text-sm mt-1">{label}</div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Three simple steps to gain valuable insights into your child&apos;s development.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Add Your Child",      desc: "Create a profile with your child's age and basic information.",                 icon: Users        },
              { step: "2", title: "Complete Screening",  desc: "Answer age-appropriate questions and optionally upload a short video.",         icon: ClipboardList },
              { step: "3", title: "View Results",        desc: "Receive a comprehensive AI-assisted assessment with clear risk indicators.",    icon: Target       },
            ].map(({ step, title, desc }, i) => (
              <ScrollReveal key={step} variants={fadeUp} custom={i * 1.5} className="flex flex-col items-center text-center relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+48px)] w-[calc(100%-48px)] h-0.5 bg-indigo-100 z-0" />
                )}
                <motion.div
                  className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl font-extrabold text-white">{step}</span>
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ASD ── */}
      <section id="about-asd" className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <ScrollReveal variants={slideLeft} className="relative">
              <motion.div
                className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-200"
                whileHover={{ scale: 1.02, rotate: -1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <motion.img
                  src="/images/about-asd.jpg"
                  alt="Parent with child"
                  className="w-full h-80 object-cover"
                  initial={{ scale: 1.15 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
              </motion.div>
              <motion.div
                className="absolute -bottom-5 -right-5 bg-indigo-600 text-white rounded-2xl px-5 py-3 shadow-lg"
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, duration: 0.6, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.08 }}
              >
                <div className="text-2xl font-extrabold">1 in 36</div>
                <div className="text-indigo-200 text-xs">children diagnosed with ASD</div>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal variants={slideRight}>
              <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">Understanding</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 mb-6 leading-tight">
                What is Autism Spectrum Disorder?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Autism spectrum disorder (ASD) is a neurodevelopmental condition defined by persistent differences in social communication and interaction, accompanied by restricted or repetitive patterns of behavior.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                The signs of ASD are often visible in early childhood. With appropriate early intervention, children with ASD can lead productive and fulfilling lives. Early identification is key, and that&apos;s exactly what Bright Steps is designed to support.
              </p>
              <div className="space-y-3">
                {[
                  "Early detection significantly improves outcomes",
                  "Signs can appear as early as 6 months",
                  "Every child develops at their own pace",
                ].map((point, i) => (
                  <motion.div
                    key={point}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <motion.div whileHover={{ scale: 1.3, rotate: 10 }}>
                      <CheckCircle className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    </motion.div>
                    <span className="text-sm text-gray-700">{point}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div className="mt-8 inline-block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  onClick={() => router.push(isLoggedIn ? "/dashboard" : "/sign-up")}
                >
                  {isLoggedIn ? "Go to Dashboard" : "Start Free Screening"}
                </Button>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16">
            <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">Why Bright Steps</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Built for Families & Clinicians</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every feature is designed with one goal — earlier, clearer, and more accessible developmental support.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users,         title: "Made for Families",     desc: "Answer guided questions and record short home videos designed around everyday interactions.",   color: "bg-indigo-50 text-indigo-600"   },
              { icon: ClipboardList, title: "Structured Review",      desc: "Observations are organized into clear summaries that help support thoughtful decision-making.", color: "bg-violet-50 text-violet-600"   },
              { icon: Brain,         title: "Behavioral Insights",    desc: "Subtle developmental patterns are highlighted using Gemini AI to assist understanding over time.", color: "bg-fuchsia-50 text-fuchsia-600" },
              { icon: Shield,        title: "Clinically Responsible", desc: "Designed to assist professional judgment within a transparent and accountable workflow.",       color: "bg-emerald-50 text-emerald-600" },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <ScrollReveal key={title} variants={scaleIn} custom={i}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="h-full"
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl bg-white h-full">
                    <CardHeader className="pb-2">
                      <motion.div
                        className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-3`}
                        whileHover={{ rotate: 1, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Icon className="h-6 w-6" />
                      </motion.div>
                      <CardTitle className="text-base font-bold">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-500 leading-relaxed">{desc}</CardContent>
                  </Card>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative py-24 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/cta-banner.jpg')` }}
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          viewport={{ once: true }}
        />
        <div className="absolute inset-0 bg-indigo-900/80" />
        <div className="relative container mx-auto px-4 text-center text-white">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              Your child&apos;s development<br />deserves early attention.
            </h2>
          </ScrollReveal>
          <ScrollReveal variants={fadeUp} custom={1}>
            <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Start a free screening today. No clinical knowledge required — just your observations as a parent.
            </p>
          </ScrollReveal>
          <ScrollReveal variants={fadeUp} custom={2}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl px-8 font-bold"
                  onClick={() => router.push(isLoggedIn ? "/dashboard" : "/sign-up")}
                >
                  {isLoggedIn ? "Go to Dashboard" : "Begin Free Screening"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
              {!isLoggedIn && (
                <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 bg-white/5"
                    onClick={() => router.push("/sign-in")}
                  >
                    Sign In
                  </Button>
                </motion.div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <ScrollReveal className="text-center mb-16">
            <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">Questions</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Frequently Asked</h2>
          </ScrollReveal>

          <div className="space-y-4">
            {[
              { q: "Is this a medical diagnosis?",             a: "No. Bright Steps is a screening support tool designed to help families and clinicians identify potential developmental concerns early. It does not replace a formal clinical evaluation or diagnosis." },
              { q: "Who can use Bright Steps?",                a: "Parents and guardians of children aged 6 months to 5 years can complete screenings. Clinicians also have access to a dedicated dashboard to review and manage submitted cases." },
              { q: "How long does a screening take?",          a: "Most screenings take around 10–15 minutes to complete, including answering the questionnaire and optionally uploading a short video." },
              { q: "Is my child's data secure?",               a: "Yes. All data is encrypted and stored securely. Videos are stored on Cloudinary with controlled access, and your personal information is never shared without consent." },
              { q: "What happens after I submit a screening?", a: "A risk assessment is generated immediately using AI. If your account is connected to a clinical team, a clinician will review the case and follow up with recommendations." },
            ].map(({ q, a }, i) => (
              <ScrollReveal key={i} variants={fadeUp} custom={i * 0.5}>
                <motion.details
                  className="group border border-gray-100 rounded-2xl bg-gray-50 open:bg-white open:shadow-sm transition-all"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-800 text-sm list-none">
                    {q}
                    <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90 flex-shrink-0 ml-3" />
                  </summary>
                  <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{a}</p>
                </motion.details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-14 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <ScrollReveal variants={slideLeft} className="md:col-span-2">
              <motion.div
                className="flex items-center gap-2.5 mb-4"
                whileHover={{ x: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-extrabold text-white">
                  Bright <span className="text-indigo-400">Steps</span>
                </span>
              </motion.div>
              <p className="text-sm leading-relaxed max-w-xs">
                Supporting early developmental clarity through thoughtful, AI-assisted technology for families and clinicians.
              </p>
            </ScrollReveal>

            <ScrollReveal variants={fadeUp} custom={1}>
              <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                {["How It Works", "About ASD", "Features", "FAQ"].map((l, i) => (
                  <motion.li key={l} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                    <a href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="hover:text-indigo-400 transition-colors">{l}</a>
                  </motion.li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal variants={fadeUp} custom={2}>
              <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                {isLoggedIn ? (
                  <li>
                    <button onClick={() => router.push("/dashboard")} className="hover:text-indigo-400 transition-colors text-left">Dashboard</button>
                  </li>
                ) : (
                  <>
                    <motion.li whileHover={{ x: 4 }}><button onClick={() => router.push("/sign-in")} className="hover:text-indigo-400 transition-colors text-left">Sign In</button></motion.li>
                    <motion.li whileHover={{ x: 4 }}><button onClick={() => router.push("/sign-up")} className="hover:text-indigo-400 transition-colors text-left">Sign Up</button></motion.li>
                  </>
                )}
              </ul>
            </ScrollReveal>
          </div>

          <motion.div
            className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p>© 2026 Bright Steps. All rights reserved.</p>
            <p className="text-slate-500">Not a diagnostic tool. Always consult a qualified healthcare professional.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}