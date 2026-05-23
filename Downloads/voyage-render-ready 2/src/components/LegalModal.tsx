import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, FileText, Shield, Bot } from 'lucide-react';
import type { LegalSection } from '@/lib/legal-modal-context';

interface Props {
  open: boolean;
  section: LegalSection;
  onSectionChange: (s: LegalSection) => void;
  onClose: () => void;
}

const TABS: { id: LegalSection; label: string; icon: React.ElementType }[] = [
  { id: 'rules',      label: 'Правила',          icon: BookOpen },
  { id: 'terms',      label: 'Соглашение',        icon: FileText },
  { id: 'privacy',    label: 'Конфиденц.',        icon: Shield   },
  { id: 'disclaimer', label: 'AI Disclaimer',     icon: Bot      },
];

function RulesContent() {
  const items = [
    'Voyage AI генерирует маршруты с помощью искусственного интеллекта.',
    'Результаты AI могут быть неточными или содержать устаревшие данные.',
    'Цены, отели и наличие мест могут изменяться без предупреждения.',
    'Пользователь обязан самостоятельно проверить все данные перед бронированием.',
    'Voyage AI не несёт ответственности за расходы пользователя на путешествие или за сторонние сайты.',
    'Оплата предназначена для получения доступа к сервису AI-планирования, а не для получения гарантированного результата путешествия.',
    'Возврат средств после генерации маршрута не гарантируется. Запросы рассматриваются индивидуально.',
  ];
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-5">Правила использования сервиса</p>
      {items.map((rule, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/12 border border-primary/20 flex items-center justify-center mt-0.5">
            <span className="text-primary/70 text-[10px] font-mono font-bold">{i + 1}</span>
          </div>
          <p className="text-sm text-foreground/75 leading-relaxed">{rule}</p>
        </div>
      ))}
    </div>
  );
}

function TermsContent() {
  const sections = [
    {
      title: '1. Что такое Voyage AI',
      body: 'Voyage AI — это сервис планирования путешествий на основе искусственного интеллекта. Сервис использует модели большого языка (LLM) для автоматической генерации персонализированных маршрутов, рекомендаций отелей, ресторанов и активностей. Voyage AI не является туристическим агентством, туроператором или посредником по бронированию.',
    },
    {
      title: '2. Ограничения AI-контента',
      body: 'Все маршруты и рекомендации создаются автоматически и могут содержать неточности, устаревшие данные или несуществующие объекты. Voyage AI не гарантирует точность цен, доступность отелей, маршруты рейсов, актуальность визовых требований или безопасность рекомендованных направлений.',
    },
    {
      title: '3. Ваша ответственность',
      body: 'Перед бронированием вы обязаны самостоятельно проверить: актуальные цены на официальных сайтах, наличие номеров, визовые требования и правила въезда в страну назначения, условия страхования и отмены бронирования, текущую обстановку безопасности.',
    },
    {
      title: '4. Оплата и возврат средств',
      body: 'Оплата подписки предоставляет доступ к AI-сервису планирования путешествий — это плата за использование технологии, а не за конкретный туристический результат или гарантированное бронирование. После генерации маршрута возврат средств не гарантируется. Запросы на возврат рассматриваются индивидуально в течение 14 дней с момента оплаты. Обращайтесь: voyagetrip.ai@mail.ru',
    },
    {
      title: '5. Ограничение ответственности',
      body: 'Voyage AI не несёт ответственности за ваши расходы на путешествие, действия сторонних сайтов и сервисов бронирования, ущерб, возникший в результате использования AI-рекомендаций, изменения цен или доступности после генерации маршрута.',
    },
  ];
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-5">Пользовательское соглашение</p>
      {sections.map((s) => (
        <div key={s.title}>
          <h4 className="text-sm font-medium text-white/80 mb-1.5">{s.title}</h4>
          <p className="text-sm text-foreground/65 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function PrivacyContent() {
  const sections = [
    {
      title: '1. Какие данные мы собираем',
      body: 'Имя пользователя (логин), зашифрованный пароль, история сохранённых маршрутов, параметры поиска (направление, даты, предпочтения). Мы не собираем и не храним платёжные данные — оплата обрабатывается внешним сервисом.',
    },
    {
      title: '2. Как используются данные',
      body: 'Данные используются для предоставления и улучшения сервиса AI-планирования. Параметры поиска могут применяться в обезличенном виде для улучшения качества AI-рекомендаций.',
    },
    {
      title: '3. Передача третьим лицам',
      body: 'Мы не передаём ваши личные данные третьим лицам без вашего согласия. Voyage AI использует сторонние технологии: AI-провайдеры для генерации маршрутов, партнёрские сервисы бронирования (Travelpayouts, Hotellook, Booking.com) — только в виде исходящих ссылок.',
    },
    {
      title: '4. Безопасность',
      body: 'Пароли хранятся в зашифрованном виде. Данные хранятся на защищённых серверах. Мы не гарантируем абсолютную защиту от несанкционированного доступа, однако принимаем все разумные меры безопасности.',
    },
    {
      title: '5. Ваши права',
      body: 'Вы можете запросить удаление своего аккаунта и связанных данных. Для этого напишите на: voyagetrip.ai@mail.ru',
    },
  ];
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-5">Политика конфиденциальности</p>
      {sections.map((s) => (
        <div key={s.title}>
          <h4 className="text-sm font-medium text-white/80 mb-1.5">{s.title}</h4>
          <p className="text-sm text-foreground/65 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function DisclaimerContent() {
  const sections = [
    {
      title: '1. Как работает Voyage AI',
      body: 'Voyage AI использует модели большого языка (LLM) для автоматической генерации туристических маршрутов на основе ваших предпочтений. Все рекомендации создаются алгоритмически — без ручной проверки актуальности каждого пункта.',
    },
    {
      title: '2. Что не гарантируется',
      body: 'Точные цены на отели, авиабилеты и активности. Наличие свободных номеров в указанных отелях. Актуальность визовых требований и правил въезда. Маршруты рейсов и расписания. Безопасность рекомендованных направлений. Существование конкретных ресторанов или объектов.',
    },
    {
      title: '3. Данные могут устареть',
      body: 'AI-модели обучены на данных определённого периода. Информация об отелях, ценах, ресторанах и достопримечательностях может не соответствовать реальности на момент вашего путешествия.',
    },
    {
      title: '4. Обязательная самостоятельная проверка',
      body: 'Перед бронированием проверьте: цены на официальных сайтах отелей и авиакомпаний, наличие мест, визовые требования на сайте посольства, актуальные курсы валют, страховые требования, текущую ситуацию безопасности.',
    },
    {
      title: '5. Ограничение ответственности',
      body: 'В максимально допустимых законом пределах Voyage AI не несёт ответственности за убытки, возникшие вследствие использования AI-рекомендаций, включая стоимость несостоявшихся бронирований, расходы на изменение планов или ущерб от неверных сведений.',
    },
  ];
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-5">AI Disclaimer — отказ от ответственности</p>
      {sections.map((s) => (
        <div key={s.title}>
          <h4 className="text-sm font-medium text-white/80 mb-1.5">{s.title}</h4>
          <p className="text-sm text-foreground/65 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

export function LegalModal({ open, section, onSectionChange, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative z-10 w-full max-w-lg bg-neutral-950 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: 'min(90dvh, 680px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
              <span className="font-serif text-base text-white tracking-wide">Правовая информация</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-white hover:bg-white/8 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 py-3 border-b border-white/6 flex-shrink-0 overflow-x-auto scrollbar-none">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onSectionChange(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    section === id
                      ? 'bg-primary/15 border border-primary/30 text-primary'
                      : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {section === 'rules'      && <RulesContent />}
                  {section === 'terms'      && <TermsContent />}
                  {section === 'privacy'    && <PrivacyContent />}
                  {section === 'disclaimer' && <DisclaimerContent />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/6 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Понятно, закрыть
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
