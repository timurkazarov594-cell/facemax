import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout';
import { destinations } from '@/lib/mock-data';
import { useT } from '@/lib/i18n';

export default function Home() {
  const t = useT();

  return (
    <Layout>
      <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="w-full h-full"
          >
            <img 
              src={destinations[1].image} 
              alt="Cinematic Background" 
              className="w-full h-full object-cover"
              data-testid="img-hero-background"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center mt-20">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-primary text-sm tracking-[0.3em] uppercase mb-6 block font-medium">
              {t("home.tagline")}
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-serif max-w-5xl leading-[1.1] mb-8"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            data-testid="text-hero-title"
          >
            {t("home.title.1")}<br />
            <span className="text-muted-foreground italic">{t("home.title.2")}</span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 font-light leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
          >
            {t("home.description")}
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 1.1, ease: "easeOut" }}
          >
            <Link href="/plan" data-testid="link-hero-cta">
              <button className="bg-primary text-primary-foreground px-10 py-5 rounded-full uppercase tracking-widest text-sm font-semibold hover:bg-primary/90 transition-colors duration-300 hover:shadow-[0_0_40px_-10px_rgba(212,175,55,0.5)]">
                {t("home.cta")}
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
