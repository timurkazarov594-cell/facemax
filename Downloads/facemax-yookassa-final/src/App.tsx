import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ScanFace, ChevronRight, AlertTriangle, Mail, Copy, Check, FileText, ShieldAlert, HeadphonesIcon, Info, Gauge, Lock, Sparkles, Crown } from 'lucide-react';
import { analyzeImage } from '@/lib/imageAnalysis';
import { generateAnalysis, AnalysisResult } from '@/lib/scoring';
import { preloadFaceDetector, validateFaceImage, FaceValidationErrorType } from '@/lib/faceDetector';
import { startPayment, checkPaymentStatus, unlockAfterPaymentSuccess } from '@/lib/payment';
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// ── Legal texts ───────────────────────────────────────────────────────────────
// To update: replace the string content inside the backticks.

const offerText = `ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ

Настоящее Пользовательское соглашение заключается между Администратором/Владельцем Сайта и любым лицом, предоставляющим свои персональные данные в формах обратной связи, размещённых на сайте (далее — «Пользователь»), вместе по тексту именуемые «Стороны».

В соответствии со статьёй 435 Гражданского кодекса РФ настоящее Пользовательское соглашение признаётся офертой. В соответствии со статьёй 438 Гражданского кодекса РФ безусловным принятием (акцептом) условий настоящего Пользовательского соглашения считается последовательное осуществление Пользователем следующих действий:
— ознакомление с условиями настоящего Пользовательского соглашения;
— внесение достоверных и актуальных сведений в формах обратной связи;
— проставление символа в специальном поле под заголовком «Согласен на обработку персональных данных» в форме обратной связи.

Настоящее Пользовательское соглашение, заключаемое путём акцепта настоящей оферты, не требует двустороннего подписания и действительно в электронном виде.


1. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ

1.1. Сайт — совокупность программ для электронных вычислительных машин и иной информации, содержащейся в информационной системе, доступ к которой обеспечивается посредством информационно-телекоммуникационной сети «Интернет» по доменным именам и (или) по сетевым адресам, позволяющим идентифицировать сайты в сети Интернет. Сайт расположен по адресу: https://voyageappai-bytk.replit.app/lookmax/

1.2. Администратор/Владелец Сайта — Шурдумова Тамара Анатольевна ИНН 072196538399
Юридический, почтовый и фактический адрес: г. Москва, Россия
Тел: +7 (929) 500-04-94
Электронный адрес: facemax1@mail.ru

1.3. Пользователь — пользователь Сайта, заключивший с Администратором/Владельцем Сайта Пользовательское соглашение путём акцепта оферты.


2. ПРЕДМЕТ ПОЛЬЗОВАТЕЛЬСКОГО СОГЛАШЕНИЯ

2.1. Настоящее Пользовательское соглашение является юридически обязательным соглашением между Пользователем и Администратором/Владельцем Сайта, предметом которого является предоставление Администратором/Владельцем Сайта Пользователю права использования Сайта и его сервисов.

2.2. Администратор/Владелец Сайта оказывает Пользователю услуги по предоставлению доступа к Сайту, при этом обязательным условием оказания услуг является принятие, соблюдение Пользователем и применение к отношениям Сторон требований и положений, определённых настоящим Пользовательским соглашением.

2.3. Администратор/Владелец Сайта оставляет за собой право изменять условия настоящего Пользовательского соглашения без согласования с Пользователем путём размещения на Сайте новой редакции. Новая редакция вступает в силу с момента опубликования на Сайте. Продолжение использования Сайта Пользователем после внесения изменений означает принятие и согласие Пользователя с такими изменениями.


3. ОБЩИЕ УСЛОВИЯ ПОЛЬЗОВАНИЯ САЙТОМ

3.1. Все права на Сайт в целом и на использование сетевого адреса (доменного имени) защищены в установленном законом порядке. Администратор/Владелец Сайта предоставляет доступ к Сайту всем заинтересованным лицам в соответствии с настоящим соглашением и действующим законодательством Российской Федерации.

3.2. Содержание Сайта не может быть скопировано, опубликовано, воспроизведено, передано или распространено любым способом без предварительного письменного согласия Администратора/Владельца Сайта.

3.3. Наименование Сайта, его содержание (в том числе материалы, информация, фотографии, иллюстрации, наименования, логотипы и т.д.) являются собственностью соответствующих правообладателей и защищены законодательством об авторском праве.


4. ПРАВА И ОБЯЗАННОСТИ АДМИНИСТРАТОРА/ВЛАДЕЛЬЦА САЙТА

4.1. Администратор/Владелец Сайта обязуется:
4.1.1. Оказывать Пользователю услуги, указанные в пункте 2.2 настоящего Пользовательского соглашения.

4.2. Администратор/Владелец Сайта имеет право:
4.2.1. Прекращать действие сервисов Сайта, менять условия их предоставления или ограничивать доступ к любым сервисам Сайта.
4.2.2. Распоряжаться статистической информацией, связанной с функционированием Сайта, а также информацией Пользователей для обеспечения адресного показа рекламной информации различным аудиториям Пользователей Сайта.


5. ПРАВА И ОБЯЗАННОСТИ ПОЛЬЗОВАТЕЛЯ

5.1. Пользователь обязуется:
5.1.1. Полностью ознакомиться с условиями настоящего Пользовательского соглашения до момента введения своих данных на Сайте.
5.1.2. Соблюдать все условия настоящего Пользовательского соглашения.

5.2. Пользователь согласен с тем, что, оставляя на Сайте свои данные путём заполнения полей формы обратной связи, он:
5.2.1. Выражает своё безоговорочное согласие со всеми условиями настоящего Пользовательского соглашения и обязуется их соблюдать или прекратить использование Сайта.
5.2.2. В целях реализации настоящего Пользовательского соглашения Пользователи дают Администратору/Владельцу Сайта разрешение на сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу, обезличивание, блокирование, удаление и уничтожение персональных данных тем способом и в той мере, в которой это необходимо для исполнения условий настоящего Пользовательского соглашения.


6. ПЕРСОНАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ

6.1. Персональные данные Пользователя обрабатываются Администратором/Владельцем Сайта в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».

6.2. Оставляя свои данные на Сайте путём заполнения полей формы обратной связи, Пользователь даёт согласие на обработку своих персональных данных в соответствии с законодательством Российской Федерации.

6.3. Администратор/Владелец Сайта принимает необходимые организационные и технические меры для защиты персональных данных Пользователей от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий третьих лиц.


7. ОТВЕТСТВЕННОСТЬ СТОРОН

7.1. Администратор/Владелец Сайта не несёт ответственности за качество интернет-соединения Пользователя, а также за любые технические неполадки, находящиеся вне зоны его контроля.

7.2. Администратор/Владелец Сайта не гарантирует точность результатов анализа внешности, поскольку сервис носит исключительно развлекательный характер.

7.3. Пользователь несёт ответственность за правомерность и корректность использования Сайта и его сервисов.


8. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ

8.1. Настоящее Пользовательское соглашение вступает в силу с момента начала использования Сайта Пользователем.

8.2. Во всём, что не предусмотрено настоящим Пользовательским соглашением, Стороны руководствуются действующим законодательством Российской Федерации.

8.3. Все разногласия между Сторонами, возникающие в связи с исполнением настоящего Пользовательского соглашения, разрешаются путём переговоров. При невозможности урегулировать споры путём переговоров, Стороны передают их на рассмотрение в суд по месту нахождения Администратора/Владельца Сайта.

Администратор/Владелец Сайта: Шурдумова Тамара Анатольевна
Электронный адрес: facemax1@mail.ru
Тел: +7 (929) 500-04-94`;

const disclaimerText = `ДИСКЛЕЙМЕР

FACEMAX является развлекательным AI-инструментом.
Анализ внешности не является объективной, научной или медицинской оценкой.

Результаты могут быть неточными, содержать ошибки или субъективные выводы.

Приложение не создано для оскорбления, унижения или причинения психологического вреда пользователям.

Пользователь самостоятельно принимает решения на основе полученной информации и несёт личную ответственность за интерпретацию результатов.

FACEMAX не гарантирует точность анализа и не несёт ответственности за любые последствия использования приложения.`;

const privacyText = `ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ FACEMAX

Последнее обновление: июнь 2025 г.

FACEMAX — это AI-инструмент для эстетического анализа внешности. Мы относимся к вашим данным с максимальным уважением.


1. КАКИЕ ДАННЫЕ МЫ ОБРАБАТЫВАЕМ

Вы добровольно загружаете фотографию лица для AI-анализа. Это единственные данные, которые обрабатываются сервисом.

Мы не запрашиваем: имя, email, телефон, геолокацию, платёжные данные (при использовании демо-режима).


2. КАК ИСПОЛЬЗУЮТСЯ ФОТОГРАФИИ

— Фотографии используются исключительно для проведения AI-анализа внешности внутри FACEMAX.
— Фотографии не публикуются в открытом доступе.
— Фотографии не продаются третьим лицам.
— Фотографии не передаются рекламным сетям, аналитическим платформам или иным внешним сервисам.
— Анализ проводится локально в браузере пользователя с помощью технологии MediaPipe.
— Фотографии могут автоматически удаляться по истечении сессии или через определённый период времени.


3. ХРАНЕНИЕ ДАННЫХ

Фотографии обрабатываются в оперативной памяти браузера и не сохраняются на серверах FACEMAX. Данные существуют только в рамках текущей сессии пользователя.


4. ОТВЕТСТВЕННОСТЬ ПОЛЬЗОВАТЕЛЯ

Пользователь самостоятельно принимает решение о загрузке изображения и несёт ответственность за:
— Наличие прав на загружаемые изображения.
— Загрузку фотографий исключительно лиц, давших согласие на анализ (включая самого пользователя).
— Соответствие загружаемых материалов действующему законодательству.

Загрузка фотографий третьих лиц без их согласия не допускается.


5. СОГЛАСИЕ

Загружая фотографию, вы подтверждаете:
— Добровольность предоставления изображения.
— Ознакомление с настоящей Политикой конфиденциальности.
— Согласие на обработку изображения в целях AI-анализа FACEMAX.

Вы можете отозвать согласие в любой момент, покинув сервис или обратившись по адресу: facemax1@mail.ru


6. КОНТАКТЫ

По вопросам обработки данных:
Электронный адрес: facemax1@mail.ru
Администратор: Шурдумова Тамара Анатольевна

FACEMAX обрабатывает данные в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».`;

const SUPPORT_EMAIL = 'facemax1@mail.ru';

// ── Doc Modal ────────────────────────────────────────────────────────────────
interface DocModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

function DocModal({ title, content, onClose }: DocModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(20, 0, 36, 0.92)',
            border: '1px solid rgba(168,85,247,0.25)',
            boxShadow: '0 0 60px rgba(168,85,247,0.15), 0 25px 50px rgba(0,0,0,0.6)',
          }}
        >
          {/* Glow top edge */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-500/15 shrink-0">
            <h2 className="text-lg font-bold font-syne tracking-wider text-white/90 uppercase">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 transition-all"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-purple-500/30">
            <pre
              className="text-sm text-purple-100/70 leading-relaxed font-sans"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {content}
            </pre>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-purple-500/15 shrink-0 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-purple-200/70 hover:text-white border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Support Popup ─────────────────────────────────────────────────────────────
interface SupportPopupProps {
  onClose: () => void;
}

function SupportPopup({ onClose }: SupportPopupProps) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        {/* Invisible backdrop */}
        <div className="absolute inset-0" />

        {/* Popup anchored bottom-right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-20 right-5"
          style={{
            width: '280px',
            background: 'rgba(18, 0, 32, 0.95)',
            border: '1px solid rgba(168,85,247,0.35)',
            borderRadius: '18px',
            boxShadow: '0 0 40px rgba(168,85,247,0.2), 0 15px 40px rgba(0,0,0,0.7)',
          }}
        >
          {/* Top glow */}
          <div className="absolute top-0 left-0 w-full h-px rounded-t-full bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <HeadphonesIcon className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-sm font-bold font-syne text-white/90 tracking-wide">Поддержка FACEMAX</span>
              </div>
              <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-3"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
            >
              <Mail className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-sm text-purple-200/90 font-medium flex-1 select-all">{SUPPORT_EMAIL}</span>
            </div>

            <button
              onClick={copyEmail}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(168,85,247,0.15)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(168,85,247,0.35)'}`,
                color: copied ? 'rgb(110,231,183)' : 'rgb(216,180,254)',
              }}
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" /> Скопировано</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Копировать email</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Paywall ───────────────────────────────────────────────────────────────────
// TEMP: Paywall before upload for YooKassa moderation
// Restore original flow after approval if needed
const PREMIUM_FEATURES = [
  'Facial Analysis',
  'Facial Harmony',
  'Aesthetics Score',
  'Facial Definition',
  'Archetype Detection',
  'Personalized Recommendations',
];

interface PaywallCardProps {
  onUnlock: () => void;
  isProcessing: boolean;
}

function PaywallCard({ onUnlock, isProcessing }: PaywallCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative my-6"
    >
      {/* Ambient conic glow */}
      <div
        className="absolute -inset-1.5 rounded-3xl blur-2xl opacity-30 pointer-events-none"
        style={{ background: 'conic-gradient(from 0deg, #7c3aed, #a855f7, #ec4899, #7c3aed)' }}
      />

      {/* Card */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(28,0,48,0.97) 0%, rgba(18,0,36,0.99) 100%)',
          border: '1px solid rgba(168,85,247,0.45)',
          boxShadow: '0 0 80px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Top gradient line */}
        <div
          className="absolute top-0 left-0 w-full h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), rgba(236,72,153,0.6), transparent)' }}
        />

        {/* Premium badge */}
        <div className="flex justify-center mb-5">
          <motion.span
            animate={{ boxShadow: ['0 0 12px rgba(168,85,247,0.25)', '0 0 22px rgba(168,85,247,0.5)', '0 0 12px rgba(168,85,247,0.25)'] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.15em] uppercase"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.2))',
              border: '1px solid rgba(168,85,247,0.5)',
              color: 'rgba(216,180,254,0.95)',
            }}
          >
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            AI Premium Analysis
          </motion.span>
        </div>

        {/* Lock icon + title */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.3)',
              boxShadow: '0 0 28px rgba(168,85,247,0.22)',
            }}
          >
            <Lock className="w-6 h-6 text-purple-300" />
          </motion.div>
          <h2 className="text-2xl font-extrabold font-syne text-white mb-2 tracking-wide">
            Полный AI-анализ FACEMAX
          </h2>
          <p className="text-purple-200/50 text-sm leading-relaxed max-w-sm mx-auto">
            Получи детальный разбор каждого параметра твоей внешности
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-7">
          {PREMIUM_FEATURES.map((feat, i) => (
            <motion.div
              key={feat}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.045 }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
              style={{
                background: 'rgba(168,85,247,0.07)',
                border: '1px solid rgba(168,85,247,0.14)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400/80 shrink-0" />
              <span className="text-sm text-purple-100/80 font-medium">{feat}</span>
            </motion.div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onUnlock}
            disabled={isProcessing}
            className="group relative w-full max-w-xs overflow-hidden rounded-2xl py-4 font-extrabold text-lg font-syne tracking-wide text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isProcessing
                ? 'rgba(124,58,237,0.5)'
                : 'linear-gradient(135deg, #7c3aed, #a855f7 50%, #ec4899)',
              boxShadow: isProcessing
                ? 'none'
                : '0 0 32px rgba(168,85,247,0.45), 0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {/* Hover shine */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.14) 50%, transparent 65%)' }}
            />
            <span className="relative flex items-center justify-center gap-2.5">
              {isProcessing ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Обработка...
                </>
              ) : (
                <>
                  <Lock className="w-4.5 h-4.5" />
                  Разблокировать за 199 ₽
                </>
              )}
            </span>
          </button>
          <p className="text-xs text-white/20 text-center">
            Единоразовый платёж · Без подписки · Безопасно
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function FaceMaxApp() {
  const [view, setView] = useState<'select' | 'upload' | 'validating' | 'validation_error' | 'loading' | 'results' | 'error'>('select');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [age, setAge] = useState<number>(20);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeModal, setActiveModal] = useState<'offer' | 'disclaimer' | 'support' | 'privacy' | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentBlocked, setConsentBlocked] = useState(false);
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [showUnlockSuccess, setShowUnlockSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<FaceValidationErrorType | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisAbortRef = useRef(false);

  const clearProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'front') {
      if (frontImage) URL.revokeObjectURL(frontImage);
      setFrontImage(url);
    } else {
      if (sideImage) URL.revokeObjectURL(sideImage);
      setSideImage(url);
    }
    e.target.value = '';
  };

  const startAnalysis = async () => {
    if (!frontImage || !sideImage) return;

    // ── Phase 1: Face validation ──────────────────────────────────────────────
    analysisAbortRef.current = false;
    setValidationError(null);
    setView('validating');
    console.log('[FACEMAX] Analysis started');

    // Front photo: strict — must contain exactly one human face
    // Side photo: lenient — only check darkness (profiles confuse detectors)
    const [frontValidation, sideValidation] = await Promise.all([
      validateFaceImage(frontImage, true),
      validateFaceImage(sideImage, false),
    ]);

    // If user cancelled during validation, bail out
    if (analysisAbortRef.current) return;

    if (!frontValidation.valid) {
      setValidationError(frontValidation.errorType);
      setView('validation_error');
      return;
    }

    if (!sideValidation.valid) {
      setValidationError(sideValidation.errorType);
      setView('validation_error');
      return;
    }

    // ── Phase 2: Full analysis ────────────────────────────────────────────────
    console.log('[FACEMAX] Validation passed — starting full analysis');
    setView('loading');
    setLoadingProgress(0);

    const analysisStart = Date.now();
    const TOTAL_DURATION = 3500;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - analysisStart;
      const p = Math.min(92, Math.floor((elapsed / TOTAL_DURATION) * 100));
      setLoadingProgress(p);
    }, 60);

    try {
      const [frontMetrics, sideMetrics] = await Promise.all([
        analyzeImage(frontImage),
        analyzeImage(sideImage),
      ]);

      const result = generateAnalysis(frontMetrics, sideMetrics, { gender: gender!, age });
      setResults(result);

      const elapsed = Date.now() - analysisStart;
      const remaining = Math.max(0, TOTAL_DURATION - elapsed);
      await new Promise(r => setTimeout(r, remaining));

      clearProgress();
      setLoadingProgress(100);
      await new Promise(r => setTimeout(r, 200));
      setView('results');
    } catch {
      clearProgress();
      setView('error');
    }
  };

  const reset = () => {
    clearProgress();
    if (frontImage) URL.revokeObjectURL(frontImage);
    if (sideImage) URL.revokeObjectURL(sideImage);
    setFrontImage(null);
    setSideImage(null);
    setResults(null);
    setLoadingProgress(0);
    setGender(null);
    setAge(20);
    setIsPremiumUnlocked(false);
    setIsPaymentProcessing(false);
    setShowUnlockSuccess(false);
    setPaymentError(null);
    setValidationError(null);
    setView('select');
  };

  const handleUnlock = async () => {
    setIsPaymentProcessing(true);
    setPaymentError(null);

    const result = await startPayment();
    setIsPaymentProcessing(false);

    if (result.error || !result.confirmation_url || !result.paymentId) {
      setPaymentError(result.error ?? 'Не удалось создать ссылку на оплату');
      return;
    }

    const confirmation_url = result.confirmation_url;

    // Сохраняем paymentId и результаты анализа перед редиректом
    try {
      sessionStorage.setItem('facemax_pending_payment_id', result.paymentId);
      if (results) {
        sessionStorage.setItem('facemax_saved_state', JSON.stringify({
          results,
          gender,
          age,
        }));
      }
    } catch { /* storage errors are non-fatal */ }

    // Строгий редирект на страницу оплаты ЮKassa.
    // После оплаты ЮKassa вернёт пользователя на этот сайт.
    // useEffect ниже подхватит paymentId и будет опрашивать статус.
    window.location.href = confirmation_url;
  };

  useEffect(() => () => clearProgress(), []);

  // Pre-warm the face detector while user is on the upload screen
  useEffect(() => {
    if (view === 'upload') preloadFaceDetector();
  }, [view]);

  // Restore analysis state + poll for payment status after YooKassa redirect
  useEffect(() => {
    const pendingId = sessionStorage.getItem('facemax_pending_payment_id');
    if (!pendingId) return;

    // Restore saved analysis state so user sees results when they return
    try {
      const savedStr = sessionStorage.getItem('facemax_saved_state');
      if (savedStr) {
        const saved = JSON.parse(savedStr) as { results: AnalysisResult; gender: 'male' | 'female'; age: number };
        setResults(saved.results);
        setGender(saved.gender);
        setAge(saved.age);
        setView('results');
      }
    } catch { /* ignore parse errors */ }

    let active = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 24; // poll for up to ~2 min at 5 s intervals

    const poll = async () => {
      if (!active || attempts >= MAX_ATTEMPTS) return;
      attempts++;
      try {
        const { status } = await checkPaymentStatus(pendingId);
        if (status === 'succeeded' || status === 'waiting_for_capture') {
          unlockAfterPaymentSuccess(pendingId);
          setIsPremiumUnlocked(true);
          setShowUnlockSuccess(true);
          return;
        }
        if (status === 'failed' || status === 'cancelled') {
          sessionStorage.removeItem('facemax_pending_payment_id');
          sessionStorage.removeItem('facemax_saved_state');
          return;
        }
      } catch { /* network error — retry */ }
      setTimeout(poll, 5000);
    };

    void poll();
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const LOADING_STAGES = [
    { pct: 0,  label: 'Загрузка изображений...' },
    { pct: 22, label: 'Анализ яркости и контраста...' },
    { pct: 42, label: 'Оценка симметрии лица...' },
    { pct: 62, label: 'Расчёт параметров внешности...' },
    { pct: 80, label: 'Вычисление APPEAL...' },
    { pct: 90, label: 'Формирование итогового рейтинга...' },
  ];
  const currentStage = LOADING_STAGES.reduce((acc, s) => loadingProgress >= s.pct ? s : acc, LOADING_STAGES[0]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden selection:bg-purple-500/30">

      {/* Noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 max-w-5xl">
        <AnimatePresence mode="wait">

          {/* ── SELECT SCREEN ── */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center min-h-[80vh]"
            >
              <div className="text-center mb-12">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-3 bg-gradient-to-br from-white via-purple-200 to-purple-600 bg-clip-text text-transparent font-syne">
                  FACEMAX
                </h1>
                <p className="text-base md:text-lg text-purple-300/60 font-medium tracking-wide">
                  AI-анализ лица и потенциала внешности
                </p>
              </div>

              {/* Gender selection */}
              <div className="w-full max-w-md mb-10">
                <p className="text-xs text-purple-400/50 tracking-[0.25em] uppercase font-semibold text-center mb-5">Пол</p>
                <div className="grid grid-cols-2 gap-4">
                  {(['male', 'female'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className="relative group flex flex-col items-center justify-center py-7 rounded-2xl font-bold tracking-wide transition-all duration-300 font-syne text-lg"
                      style={{
                        background: gender === g
                          ? 'rgba(168,85,247,0.2)'
                          : 'rgba(255,255,255,0.03)',
                        border: gender === g
                          ? '1.5px solid rgba(168,85,247,0.6)'
                          : '1.5px solid rgba(255,255,255,0.07)',
                        color: gender === g ? 'rgb(216,180,254)' : 'rgba(255,255,255,0.4)',
                        boxShadow: gender === g ? '0 0 30px rgba(168,85,247,0.2)' : 'none',
                      }}
                    >
                      <span className="text-3xl mb-2">{g === 'male' ? '♂' : '♀'}</span>
                      <span>{g === 'male' ? 'Male' : 'Female'}</span>
                      {gender === g && (
                        <div className="absolute top-0 left-0 w-full h-px rounded-t-2xl bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age selector */}
              <div className="w-full max-w-md mb-12">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-purple-400/50 tracking-[0.25em] uppercase font-semibold">Возраст</p>
                  <span className="text-2xl font-bold font-syne text-purple-300">{age} <span className="text-sm text-purple-400/50">лет</span></span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={10}
                    max={30}
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgba(168,85,247,0.8) 0%, rgba(168,85,247,0.8) ${((age - 10) / 20) * 100}%, rgba(255,255,255,0.08) ${((age - 10) / 20) * 100}%, rgba(255,255,255,0.08) 100%)`,
                    }}
                  />
                  <div className="flex justify-between mt-2 text-xs text-purple-400/35">
                    <span>10</span>
                    <span>{age < 16 ? 'Age-adjusted ✓' : age < 18 ? 'Young mode ✓' : 'Full analysis'}</span>
                    <span>30</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => gender && setView('upload')}
                disabled={!gender}
                className="group relative inline-flex items-center justify-center px-12 py-5 font-bold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full group-hover:blur-md transition-all group-disabled:hidden" />
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full border border-white/20" />
                <span className="relative flex items-center gap-2 text-lg font-syne tracking-wide">
                  ПРОДОЛЖИТЬ <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              {!gender && (
                <p className="mt-5 text-xs text-white/25 font-medium tracking-widest uppercase">
                  ВЫБЕРИТЕ ПОЛ ДЛЯ ПРОДОЛЖЕНИЯ
                </p>
              )}
            </motion.div>
          )}

          {/* ── UPLOAD SCREEN ── */}
          {view === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center min-h-[80vh]"
            >
              <div className="text-center mb-14">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-3 bg-gradient-to-br from-white via-purple-200 to-purple-600 bg-clip-text text-transparent font-syne">
                  FACEMAX
                </h1>
                <p className="text-base md:text-lg text-purple-300/60 font-medium tracking-wide">
                  AI-анализ лица и потенциала внешности
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
                {/* Front photo */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative bg-[#140024]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 aspect-[3/4] flex flex-col items-center justify-center overflow-hidden transition-all hover:border-purple-500/40">
                    {frontImage ? (
                      <>
                        <img src={frontImage} alt="Анфас" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        <button
                          data-testid="button-remove-front"
                          onClick={() => { if (frontImage) URL.revokeObjectURL(frontImage); setFrontImage(null); }}
                          className="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-md hover:bg-red-500/80 transition-colors z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-purple-200 font-semibold tracking-wider">
                          АНФАС
                        </div>
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-14 h-14 text-purple-500/40 mb-4" />
                        <span className="text-lg font-semibold text-white/80 font-syne">Анфас</span>
                        <span className="text-sm text-white/40 mt-2 text-center">Прямо, лицо по центру</span>
                        <input
                          data-testid="input-front-photo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, 'front')}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                    {!frontImage && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-purple-600/30 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-purple-200">
                          <Upload className="w-4 h-4" /> Загрузить
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side photo */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative bg-[#140024]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 aspect-[3/4] flex flex-col items-center justify-center overflow-hidden transition-all hover:border-purple-500/40">
                    {sideImage ? (
                      <>
                        <img src={sideImage} alt="Профиль" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        <button
                          data-testid="button-remove-side"
                          onClick={() => { if (sideImage) URL.revokeObjectURL(sideImage); setSideImage(null); }}
                          className="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-md hover:bg-red-500/80 transition-colors z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-purple-200 font-semibold tracking-wider">
                          ПРОФИЛЬ
                        </div>
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-14 h-14 text-purple-500/40 mb-4" style={{ transform: 'rotateY(60deg)' }} />
                        <span className="text-lg font-semibold text-white/80 font-syne">Профиль</span>
                        <span className="text-sm text-white/40 mt-2 text-center">Сбоку, чёткий профиль</span>
                        <input
                          data-testid="input-side-photo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUpload(e, 'side')}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                    {!sideImage && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-purple-600/30 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-purple-200">
                          <Upload className="w-4 h-4" /> Загрузить
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Consent checkbox ── */}
              <div className="w-full max-w-md mb-8">
                <label
                  className="flex items-start gap-3 cursor-pointer group select-none"
                  onClick={() => { setConsentGiven(v => !v); setConsentBlocked(false); }}
                >
                  <div
                    className="mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-200 border"
                    style={{
                      background: consentGiven ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.04)',
                      borderColor: consentBlocked
                        ? 'rgba(239,68,68,0.7)'
                        : consentGiven
                          ? 'rgba(168,85,247,0.8)'
                          : 'rgba(255,255,255,0.15)',
                      boxShadow: consentGiven ? '0 0 12px rgba(168,85,247,0.3)' : consentBlocked ? '0 0 8px rgba(239,68,68,0.2)' : 'none',
                    }}
                  >
                    {consentGiven && (
                      <motion.svg
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        viewBox="0 0 12 10"
                        className="w-3 h-3"
                      >
                        <polyline points="1,5 4.5,8.5 11,1" fill="none" stroke="rgba(216,180,254,1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </div>
                  <span className="text-sm leading-relaxed" style={{ color: consentBlocked ? 'rgba(252,165,165,0.9)' : 'rgba(216,180,254,0.65)' }}>
                    Я соглашаюсь на обработку изображения для AI-анализа FACEMAX в соответствии с{' '}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setActiveModal('privacy'); }}
                      className="underline underline-offset-2 hover:text-purple-300 transition-colors"
                      style={{ color: 'rgba(192,132,252,0.8)' }}
                    >
                      Политикой конфиденциальности
                    </button>
                  </span>
                </label>

                <AnimatePresence>
                  {consentBlocked && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 ml-8 text-xs text-red-400/80"
                    >
                      Для анализа необходимо согласие на обработку изображения.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button
                data-testid="button-analyze"
                onClick={() => {
                  if (!consentGiven) { setConsentBlocked(true); return; }
                  startAnalysis();
                }}
                disabled={!frontImage || !sideImage}
                className="group relative inline-flex items-center justify-center px-12 py-5 font-bold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full group-hover:blur-md transition-all group-disabled:hidden" />
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full border border-white/20" />
                <span className="relative flex items-center gap-2 text-lg font-syne tracking-wide">
                  АНАЛИЗИРОВАТЬ <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              {(!frontImage || !sideImage) && (
                <p className="mt-6 text-xs text-white/25 font-medium tracking-widest uppercase">
                  ЗАГРУЗИ ОБА ФОТО ДЛЯ АНАЛИЗА
                </p>
              )}
            </motion.div>
          )}

          {/* ── VALIDATING SCREEN ── */}
          {view === 'validating' && (
            <motion.div
              key="validating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[80vh] gap-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
                <div className="relative w-28 h-28 rounded-full bg-[#1a0033]/80 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center">
                  <ScanFace className="w-12 h-12 text-purple-300/80" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-t-purple-500 border-r-purple-400/40 border-b-transparent border-l-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border border-t-fuchsia-500/50 border-b-fuchsia-500/20 border-l-transparent border-r-transparent"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold font-syne text-white mb-2">Проверка изображений</h2>
                <p className="text-purple-300/50 text-sm tracking-wide">Поиск лица на фотографиях...</p>
              </div>
              <button
                onClick={() => { analysisAbortRef.current = true; setView('upload'); }}
                className="mt-2 px-6 py-2.5 rounded-full border border-purple-500/20 bg-transparent text-purple-400/50 text-sm font-semibold tracking-wide hover:border-purple-500/40 hover:text-purple-300/70 transition-all font-syne"
              >
                ОТМЕНИТЬ
              </button>
            </motion.div>
          )}

          {/* ── VALIDATION ERROR SCREEN ── */}
          {view === 'validation_error' && validationError && (
            <motion.div
              key="validation_error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-500/15 blur-3xl rounded-full" />
                <div className="relative w-28 h-28 rounded-full bg-[#1a0033]/80 backdrop-blur-xl border border-red-500/30 flex items-center justify-center">
                  {validationError === 'multiple_faces'
                    ? <AlertTriangle className="w-12 h-12 text-amber-400" />
                    : <ScanFace className="w-12 h-12 text-red-400/80" />
                  }
                </div>
              </div>

              <h2 className="text-2xl font-bold font-syne text-white/90 mb-3">
                {validationError === 'no_face' && 'Лицо не обнаружено'}
                {validationError === 'multiple_faces' && 'Несколько лиц'}
                {validationError === 'face_too_small' && 'Лицо слишком маленькое'}
                {validationError === 'too_dark' && 'Фото слишком тёмное'}
                {validationError === 'image_error' && 'Некорректное изображение'}
              </h2>

              <p className="text-purple-200/55 text-base max-w-sm leading-relaxed mb-10">
                {validationError === 'no_face' && (
                  <>
                    Пожалуйста, загрузите чёткое фото реального человека с хорошо видимым лицом.
                    <br /><br />
                    <span className="text-purple-300/35 text-sm">FACEMAX не анализирует предметы, животных, рисунки и аниме.</span>
                  </>
                )}
                {validationError === 'multiple_faces' && 'Пожалуйста, загрузите фото только одного человека.'}
                {validationError === 'face_too_small' && 'Приблизьте камеру так, чтобы лицо занимало большую часть фотографии.'}
                {validationError === 'too_dark' && 'Сделайте фото при хорошем освещении. Лицо должно быть чётко видно.'}
                {validationError === 'image_error' && 'Файл повреждён или имеет неподдерживаемый формат. Попробуйте другое фото.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  data-testid="button-retry-validation"
                  onClick={() => setView('upload')}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold tracking-wide transition-opacity hover:opacity-90 font-syne"
                >
                  ЗАГРУЗИТЬ ДРУГОЕ ФОТО
                </button>
                <button
                  onClick={reset}
                  className="px-8 py-4 rounded-full border border-purple-500/30 bg-purple-900/20 text-purple-200 font-bold tracking-wide transition-colors hover:bg-purple-900/40 font-syne"
                >
                  НАЧАТЬ ЗАНОВО
                </button>
              </div>
            </motion.div>
          )}

          {/* ── LOADING SCREEN ── */}
          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[80vh] gap-10"
            >
              <div className="relative w-60 h-60 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-purple-500/25 animate-[spin_5s_linear_infinite]" />
                <div className="absolute inset-3 rounded-full border-t border-b border-fuchsia-500/40 animate-[spin_3.5s_linear_infinite_reverse]" />
                <div className="absolute inset-6 rounded-full border border-purple-400/15 animate-[spin_7s_linear_infinite]" />
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.15) 50%, transparent 100%)',
                  animation: 'spin 4s linear infinite',
                }} />
                <div className="text-center z-10">
                  <div className="text-5xl font-bold font-syne text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-300">
                    {Math.min(loadingProgress, 100)}%
                  </div>
                  <div className="text-xs tracking-widest text-purple-300/50 mt-2 uppercase">FACEMAX</div>
                </div>
              </div>

              <div className="w-72 space-y-3">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full"
                    animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
                <p className="text-center text-sm text-purple-300/50 tracking-wide min-h-[1.25rem]">
                  {currentStage.label}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── ERROR SCREEN ── */}
          {view === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[80vh] text-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
                <div className="relative w-28 h-28 rounded-full bg-[#1a0033]/80 backdrop-blur-xl border border-amber-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-amber-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold font-syne text-white/90 mb-3">Нужна более чёткая фотография</h2>
              <p className="text-purple-200/50 text-base max-w-sm leading-relaxed mb-2">
                Убедись, что фото:
              </p>
              <ul className="text-purple-200/40 text-sm space-y-1 mb-10 text-left list-none">
                <li>— хорошо освещено (не тёмное и не пересвеченное)</li>
                <li>— чёткое, без размытия</li>
                <li>— лицо по центру, анфас</li>
                <li>— профиль сбоку, без прикрытия рукой</li>
              </ul>

              <button
                data-testid="button-retry"
                onClick={reset}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold tracking-wide transition-opacity hover:opacity-90"
              >
                ПОПРОБОВАТЬ СНОВА
              </button>
            </motion.div>
          )}

          {/* ── RESULTS SCREEN ── */}
          {view === 'results' && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pb-24"
            >
              {/* ── LOCKED VIEW (before payment) ── */}
              {!isPremiumUnlocked && (
                <motion.div
                  key="results-locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                  >
                    <p className="text-xs text-purple-400/50 tracking-[0.3em] uppercase font-semibold mb-5">FACEMAX ANALYSIS</p>
                    <div className="relative inline-flex mb-5">
                      <div className="absolute inset-0 bg-purple-600/20 blur-2xl rounded-full" />
                      <div className="relative w-20 h-20 rounded-full bg-[#1a0033]/80 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.15)]">
                        <ScanFace className="w-9 h-9 text-purple-300/80" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold font-syne text-white mb-2">Анализ завершён</h2>
                    <p className="text-purple-200/45 text-sm max-w-xs mx-auto leading-relaxed">
                      Твои результаты готовы. Разблокируй полный AI-отчёт
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-5">
                      <Gauge className="w-3.5 h-3.5 text-purple-400/60" />
                      <span className="text-xs text-purple-300/50 tracking-widest uppercase">Точность анализа</span>
                      <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(Math.max(results.confidenceScore, 80), 98)}%` }}
                          transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'rgba(192,132,252,0.8)' }}>
                        {Math.min(Math.max(results.confidenceScore, 80), 98)}%
                      </span>
                    </div>
                  </motion.div>

                  {/* Blurred preview — score + tier hidden behind blur + gradient */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="relative mb-6 rounded-2xl overflow-hidden"
                    style={{ height: '180px' }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-8 px-6"
                      style={{ filter: 'blur(14px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-600/25 blur-3xl rounded-full" />
                        <div className="relative w-32 h-32 rounded-full bg-[#1a0033]/80 border border-purple-500/30 flex flex-col items-center justify-center">
                          <span className="text-xs text-purple-300/50 uppercase tracking-widest mb-1">Рейтинг</span>
                          <span className="text-5xl font-bold font-syne text-white">{results.overallScore.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="px-6 py-2 rounded-full bg-purple-900/40 border border-purple-500/30 text-white font-bold tracking-widest uppercase font-syne text-lg">
                          {results.tier}
                        </div>
                        <div className="px-4 py-1.5 rounded-full text-sm font-semibold text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(216,180,254,0.55)' }}>
                          {results.archetype}
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0014]/20 via-[#0a0014]/55 to-[#0a0014]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', backdropFilter: 'blur(8px)' }}
                      >
                        <Lock className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300/80 font-semibold">Результаты заблокированы</span>
                      </motion.div>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {paymentError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3 }}
                        className="mb-4 px-5 py-3 rounded-2xl text-center"
                        style={{
                          background: 'rgba(239,68,68,0.07)',
                          border: '1px solid rgba(239,68,68,0.25)',
                        }}
                      >
                        <p className="text-sm text-red-300/80 leading-relaxed">
                          {paymentError}
                        </p>
                        <button
                          onClick={() => setPaymentError(null)}
                          className="text-xs text-red-400/40 mt-2 hover:text-red-300/60 transition-colors"
                        >
                          Закрыть
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <PaywallCard onUnlock={handleUnlock} isProcessing={isPaymentProcessing} />
                </motion.div>
              )}

              {/* ── UNLOCKED VIEW (after payment) ── */}
              {isPremiumUnlocked && (
                <motion.div
                  key="results-unlocked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Success banner (confirmed payment) */}
                  <AnimatePresence>
                    {showUnlockSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl mb-8"
                        style={{
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))',
                          border: '1px solid rgba(16,185,129,0.3)',
                          boxShadow: '0 0 30px rgba(16,185,129,0.1)',
                        }}
                      >
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold font-syne tracking-wide">Полный анализ разблокирован!</span>
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>

              {/* ── User Profile Avatar Block ── */}
              {frontImage && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center mb-10"
                >
                  {/* Circle avatar with glow */}
                  <div className="relative mb-5">
                    {/* Soft ambient glow */}
                    <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full scale-125" />
                    {/* Animated outer ring */}
                    <motion.div
                      className="absolute -inset-1 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7 50%, #ec4899)' }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.8, repeat: Infinity }}
                    />
                    {/* Inner white ring */}
                    <div className="absolute -inset-0.5 rounded-full bg-[#0a0014]" />
                    {/* Photo circle */}
                    <div className="relative w-28 h-28 rounded-full overflow-hidden"
                      style={{ boxShadow: '0 0 36px rgba(168,85,247,0.45), 0 8px 32px rgba(0,0,0,0.6)' }}
                    >
                      <img
                        src={frontImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center top' }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-stretch gap-3 flex-wrap justify-center">
                    <div
                      className="flex flex-col items-center px-5 py-3 rounded-2xl"
                      style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.24)', backdropFilter: 'blur(16px)' }}
                    >
                      <span className="text-[10px] text-purple-300/50 uppercase tracking-[0.2em] mb-1">Рейтинг</span>
                      <span className="text-2xl font-extrabold font-syne bg-gradient-to-b from-white to-purple-300 bg-clip-text text-transparent">
                        {results.overallScore.toFixed(1)}
                      </span>
                    </div>
                    <div
                      className="flex flex-col items-center px-5 py-3 rounded-2xl"
                      style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.24)', backdropFilter: 'blur(16px)' }}
                    >
                      <span className="text-[10px] text-purple-300/50 uppercase tracking-[0.2em] mb-1">Archetype</span>
                      <span className="text-sm font-bold font-syne text-purple-200">{results.archetype}</span>
                    </div>
                    <div
                      className="flex flex-col items-center px-5 py-3 rounded-2xl"
                      style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.24)', backdropFilter: 'blur(16px)' }}
                    >
                      <span className="text-[10px] text-purple-300/50 uppercase tracking-[0.2em] mb-1">Confidence</span>
                      <span className="text-sm font-bold font-syne text-purple-200">
                        {Math.min(Math.max(results.confidenceScore, 80), 98)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-14"
              >
                <p className="text-xs text-purple-400/50 tracking-[0.3em] uppercase font-semibold mb-6">FACEMAX ANALYSIS</p>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20, delay: 0.2 }}
                  className="inline-block relative mb-7"
                >
                  <div className="absolute inset-0 bg-purple-600/25 blur-3xl rounded-full" />
                  <div className="relative w-44 h-44 rounded-full bg-[#1a0033]/80 backdrop-blur-xl border border-purple-500/30 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.18)]">
                    <span className="text-xs text-purple-300/50 uppercase tracking-widest font-semibold mb-1">Рейтинг</span>
                    <span className="text-6xl font-bold font-syne bg-gradient-to-b from-white to-purple-300 text-transparent bg-clip-text">
                      {results.overallScore.toFixed(1)}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  data-testid="text-tier"
                  className="flex flex-col items-center gap-2"
                >
                  <div className="inline-block px-7 py-2 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-200 font-bold tracking-[0.2em] text-xl uppercase shadow-[0_0_20px_rgba(168,85,247,0.25)] font-syne">
                    {results.tier}
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(216,180,254,0.55)' }}>
                    {results.archetype}
                  </span>
                </motion.div>

                {/* Confidence score row */}
                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.52 }}
                  className="flex items-center justify-center gap-2 mt-5"
                >
                  <Gauge className="w-3.5 h-3.5 text-purple-400/60" />
                  <span className="text-xs text-purple-300/50 tracking-widest uppercase">Точность анализа</span>
                  <div
                    className="h-1.5 w-20 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.max(results.confidenceScore, 80), 98)}%` }}
                      transition={{ duration: 1.2, delay: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'rgba(192,132,252,0.8)' }}>
                    {Math.min(Math.max(results.confidenceScore, 80), 98)}%
                  </span>
                </motion.div>
              </motion.div>

              {/* Gender / Age adjustment badges */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.58 }}
                className="flex items-center justify-center gap-2 mt-4 flex-wrap"
              >
                {results.isGenderAdjusted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: 'rgba(216,180,254,0.75)' }}>
                    {gender === 'male' ? '♂ Male analysis' : '♀ Female analysis'}
                  </span>
                )}
                {results.isAgeAdjusted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: 'rgba(110,231,183,0.75)' }}>
                    Age-adjusted ({age} лет)
                  </span>
                )}
                {!results.isAgeAdjusted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                    {age} лет · Full analysis
                  </span>
                )}
              </motion.div>

              {/* Blocking reason banner (shown only when a cap was applied) */}
              {results.blockingReason && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.64 }}
                  className="flex items-start gap-3 px-5 py-4 rounded-2xl mt-5 mb-0"
                  style={{
                    background: 'rgba(234,179,8,0.07)',
                    border: '1px solid rgba(234,179,8,0.22)',
                  }}
                >
                  <Info className="w-4 h-4 text-yellow-400/80 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-300/70 uppercase tracking-widest mb-1">Что ограничивает оценку</p>
                    <p className="text-sm text-yellow-200/60 leading-relaxed">{results.blockingReason}</p>
                  </div>
                </motion.div>
              )}

              {/* APPEAL CARD */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="relative mt-8 mb-8"
                data-testid="card-appeal"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 rounded-2xl blur opacity-30" />
                <div className="relative bg-[#1a0030]/70 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-3">
                        <h2 className="text-2xl font-extrabold font-syne tracking-wider text-white">APPEAL</h2>
                        <span className="text-xs text-purple-300/50 uppercase tracking-widest">гармония лица</span>
                      </div>
                      <p className="text-sm text-purple-200/60 leading-relaxed max-w-xl">
                        {results.appeal.tip}
                      </p>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                      <span className="text-5xl font-bold font-syne bg-gradient-to-br from-fuchsia-300 to-purple-400 text-transparent bg-clip-text" data-testid="text-appeal-score">
                        {results.appeal.score.toFixed(1)}
                      </span>
                      <span className="text-xs text-purple-400/50 tracking-widest">/ 10</span>
                    </div>
                  </div>
                  <div className="mt-5 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(results.appeal.score / 10) * 100}%` }}
                      transition={{ duration: 1.8, delay: 0.7, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>

              {/* 6 Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
                {results.categories.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.08 }}
                    data-testid={`card-category-${cat.id}`}
                    className="bg-[#1a0030]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:bg-[#200040]/80 hover:border-purple-500/25 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-end mb-4">
                        <h3 className="font-semibold text-base text-white/85">{cat.name}</h3>
                        <span className="text-xl font-bold font-syne text-purple-300">{cat.score.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(cat.score / 10) * 100}%` }}
                          transition={{ duration: 1.4, delay: 0.9 + i * 0.08, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 rounded-full"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-purple-200/45 leading-relaxed font-medium group-hover:text-purple-200/70 transition-colors">
                      {cat.tip}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Что хорошо (≥ 7) + Что прокачать (< 7) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Что хорошо */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 }}
                  className="bg-gradient-to-br from-emerald-900/15 to-[#1a0030]/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6"
                >
                  <h2 className="text-xl font-bold font-syne text-emerald-400 mb-5 flex items-center gap-3">
                    <div className="w-1.5 h-7 bg-emerald-500 rounded-full" />
                    Что хорошо
                  </h2>
                  {results.strengths.length > 0 ? (
                    <div className="space-y-3">
                      {results.strengths.map(s => (
                        <div key={s.id} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0" data-testid={`text-strength-${s.id}`}>
                          <span className="text-base text-white/75">{s.name}</span>
                          <span className="text-emerald-300 font-bold text-sm">{s.score.toFixed(1)}/10</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-purple-200/35 leading-relaxed">
                      Параметры ≥ 7 будут отображены здесь. Работа над уходом и формой поможет поднять показатели.
                    </p>
                  )}
                </motion.div>

                {/* Что прокачать (only shown if any param < 7) */}
                {results.weaknesses.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 }}
                    className="bg-gradient-to-br from-rose-900/15 to-[#1a0030]/60 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-6"
                  >
                    <h2 className="text-xl font-bold font-syne text-rose-400 mb-5 flex items-center gap-3">
                      <div className="w-1.5 h-7 bg-rose-500 rounded-full" />
                      Что прокачать
                    </h2>
                    <div className="space-y-3">
                      {results.weaknesses.map(w => (
                        <div key={w.id} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0" data-testid={`text-weakness-${w.id}`}>
                          <span className="text-base text-white/75">{w.name}</span>
                          <span className="text-rose-300 font-bold text-sm">{w.score.toFixed(1)}/10</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Что мешает подняться выше (shown when not Chad) */}
              {results.improvementHints.length > 0 && results.tier !== 'True Adam' && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 }}
                  className="mb-14 rounded-2xl p-6"
                  style={{
                    background: 'rgba(99,102,241,0.07)',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <h2 className="text-lg font-bold font-syne text-indigo-300/80 mb-4 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500/60 rounded-full" />
                    Что мешает подняться выше
                  </h2>
                  <div className="space-y-2">
                    {results.improvementHints.map((hint, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-indigo-200/55 leading-relaxed">
                        <span className="text-indigo-400/60 mt-0.5 shrink-0">→</span>
                        <span>{hint}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

                </motion.div>
              )}

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="flex flex-col items-center gap-6"
              >
                <button
                  data-testid="button-restart"
                  onClick={reset}
                  className="px-8 py-4 rounded-full border border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40 text-purple-200 font-bold tracking-wide transition-colors font-syne"
                >
                  НАЧАТЬ ЗАНОВО
                </button>
                <p className="text-xs text-white/18 text-center max-w-md leading-relaxed">
                  Это развлекательный анализ, а не медицинская или объективная оценка внешности.
                </p>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Fixed mobile unlock bar ── */}
      <AnimatePresence>
        {view === 'results' && results && !isPremiumUnlocked && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.6 }}
            className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-4 md:hidden"
            style={{ background: 'linear-gradient(to top, rgba(10,0,20,1) 55%, rgba(10,0,20,0))' }}
          >
            <button
              onClick={handleUnlock}
              disabled={isPaymentProcessing}
              className="w-full py-4 rounded-2xl font-extrabold text-white font-syne tracking-wide text-lg flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7 50%, #ec4899)',
                boxShadow: '0 0 30px rgba(168,85,247,0.5), 0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {isPaymentProcessing ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Обработка...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Разблокировать за 199 ₽
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed legal buttons (bottom-left) ── */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2 flex-wrap">
        {(
          [
            { id: 'privacy',    icon: <Lock className="w-3 h-3" />,       label: 'Privacy Policy' },
            { id: 'offer',      icon: <FileText className="w-3 h-3" />,   label: 'Оферта' },
            { id: 'disclaimer', icon: <ShieldAlert className="w-3 h-3" />, label: 'Дисклеймер' },
          ] as const
        ).map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveModal(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.22)',
              color: 'rgba(216,180,254,0.65)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 16px rgba(168,85,247,0.08)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.16)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(216,180,254,1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(216,180,254,0.65)'; }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── Floating support button (bottom-right) ── */}
      <button
        onClick={() => setActiveModal(activeModal === 'support' ? null : 'support')}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
        style={{
          background: activeModal === 'support' ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.12)',
          border: '1px solid rgba(168,85,247,0.35)',
          backdropFilter: 'blur(16px)',
          boxShadow: activeModal === 'support'
            ? '0 0 30px rgba(168,85,247,0.4), 0 8px 24px rgba(0,0,0,0.5)'
            : '0 0 20px rgba(168,85,247,0.15), 0 4px 16px rgba(0,0,0,0.4)',
        }}
        title="Поддержка"
      >
        <HeadphonesIcon className="w-5 h-5 text-purple-300" />
      </button>

      {/* ── Modals ── */}
      {activeModal === 'privacy' && (
        <DocModal title="Privacy Policy" content={privacyText} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'offer' && (
        <DocModal title="Оферта" content={offerText} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'disclaimer' && (
        <DocModal title="Дисклеймер" content={disclaimerText} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'support' && (
        <SupportPopup onClose={() => setActiveModal(null)} />
      )}

    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={FaceMaxApp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;