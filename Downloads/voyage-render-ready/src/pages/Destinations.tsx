import React from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout';
import { destinations } from '@/lib/mock-data';
import { useT } from '@/lib/i18n';

export default function Destinations() {
  const t = useT();

  return (
    <Layout>
      <div className="min-h-screen pt-32 pb-24 px-6 container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-serif mb-6 text-primary">{t("dest.title")}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light leading-relaxed">
            {t("dest.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest, idx) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="group cursor-pointer"
              data-testid={`card-dest-${dest.id}`}
            >
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-6 border border-border group-hover:border-primary/30 transition-colors">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute bottom-0 left-0 p-6 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-primary text-xs uppercase tracking-widest font-semibold mb-2 block">
                    {dest.country}
                  </span>
                  <h2 className="text-3xl font-serif mb-2 text-foreground">{dest.name}</h2>
                  <p className="text-sm text-muted-foreground font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {dest.tagline}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
