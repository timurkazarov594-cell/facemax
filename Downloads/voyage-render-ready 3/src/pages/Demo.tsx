import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Star, CheckCircle, ArrowRight, Mail } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  );
}

const SAMPLE_DAYS = [
  {
    day: 1,
    title: 'Прибытие и первые впечатления',
    morning: 'Трансфер из аэропорта, check-in в отель, лёгкий завтрак.',
    afternoon: 'Обзорная прогулка по старому городу, посещение главной площади.',
    evening: 'Ужин в ресторане с национальной кухней, прогулка вдоль набережной.',
  },
  {
    day: 2,
    title: 'Культура и гастрономия',
    morning: 'Посещение главного музея, экскурсия с гидом.',
    afternoon: 'Обед в bistro, шопинг на рынке, кофе с видом.',
    evening: 'Дегустационный ужин, джазовый клуб.',
  },
  {
    day: 3,
    title: 'Природа и активности',
    morning: 'Утренняя прогулка в парке, аренда велосипедов.',
    afternoon: 'Пикник с видом, посещение смотровой площадки.',
    evening: 'Прощальный ужин, закат на террасе.',
  },
];

const STEPS = [
  { n: '01', title: 'Выберите параметры', desc: 'Укажите направление, даты, бюджет, стиль путешествия и предпочтения по отелю.' },
  { n: '02', title: 'AI создаёт маршрут', desc: 'Наш ИИ за секунды генерирует персональный маршрут с отелем, ресторанами и активностями.' },
  { n: '03', title: 'Разблокируйте доступ', desc: 'Оплатите 499₽ один раз — и получите полный маршрут, бюджет и ссылки на бронирование.' },
  { n: '04', title: 'Путешествуйте', desc: 'Используйте готовый план, бронируйте напрямую через партнёров без наценок.' },
];

export default function Demo() {
  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-neutral-950/90 backdrop-blur border-b border-white/5">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href={`${BASE}/`}>
            <span className="font-serif tracking-[0.3em] text-primary text-base cursor-pointer">VOYAGE</span>
          </Link>
          <Link href={`${BASE}/`}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-xs font-medium uppercase tracking-widest hover:bg-primary/90 transition-colors">
              Войти
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-20">

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-16 pb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-widest mb-6">
            <Star className="w-3 h-3 fill-primary" />
            AI Travel Concierge
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight mb-4">
            Персональный маршрут<br />за секунды
          </h1>
          <p className="text-white/50 text-base max-w-xl mx-auto mb-8">
            Voyage — AI-консьерж, который создаёт детальный план путешествия под ваши вкусы, бюджет и стиль. Один раз — 499₽.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`${BASE}/`}>
              <button className="w-full sm:w-auto px-8 py-3.5 bg-primary text-black font-medium uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-colors">
                Попробовать — 499₽
              </button>
            </Link>
            <div className="flex items-center gap-2 text-white/30 text-xs uppercase tracking-widest">
              <CheckCircle className="w-3.5 h-3.5 text-primary/50" />
              Оплата один раз, без подписок
            </div>
          </div>
        </motion.section>

        {/* Pricing highlight */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-14"
        >
          <div className="bg-neutral-900/60 border border-white/8 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-muted-foreground/40 uppercase tracking-widest mb-1">Стоимость</p>
                <p className="text-5xl font-serif text-primary">499<span className="text-2xl">₽</span></p>
                <p className="text-xs text-white/30 mt-1">разовый платёж · без подписки</p>
              </div>
              <ul className="space-y-2 text-sm text-white/60">
                {[
                  'Полный маршрут по дням',
                  'Подбор отеля под бюджет',
                  'Рестораны и активности',
                  'Расчёт бюджета поездки',
                  'Ссылки на бронирование',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Sample itinerary */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-14"
        >
          <h2 className="text-xl font-serif text-white mb-2">Пример маршрута</h2>
          <p className="text-xs text-muted-foreground/40 uppercase tracking-widest mb-6">Барселона · 3 ночи · бюджет средний · отдых и культура</p>

          <div className="bg-neutral-900/50 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5 mb-4">
            {/* Meta row */}
            <div className="px-5 py-4 flex flex-wrap gap-4 text-xs text-white/40 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary/60" />Барселона, Испания</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary/60" />3 ночи</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary/60" />2 человека</span>
            </div>

            {/* Hotel */}
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground/40 uppercase tracking-widest mb-1">Отель</p>
              <p className="text-white/90 font-serif text-base">Hotel Arts Barcelona ★★★★★</p>
              <p className="text-white/40 text-sm mt-0.5">Люкс с видом на море · ~24 000₽/ночь</p>
            </div>

            {/* Day plan */}
            {SAMPLE_DAYS.map((d) => (
              <div key={d.day} className="px-5 py-4">
                <p className="text-xs text-primary/70 uppercase tracking-widest mb-1">День {d.day} — {d.title}</p>
                <div className="space-y-1 text-sm text-white/50">
                  <p><span className="text-white/25">Утро:</span> {d.morning}</p>
                  <p><span className="text-white/25">День:</span> {d.afternoon}</p>
                  <p><span className="text-white/25">Вечер:</span> {d.evening}</p>
                </div>
              </div>
            ))}

            {/* Budget */}
            <div className="px-5 py-4 bg-primary/3">
              <p className="text-xs text-muted-foreground/40 uppercase tracking-widest mb-2">Бюджет на двоих</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-white/50">
                <span>Отель (3 ночи)</span><span className="text-right text-white/70">72 000₽</span>
                <span>Питание</span><span className="text-right text-white/70">18 000₽</span>
                <span>Активности</span><span className="text-right text-white/70">9 000₽</span>
                <span>Транспорт</span><span className="text-right text-white/70">5 000₽</span>
                <span className="text-white/70 font-medium mt-1 border-t border-white/10 pt-1">Итого</span>
                <span className="text-right text-primary font-serif text-base mt-1 border-t border-white/10 pt-1">104 000₽</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/20 text-center">Это демо-пример. Реальный маршрут будет создан под ваши параметры.</p>
        </motion.section>

        {/* How it works */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-14"
        >
          <h2 className="text-xl font-serif text-white mb-6">Как это работает</h2>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 items-start bg-neutral-900/40 border border-white/6 rounded-xl px-5 py-4">
                <span className="font-serif text-primary/40 text-2xl leading-none shrink-0">{s.n}</span>
                <div>
                  <p className="text-white/90 font-medium text-sm mb-0.5">{s.title}</p>
                  <p className="text-white/40 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-14 text-center"
        >
          <div className="bg-neutral-900/60 border border-primary/15 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <p className="text-2xl font-serif text-white mb-2">Готовы к путешествию?</p>
            <p className="text-white/40 text-sm mb-6">Создайте аккаунт и получите полный маршрут за 499₽</p>
            <Link href={`${BASE}/`}>
              <button className="px-8 py-3.5 bg-primary text-black font-medium uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-colors">
                Начать — 499₽
              </button>
            </Link>
          </div>
        </motion.section>

        {/* Legal + Contacts */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-t border-white/5 pt-8 text-center space-y-3"
        >
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
            <LegalLink href="/legal/terms.pdf">Пользовательское соглашение</LegalLink>
            <LegalLink href="/legal/privacy.pdf">Политика конфиденциальности</LegalLink>
            <LegalLink href="/legal/oferta.pdf">Оферта</LegalLink>
          </div>
          <p className="text-white/20 text-xs flex items-center justify-center gap-1.5">
            <Mail className="w-3 h-3" />
            <a href="mailto:support@voyage.ai" className="hover:text-white/40 transition-colors">support@voyage.ai</a>
          </p>
          <p className="text-white/15 text-xs">
            © {new Date().getFullYear()} Voyage AI. Маршруты создаются AI и могут содержать неточности. Проверяйте данные перед бронированием.
          </p>
        </motion.section>

      </main>
    </div>
  );
}
