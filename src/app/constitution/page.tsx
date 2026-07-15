'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { GiWaxSeal, GiThreeFriends, GiThunderStruck, GiBanknote, GiHotMeal } from 'react-icons/gi';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { ARTICLES, ADOPTED, AMENDMENT_CLAUSE } from '@/lib/constitution';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 18 } },
};

export default function Constitution() {
  const [price, setPrice] = React.useState<number | null>(null);

  // The tariff is a setting, not a constant — quoting it from anywhere else
  // would let the document drift out of sync with what the app charges.
  React.useEffect(() => {
    db.getPricePerSwear()
      .then(setPrice)
      .catch(() => setPrice(null));
  }, []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <motion.div variants={rise} className="flex items-center gap-2">
        <Link
          href="/"
          className="glass inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-hot">The Law</p>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">The Constitution</h1>
        </div>
      </motion.div>

      {/* Plain-English verdict, before any of the ceremony. The document is a
          joke; the question "does this cost me money" is not. */}
      <motion.section variants={rise} className="glass relative overflow-hidden rounded-3xl p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_90%_at_0%_0%,rgba(255,46,99,0.22),transparent_62%)]" />
        <div className="relative">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            In short
          </p>
          <p className="mt-2 text-lg font-semibold leading-snug sm:text-xl">
            If you swore out loud, and two people heard it, that&apos;s{' '}
            <span className="text-gold">{price === null ? 'a strike' : formatCurrency(price)}</span> in the jar.
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            At the end of every month the jar gets spent on us — dinner, food, a match, a trip, or charity.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: GiThunderStruck, label: 'Any swear, any volume', sub: 'Muttering counts. Calls count.' },
              { Icon: GiThreeFriends, label: 'Accuser + one witness', sub: 'Or own up to it yourself.' },
              { Icon: GiBanknote, label: 'Flat rate', sub: 'Every word costs the same.' },
              { Icon: GiHotMeal, label: 'Emptied monthly', sub: 'Spent on the whole office.' },
            ].map((r) => (
              <div key={r.label} className="rounded-2xl border border-border bg-background/30 p-3">
                <r.Icon className="h-4 w-4 text-hot" />
                <p className="mt-1.5 text-xs font-semibold leading-tight">{r.label}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{r.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Preamble */}
      <motion.section variants={rise} className="glass rounded-3xl p-5 sm:p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-hot">Preamble</p>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          We, the Members of this Office, in order to form a more perfect vocabulary, establish decorum, insure
          domestic quiet, provide for the common snack fund, and secure the blessings of a jar heavy with coins
          unto ourselves and our colleagues, do ordain and establish this Constitution for the SwearJar.
        </p>
      </motion.section>

      {/* Articles */}
      {ARTICLES.map((a) => (
        <motion.section key={a.numeral} variants={rise} className="glass overflow-hidden rounded-3xl">
          <header className="flex items-start gap-3 border-b border-border/60 p-5 sm:p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hot/15 text-hot">
              <a.Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Article {a.numeral}
              </p>
              <h2 className="font-heading text-lg font-bold leading-tight">{a.title}</h2>
              <p className="mt-1 text-xs italic text-hot/90">{a.gist}</p>
            </div>
          </header>

          <ol className="divide-y divide-border/40">
            {a.clauses.map((c) => (
              <li key={c.n} className="flex gap-3 px-5 py-3 sm:px-6">
                <span className="shrink-0 font-mono text-[11px] font-semibold tabular text-hot/70">§{c.n}</span>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{c.text}</p>
              </li>
            ))}
          </ol>
        </motion.section>
      ))}

      {/* Ratification */}
      <motion.section variants={rise} className="glass relative overflow-hidden rounded-3xl p-6 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_100%,rgba(255,184,0,0.14),transparent_65%)]" />
        <div className="relative flex flex-col items-center">
          <Image
            src="/3d/face_with_symbols_on_mouth.png"
            alt=""
            aria-hidden
            width={112}
            height={112}
            unoptimized
            className="h-14 w-14 drop-shadow-[0_6px_14px_rgba(42,6,17,0.6)]"
          />
          <p className="mt-3 font-heading text-sm font-bold uppercase tracking-[0.2em]">Ratified</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Adopted by the Office on {ADOPTED}, and in force since.
          </p>
          <p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-gold">
            <GiWaxSeal className="h-3.5 w-3.5" />
            Sealed
          </p>
        </div>
      </motion.section>

      <motion.p variants={rise} className="pb-2 text-center text-[11px] text-muted-foreground">
        Amendments require the agreement of the Office — see{' '}
        <span className="font-mono text-hot/80">§{AMENDMENT_CLAUSE}</span>.
      </motion.p>
    </motion.div>
  );
}
