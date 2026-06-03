import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';

export default function Privacy() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
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
            <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">Политика конфиденциальности</span>
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
          <div className="mb-12 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0 mt-1">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-serif text-white mb-2">Политика конфиденциальности</h1>
              <p className="text-sm text-muted-foreground/60">Последнее обновление: 22 мая 2025 г.</p>
            </div>
          </div>

          <div className="space-y-10 text-muted-foreground/80 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-serif text-white mb-3">1. Введение</h2>
              <p>
                Voyage («мы», «нас», «наш») уважает вашу конфиденциальность и стремится защищать ваши персональные
                данные. Настоящая Политика конфиденциальности описывает, какие данные мы собираем, как мы их
                используем и какие права у вас есть в отношении ваших данных.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">2. Какие данные мы собираем</h2>

              <h3 className="text-base font-medium text-white/80 mb-2 mt-4">2.1 Данные аккаунта</h3>
              <p>При регистрации мы собираем:</p>
              <ul className="mt-2 ml-4 space-y-1.5 list-none">
                {[
                  'Имя пользователя (псевдоним, не требуется настоящее имя).',
                  'Хэш пароля (пароль никогда не хранится в открытом виде).',
                  'Дата и время регистрации.',
                  'Временная метка принятия условий использования.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5 flex-shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-base font-medium text-white/80 mb-2 mt-4">2.2 Данные о поездках</h3>
              <p>
                Если вы используете функцию сохранения поездок, мы сохраняем сгенерированные планы путешествий,
                включая место назначения, даты, отель и маршрут. Эти данные привязаны к вашему аккаунту.
              </p>

              <h3 className="text-base font-medium text-white/80 mb-2 mt-4">2.3 Данные запросов</h3>
              <p>
                При генерации плана путешествия мы передаём ваши параметры (направление, бюджет, предпочтения)
                в API OpenAI для формирования рекомендаций. Мы не передаём OpenAI данные вашего аккаунта.
              </p>

              <h3 className="text-base font-medium text-white/80 mb-2 mt-4">2.4 Технические данные</h3>
              <p>
                Как и большинство веб-сервисов, мы автоматически обрабатываем технические данные запросов
                (IP-адрес в логах сервера, тип браузера). Эти данные используются исключительно для обеспечения
                работы и безопасности Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">3. Как мы используем ваши данные</h2>
              <ul className="mt-2 ml-4 space-y-2 list-none">
                {[
                  'Для предоставления функций Сервиса (сохранение поездок, персонализация).',
                  'Для генерации рекомендаций по путешествиям с помощью ИИ.',
                  'Для защиты аккаунтов и предотвращения мошенничества.',
                  'Для улучшения работы Сервиса.',
                  'Мы НЕ продаём ваши данные третьим лицам.',
                  'Мы НЕ используем ваши данные для показа рекламы.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 flex-shrink-0 ${item.startsWith('Мы НЕ') ? 'text-green-400/70' : 'text-primary/60'}`}>—</span>
                    <span className={item.startsWith('Мы НЕ') ? 'text-white/70' : ''}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">4. Сторонние сервисы</h2>

              <div className="space-y-4 mt-2">
                {[
                  {
                    name: 'OpenAI',
                    desc: 'Используется для генерации планов путешествий. Мы передаём только параметры запроса (направление, бюджет, предпочтения). Политика конфиденциальности OpenAI: openai.com/privacy',
                  },
                  {
                    name: 'Hotellook / Travelpayouts',
                    desc: 'Партнёрская программа для подбора отелей. При переходе по ссылкам бронирования применяется политика конфиденциальности соответствующего партнёра.',
                  },
                  {
                    name: 'Wikipedia',
                    desc: 'Используется для получения фотографий отелей. Запросы к Wikipedia API анонимны.',
                  },
                ].map((service) => (
                  <div key={service.name} className="pl-4 border-l border-primary/20">
                    <p className="text-white/80 font-medium mb-1">{service.name}</p>
                    <p className="text-muted-foreground/70 text-xs">{service.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">5. Хранение данных</h2>
              <p>
                Данные вашего аккаунта хранятся на защищённых серверах. Пароли хранятся исключительно в виде
                хэша (bcrypt) и не могут быть восстановлены. Сессионные токены хранятся в зашифрованном
                виде в браузере (localStorage/cookies).
              </p>
              <p className="mt-3">
                Мы храним ваши данные, пока ваш аккаунт активен. При удалении аккаунта все связанные данные
                удаляются в течение 30 дней.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">6. Ваши права</h2>
              <p>Вы имеете право:</p>
              <ul className="mt-2 ml-4 space-y-2 list-none">
                {[
                  'Запросить доступ к вашим персональным данным.',
                  'Исправить неточные данные.',
                  'Запросить удаление вашего аккаунта и всех связанных данных.',
                  'Возразить против определённых видов обработки данных.',
                  'Получить копию ваших данных в машиночитаемом формате.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5 flex-shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">7. Cookies и локальное хранилище</h2>
              <p>
                Мы используем cookies для управления пользовательской сессией (обеспечения входа в систему).
                Сессионный токен также сохраняется в localStorage браузера для удобства. Мы не используем
                маркетинговые или аналитические cookies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">8. Несовершеннолетние</h2>
              <p>
                Сервис не предназначен для лиц младше 16 лет. Мы не собираем намеренно персональные данные
                несовершеннолетних. Если вы считаете, что ребёнок предоставил нам свои данные, пожалуйста,
                свяжитесь с нами для их удаления.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">9. Изменения политики</h2>
              <p>
                Мы можем обновлять настоящую Политику конфиденциальности. При существенных изменениях мы
                уведомим пользователей. Дата последнего обновления указана в начале документа.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">10. Контакты</h2>
              <p>
                По вопросам конфиденциальности или для реализации ваших прав обращайтесь через форму
                обратной связи в приложении или по контактным данным, указанным на главной странице.
              </p>
            </section>

          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/30">© 2025 Voyage AI. Все права защищены.</p>
            <div className="flex items-center gap-5">
              <a href="/terms" className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors">
                Пользовательское соглашение
              </a>
              <a href="/contacts" className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors">
                Контакты
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
