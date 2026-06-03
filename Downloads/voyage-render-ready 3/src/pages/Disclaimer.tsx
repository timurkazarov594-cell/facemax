import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-foreground">
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
            <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">AI Disclaimer</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-12 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0 mt-1">
              <Bot className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-serif text-white mb-2">AI Disclaimer</h1>
              <p className="text-sm text-muted-foreground/60">Последнее обновление: 22 мая 2025 г.</p>
            </div>
          </div>

          <div className="mb-8 flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/80 leading-relaxed">
              Voyage использует искусственный интеллект для генерации туристических маршрутов. Все рекомендации создаются автоматически и могут содержать неточности. Пожалуйста, самостоятельно проверяйте все данные перед бронированием.
            </p>
          </div>

          <div className="prose-voyage space-y-10 text-muted-foreground/80 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-serif text-white mb-3">1. Как работает Voyage AI</h2>
              <p>
                Voyage — это сервис планирования путешествий на основе искусственного интеллекта (AI). Наш сервис использует
                модели большого языка (LLM) для генерации персонализированных маршрутов, рекомендаций отелей, ресторанов
                и планов активностей на основе ваших предпочтений.
              </p>
              <p className="mt-3">
                Все рекомендации создаются автоматически алгоритмами AI и не представляют собой профессиональные туристические
                консультации, агентские услуги или гарантированные предложения.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">2. Ограничения AI-рекомендаций</h2>
              <p>Пожалуйста, учитывайте, что AI-генерированный контент может содержать:</p>
              <ul className="mt-3 ml-4 space-y-2 list-none">
                {[
                  'Неточности или устаревшую информацию о ценах, наличии мест и условиях бронирования.',
                  'Несуществующие или временно недоступные отели и рестораны.',
                  'Неверные сведения о визовых требованиях, правилах въезда и местных законах.',
                  'Ошибки в расчёте стоимости, не учитывающие сезонность и актуальные курсы валют.',
                  'Неполную информацию о доступности транспорта и маршрутах.',
                  'Некоторые направления могут быть временно недоступны или находиться в стадии тестирования.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400/60 mt-0.5 flex-shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">3. Ваша ответственность</h2>
              <p>Перед бронированием вы обязаны самостоятельно проверить:</p>
              <ul className="mt-3 ml-4 space-y-2 list-none">
                {[
                  'Актуальные цены и наличие номеров на официальных сайтах отелей.',
                  'Наличие и стоимость авиабилетов на сайтах авиакомпаний или агрегаторов.',
                  'Визовые требования и правила въезда в страну назначения.',
                  'Актуальные курсы валют и методы оплаты.',
                  'Страховые требования и условия отмены бронирования.',
                  'Текущую обстановку безопасности и официальные рекомендации для путешествий.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5 flex-shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">4. Voyage AI — не туристическое агентство</h2>
              <p>
                Voyage AI не является туристическим агентством, туроператором или посредником по бронированию. Мы не
                продаём авиабилеты, не бронируем отели и не организуем туры. Все ссылки на внешние сайты бронирования
                (Hotellook, Booking.com, Google Hotels и другие) предоставляются исключительно для вашего удобства.
              </p>
              <p className="mt-3">
                Мы не несём ответственности за действия, условия или политики третьих сторон, на сайты которых ведут
                наши ссылки.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">5. Отсутствие гарантий бронирования</h2>
              <p>
                Voyage AI не гарантирует доступность отелей, ресторанов или активностей, указанных в маршруте. Наличие
                свободных мест, актуальные цены и условия бронирования определяются исключительно соответствующими
                поставщиками услуг.
              </p>
              <p className="mt-3">
                Мы не можем обеспечить точное соответствие AI-рекомендаций реальным доступным предложениям на момент
                вашего путешествия.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">6. Оплата и доступ к сервису</h2>
              <p>
                Оплата подписки Voyage Premium предоставляет доступ к функции AI-планирования маршрутов. Это плата за
                использование технологии, а не за конкретные туристические результаты или гарантированные бронирования.
              </p>
              <p className="mt-3">
                Подробная информация об условиях оплаты и возврата средств изложена в разделе «Политика возврата»
                нашего Пользовательского соглашения.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">7. Ограничение ответственности</h2>
              <p>
                В максимально допустимых законом пределах Voyage AI не несёт ответственности за любые убытки, прямые
                или косвенные, возникшие в результате использования AI-рекомендаций, включая, но не ограничиваясь:
                стоимостью несостоявшихся бронирований, расходами на изменение планов, ущербом от неверных сведений
                о визовых требованиях или обстановке безопасности.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-serif text-white mb-3">8. Контакты</h2>
              <p>
                Если у вас есть вопросы по данному Disclaimer или вы обнаружили существенную ошибку в сгенерированном
                маршруте, пожалуйста, свяжитесь с нами по адресу:{' '}
                <a href="mailto:voyagetrip.ai@mail.ru" className="text-primary/70 hover:text-primary transition-colors">
                  voyagetrip.ai@mail.ru
                </a>
              </p>
            </section>

          </div>

          <div className="mt-16 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/30">© 2025 Voyage AI. Все права защищены.</p>
            <div className="flex items-center gap-5">
              <a href="/terms" className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors">
                Пользовательское соглашение
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
