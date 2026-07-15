import type { IconType } from 'react-icons';
import {
  GiScales,
  GiThunderStruck,
  GiThreeFriends,
  GiBanknote,
  GiCancel,
  GiFeather,
} from 'react-icons/gi';

/**
 * The house rules, kept as data rather than prose in JSX.
 *
 * Two reasons: the page renders them mechanically (so a new clause is a data
 * edit, not a layout edit), and if these ever need to be admin-editable this
 * shape maps onto a table without rewriting the page.
 *
 * The voice is mock-legal, but every clause here is a real rule someone has to
 * be able to act on. If a clause is only a joke, cut it.
 */

export const ADOPTED = 'the 15th of July, 2026';
export const TARIFF_NOTE = 'A Strike carries a flat tariff, set by the Keeper in Config.';

export interface Clause {
  /** e.g. "2.1" — rendered as §2.1 */
  n: string;
  text: string;
}

export interface Article {
  numeral: string;
  title: string;
  Icon: IconType;
  /** One-line plain-English gloss, shown alongside the legalese. */
  gist: string;
  clauses: Clause[];
}

export const ARTICLES: Article[] = [
  {
    numeral: 'I',
    title: 'Of the Jar and its Purpose',
    Icon: GiScales,
    gist: 'The jar exists. Everyone is in it. It is not a punishment.',
    clauses: [
      { n: '1.1', text: 'There shall be a Jar. Into the Jar shall go the tariff of every Strike, and out of the Jar shall come something the Office enjoys together.' },
      { n: '1.2', text: 'Every Member of the Office is subject to this Constitution equally, without regard to seniority, tenure, or the strength of their opinions about the printer.' },
      { n: '1.3', text: 'The Jar is a game, not a tribunal. No Strike shall be entered in anger, and no Member shall be made to feel that the Jar is aimed at them in particular.' },
      { n: '1.4', text: 'The Keeper of the Jar administers these rules and keeps the ledger. The Keeper is not exempt from them.' },
    ],
  },
  {
    numeral: 'II',
    title: 'On the Nature of a Strike',
    Icon: GiThunderStruck,
    gist: 'You swore out loud where colleagues could hear it. That is a strike.',
    clauses: [
      { n: '2.1', text: 'A Strike is incurred the moment a Profanity escapes the lips of a Member within earshot of the Office.' },
      { n: '2.2', text: 'Volume is no defence. A muttered oath carries the same tariff as a bellowed one.' },
      { n: '2.3', text: 'Ignorance of this Constitution shall not excuse the Accused, nor shall the excuse "it slipped out," which is stipulated to be the nature of all swearing.' },
      { n: '2.4', text: 'A Profanity uttered on a call, in a meeting, or into a microphone is heard by the Office and is subject to this Article.' },
      { n: '2.5', text: 'Language is not a loophole. A Profanity in any tongue counts, provided the Witness understood it to be one.' },
      { n: '2.6', text: 'Each Profanity is one Strike. A single sentence containing three of them is three Strikes, and the Accused knows exactly what they did.' },
    ],
  },
  {
    numeral: 'III',
    title: 'Of Defences and Exemptions',
    Icon: GiCancel,
    gist: 'Quoting, reading aloud, and genuine injury are exempt. Stress is not.',
    clauses: [
      { n: '3.1', text: 'No Strike lies where the Member is quoting another, reading aloud, or naming a thing that is genuinely called that.' },
      { n: '3.2', text: 'No Strike lies where the Member has suffered genuine physical injury. The Office is not a monster.' },
      { n: '3.3', text: 'No Strike lies for words uttered outside the Office, off the clock, or in a Member\'s own head, however richly deserved.' },
      { n: '3.4', text: 'The following are expressly NOT defences: stress, deadlines, hardware, the printer, the deployment pipeline, the client, or the assertion that the word "does not really count."' },
      { n: '3.5', text: 'A Member may not pre-purchase absolution. The Jar does not sell indulgences.' },
    ],
  },
  {
    numeral: 'IV',
    title: 'Of Accusation and Witness',
    Icon: GiThreeFriends,
    gist: 'A strike needs two people who heard it: the accuser and one witness.',
    clauses: [
      { n: '4.1', text: 'A Strike requires an Accuser, who heard it, and a Witness, who also heard it. Two ears are not enough; four are.' },
      { n: '4.2', text: 'The Accuser may not also serve as the Witness, however strongly they feel about it.' },
      { n: '4.3', text: 'A Member may accuse themselves. Such a confession requires no Witness, and is the only honourable path when nobody else was listening.' },
      { n: '4.4', text: 'The Accused may concede at once, which resolves the matter and reflects well on them.' },
      { n: '4.5', text: 'Where the Accused disputes the charge and no Witness comes forward, no Strike is recorded. The Jar would rather miss one than invent one.' },
      { n: '4.6', text: 'An accusation shall be raised at the time, or not at all. Strikes recalled three days later are hearsay and are inadmissible.' },
      { n: '4.7', text: 'Once Accuser and Witness agree, the Keeper records the Strike. Recorded in error, it may be struck from the ledger — see Article VI.' },
    ],
  },
  {
    numeral: 'V',
    title: 'Of the Tariff',
    Icon: GiBanknote,
    gist: 'Every strike costs the same, whatever the word.',
    clauses: [
      { n: '5.1', text: 'Every Strike carries the same tariff, whatever the word. The Jar does not grade profanity, and the Office shall not spend its afternoon arguing over which words are worse.' },
      { n: '5.2', text: 'The tariff is set by the Keeper and applies to all Strikes then standing. It shall not be raised in retaliation for a specific incident.' },
      { n: '5.3', text: 'Debts are owed to the Jar, never to a person.' },
      { n: '5.4', text: 'Ranks, levels, and badges carry no monetary weight. They exist purely so the Office may know who among them is the worst.' },
    ],
  },
  {
    numeral: 'VI',
    title: 'Of Appeal and Amendment',
    Icon: GiFeather,
    gist: 'Wrongly logged? It gets removed. Rules change by agreement, not decree.',
    clauses: [
      { n: '6.1', text: 'A Strike recorded in error shall be removed from the ledger upon request. There is no shame in this and no penalty for asking.' },
      { n: '6.2', text: 'A Strike logged by a misclick may be undone immediately, and the Keeper is encouraged to do so before pretending it was deliberate.' },
      { n: '6.3', text: 'This Constitution may be amended by agreement of the Office. It may not be amended by the Keeper alone, nor quietly, nor retroactively.' },
      { n: '6.4', text: 'Where a rule proves unworkable, the Office shall change the rule rather than ignore it. An ignored rule is worse than no rule.' },
      { n: '6.5', text: 'Should this Constitution ever stop being funny, it shall be repealed in its entirety, and the Jar emptied on something nice.' },
    ],
  },
];
