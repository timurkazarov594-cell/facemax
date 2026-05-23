import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Terms() {
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
            <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">Пользовательское соглашение</span>
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
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-serif text-white mb-2">Пользовательское соглашение</h1>
              <p className="text-sm text-muted-foreground/60">Последнее обновление: 22 мая 2025 г.</p>
            </div>
          </div>

          <div className="prose-voyage space-y-10 text-muted-foreground/80 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-serif text-white mb-3">1. Общие положения</h2>
              <p>
                Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между сервисом
                Voyage (далее — «Сервис», «мы») и пользователями (далее — «Пользователь», «вы») при использовании
                платформы AI Travel Concierge, доступной по адресу соответствующего домена.
              </p>
              <p className="mt-3">
                Регистрируясь или используя Сервис, вы подтверждаете, что прочитали, поняли и согласны с
                условиями настоящего Соглашения. Если вы не согласны с условиями, пожалуйста, не используйте Сервис.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">2. Описание Сервиса</h2>
              <p>
                Voyage — это платформа на основе искусственного интеллекта, предоставляющая персонализированные
                рекомендации по планированию путешествий, подбору отелей, ресторанов и маршрутов. Все рекомендации
                носят информационный характер и формируются автоматически.
              </p>
              <p className="mt-3">
                Сервис предоставляет ссылки на сторонние сайты бронирования (Hotellook, Booking.com, Google Hotels
                и другие). Мы не являемся агентом по продаже билетов или туристическим оператором и не несём
                ответственности за конечную стоимость, наличие мест или условия, предоставляемые третьими сторонами.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">3. Регистрация и аккаунт</h2>
              <p>
                Для доступа к функции сохранения поездок требуется регистрация. Вы обязуетесь:
              </p>
              <ul className="mt-3 ml-4 space-y-2 list-none">
                {[
                  'Предоставлять точные и актуальные данные при регистрации.',
                  'Сохранять конфиденциальность вашего пароля.',
                  'Незамедлительно уведомлять нас о несанкционированном доступе к вашему аккаунту.',
                  'Нести ответственность за все действия, совершённые под вашим аккаунтом.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5 flex-shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">4. Ограничения использования</h2>
              <p>Вам запрещается:</p>
              <ul className="mt-3 ml-4 space-y-2 list-none">
                {[
                  'Использовать Сервис в незаконных целях.',
                  'Пытаться получить несанкционированный доступ к системам Сервиса.',
                  'Создавать множество аккаунтов для обхода ограничений.',
                  'Копировать, воспроизводить или перепродавать контент Сервиса без разрешения.',
                  'Использовать Сервис для рассылки спама или иных нежелательных сообщений.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5 flex-shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">5. Интеллектуальная собственность</h2>
              <p>
                Все материалы Сервиса, включая логотипы, дизайн, тексты и программный код, являются собственностью
                Voyage и защищены законодательством об интеллектуальной собственности. Вы не вправе использовать
                материалы Сервиса без нашего письменного согласия.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">6. Точность информации</h2>
              <p>
                Маршруты, цены, описания отелей и ресторанов генерируются с помощью технологии искусственного
                интеллекта и предоставляются исключительно в информационных целях. Мы не гарантируем точность,
                полноту или актуальность предоставляемой информации.
              </p>
              <p className="mt-3">
                Перед принятием решений о бронировании рекомендуем самостоятельно проверять актуальность данных
                на официальных сайтах отелей и туристических операторов.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">7. Контент, сгенерированный AI</h2>
              <p>
                Все маршруты, рекомендации отелей, ресторанов и активностей создаются автоматически с использованием
                технологий искусственного интеллекта. Такие рекомендации носят исключительно информационный характер и
                могут содержать неточности, устаревшие данные или недоступные предложения.
              </p>
              <ul className="mt-3 ml-4 space-y-2 list-none">
                {[
                  'Цены являются приблизительными и могут изменяться.',
                  'Отели и рестораны могут быть недоступны в указанные даты.',
                  'Voyage AI не является туристическим агентством и не несёт ответственности за изменения у сторонних поставщиков.',
                  'Пользователь обязан самостоятельно проверить все данные перед бронированием.',
                  'Некоторые направления могут быть временно недоступны или находиться в стадии тестирования.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5 flex-shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">8. Политика возврата средств</h2>
              <p>
                Оплата предоставляется за доступ к AI-сервису планирования путешествий. После генерации маршрута
                возврат средств не гарантируется. Запросы на возврат рассматриваются индивидуально.
              </p>
              <p className="mt-3">
                Для подачи запроса на возврат свяжитесь с нами по адресу{' '}
                <a href="mailto:voyagetrip.ai@mail.ru" className="text-primary/70 hover:text-primary transition-colors">
                  voyagetrip.ai@mail.ru
                </a>{' '}
                в течение 14 дней с момента оплаты. Запросы, поданные после этого срока, рассматриваются в
                исключительных случаях.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">9. Ограничение ответственности</h2>
              <p>
                Сервис предоставляется «как есть». В максимально допустимых законом пределах мы не несём
                ответственности за прямые, косвенные, случайные или иные убытки, возникшие в результате
                использования Сервиса, включая убытки, связанные с бронированием у третьих сторон.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">10. Изменение условий</h2>
              <p>
                Мы оставляем за собой право изменять настоящее Соглашение в любое время. Об существенных
                изменениях мы уведомим пользователей. Продолжение использования Сервиса после публикации
                изменений означает ваше согласие с обновлёнными условиями.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">11. Применимое право</h2>
              <p>
                Настоящее Соглашение регулируется применимым законодательством. Все споры, возникающие в связи
                с использованием Сервиса, подлежат урегулированию в претензионном порядке.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">12. Контакты</h2>
              <p>
                По вопросам, связанным с настоящим Соглашением, вы можете обратиться к нам через форму обратной
                связи в приложении или написать на почту, указанную на главной странице Сервиса.
              </p>
            </section>

          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/30">© 2025 Voyage AI. Все права защищены.</p>
            <div className="flex items-center gap-5">
              <a href="/disclaimer" className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors">
                AI Disclaimer
              </a>
              <a href="/privacy" className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors">
                Политика конфиденциальности
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
