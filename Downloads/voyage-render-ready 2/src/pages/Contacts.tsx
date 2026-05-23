import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, User, Building2, Briefcase, CreditCard } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function legalHref(path: string) {
  return `${BASE}${path}`;
}

export default function Contacts() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = BASE || '/';
    }
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-white/8 transition-colors text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif tracking-[0.3em] text-primary text-sm">VOYAGE</span>
            <span className="text-muted-foreground/30 text-sm">·</span>
            <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">Контакты и реквизиты</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Hero */}
          <div className="mb-12">
            <p className="font-serif tracking-[0.4em] text-primary text-2xl mb-3">VOYAGE AI</p>
            <p className="text-muted-foreground/60 text-sm max-w-lg leading-relaxed">
              Цифровой AI-сервис по подбору путешествий, маршрутов и отелей.
            </p>
          </div>

          <div className="space-y-10">

            {/* ── Контакты ── */}
            <section>
              <h2 className="text-lg font-serif text-white mb-5 flex items-center gap-2">
                <span className="w-6 h-px bg-primary/50 inline-block" />
                Контакты
              </h2>
              <a
                href="mailto:voyagetrip.ai@mail.ru"
                className="block"
              >
                <div className="flex items-center gap-4 py-4 px-5 bg-neutral-900/60 border border-white/8 rounded-2xl hover:border-primary/30 transition-colors group">
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground/40 uppercase tracking-wider mb-0.5">Электронная почта</p>
                    <p className="text-base text-white group-hover:text-primary/90 transition-colors font-medium">
                      voyagetrip.ai@mail.ru
                    </p>
                  </div>
                  <span className="text-primary/30 group-hover:text-primary/60 transition-colors text-sm">↗</span>
                </div>
              </a>
            </section>

            {/* ── Реквизиты ── */}
            <section>
              <h2 className="text-lg font-serif text-white mb-5 flex items-center gap-2">
                <span className="w-6 h-px bg-primary/50 inline-block" />
                Реквизиты
              </h2>
              <div className="bg-neutral-900/60 border border-white/8 rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  <ReqRow
                    icon={<User className="w-4 h-4" />}
                    label="ФИО владельца"
                    value="Кажарова Эрика Рустамовна"
                  />
                  <ReqRow
                    icon={<CreditCard className="w-4 h-4" />}
                    label="ИНН"
                    value="772995067508"
                  />
                  <ReqRow
                    icon={<Briefcase className="w-4 h-4" />}
                    label="Статус"
                    value="Самозанятый"
                  />
                  <ReqRow
                    icon={<Building2 className="w-4 h-4" />}
                    label="Вид деятельности"
                    value="Информационные технологии / Цифровые сервисы"
                  />
                </div>
              </div>
            </section>

            {/* ── Поддержка пользователей ── */}
            <section>
              <h2 className="text-lg font-serif text-white mb-5 flex items-center gap-2">
                <span className="w-6 h-px bg-primary/50 inline-block" />
                Поддержка пользователей
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground/70 leading-relaxed">
                <p>
                  Если у вас возникли вопросы, проблемы с аккаунтом или пожелания по улучшению
                  сервиса — напишите нам. Мы стараемся отвечать в течение{' '}
                  <span className="text-white/70">24 часов</span>.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { title: 'Технические вопросы', desc: 'Ошибки, сбои в работе приложения' },
                    { title: 'Вопросы по аккаунту', desc: 'Сброс пароля, удаление данных' },
                    { title: 'Предложения', desc: 'Идеи для новых функций' },
                    { title: 'Партнёрство', desc: 'Сотрудничество и интеграции' },
                  ].map((item) => (
                    <a
                      key={item.title}
                      href="mailto:voyagetrip.ai@mail.ru"
                      className="block bg-neutral-900/40 border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-colors group"
                    >
                      <p className="text-white/80 font-medium text-sm mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground/50 mb-2">{item.desc}</p>
                      <p className="text-xs text-primary/60 group-hover:text-primary/80 transition-colors">
                        voyagetrip.ai@mail.ru
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-xs text-muted-foreground/30">© 2025 Voyage AI. Все права защищены.</p>
              <div className="flex items-center gap-5">
                <a href={legalHref('/terms')} className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors">
                  Пользовательское соглашение
                </a>
                <a href={legalHref('/privacy')} className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors">
                  Политика конфиденциальности
                </a>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

function ReqRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <span className="text-primary/50 flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
        <span className="text-xs text-muted-foreground/50 flex-shrink-0 uppercase tracking-wider">{label}</span>
        <span className="text-sm text-white/85 sm:text-right font-medium">{value}</span>
      </div>
    </div>
  );
}
