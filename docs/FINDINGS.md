# Findings

The ledger behind `CLAUDE.md`. Every entry here was found with one of the
harnesses listed there and closed the same way: what was observed, how it was
measured, what changed, and how the change was checked — usually by putting the
defect back and watching a named test fail.

Two things this file is for. First, so a session that meets a symptom can see
whether it has been met before, and how. Second, so the project's record of its
own mistakes is kept where it costs nothing to keep: it was split out of
`CLAUDE.md` when that file reached 1,100 lines and every session was reading
the whole of it. The rules, the harnesses and the open weaknesses are what a
session needs; this is what it consults.

Note how often a finding turned out to be in the harness rather than the game.
Check what the simulated player actually did before concluding the game is at
fault.

### Fixed

- **The SOC said where an attempt was raised, naming where it was held.**
  "The activity we raised around X has stopped" named the step the attacker
  gave up on, which need not be where the SOC first saw them. It now says the
  activity stopped at X. The holding test fails on the old wording.

- **The stalled-programme reminder said a blocked programme stood still.**
  "One of your programmes is blocked and will not move until somebody clears
  it", but every blocker in the content multiplies the day's progress by
  0.4 to 0.65; none stops it. It now says the programme is still moving at a
  fraction of its pace. A test blocks a programme for a week, sees it move,
  and fails on the old wording.

- **Investigations reported findings the year had made untrue.** Several
  letters that carry a finding are kept away by a situation or by the
  programme that fixes it: no stalled privileged access vault in the tidy
  year, no unexercised response plan the year after a breach, no public
  storage buckets once the cloud programme is done. The investigations that
  carry the same findings had no such gate. Over 64 engaged years
  (`stale-ev.ts`, scratch), 46 years saw 60 such reveals; the commonest were
  the vault in tidy years through control testing, and "No exercise has been
  run in two years" through the readiness review after a breach. Evidence can
  now declare `staleWhen`, and the reducer's one reveal path does not reveal
  it while that holds; twelve findings carry the facts their letters were
  already gated on. After the change none of those reveals remain; the 34
  left are findings the year had not contradicted (the vault while the
  identity programme is still running, the lapsed retainer). A content test
  requires every letter's situation or completed-programme gate to appear in
  its evidence's `staleWhen`, and found three more (the false-positive flood
  once detection is done, the retainer after a breach, the failed restore
  once recovery is built), leaving 26 unrelated reveals; an engine test fails
  with the guard removed. The first version skipped the reveal in the reducer
  only, and the enquiry's completion report, written from what it collected,
  still listed the skipped finding under "What came back"; the investigation
  now leaves a stale finding out when it collects, after its random draw so
  the year's other draws do not move, and a test of an after-breach readiness
  review fails without it.

- **A recovery test reported somebody else's failed one.** The letter about
  the restore test "abandoned after eleven hours" is kept out of the tidy and
  after-breach years, whose openings say the backups have been restored, and
  out of any year that has built or tested recovery. But the recovery test
  investigation revealed the same finding as its guaranteed evidence, with
  no conditions: in 37 of 37 tidy and after-breach years that commissioned it
  (`backup-ev.ts`, scratch), the player ran a restore and got back "Last
  recovery test did not complete". The investigation now reports its own
  restore, timed from the request, and its control assessment still says
  how good the backups are; the predecessor's failure arrives only through
  the gated letter, which still reaches 10 of 10 years in the other two
  situations. The recovery hypothesis needs only the recovery tag, which the
  new evidence carries.
  That change had a knock-on the tests did not see at first: a ransomware
  incident's "Recovery that had never been timed" was kept away by the old
  finding being known, so a player who had run the test would have been told
  it was never timed. The line now also stays away once the timed restore is
  known, and in the tidy and after-breach years, which began with a restore
  behind them; a test evaluates it in each case and fails on the old
  condition.

- **The threat hunt said two things, and both were usually wrong.** Eight
  days after *Commission a focused threat hunt*, a delayed effect set the
  ransomware actor back and said "The hunt disrupted activity that had been
  running through vendor access"; separately, Jo's "The hunt came back clean"
  could arrive any day from day 50. The anomaly is put to the player when a
  campaign is live *or* ransomware pressure is merely high, so over 174 years
  that hunted (`hunt-probe.ts`, scratch) 158 had no campaign to disrupt, 14 of
  the 16 that did were still told it was clean, and 22 heard it was clean
  before the hunt had reported. The option now schedules two letters for the
  day it reports, gated on whether a ransomware campaign is live: the clean
  one as before, and a new one saying what the hunt found. Both carry the
  setback and the coverage-gap evidence, so the mechanics are unchanged.
  After the change: 16 of 16 live years hear it found something, 158 of 158
  others hear it was clean, none early and none both.
  Two notes on other options' setbacks made the same claim unconditionally:
  suspending the vendor access "mid-operation" (the same anomaly, so no
  operation in about nine years of ten) and removing the provider's access
  closing "a route the extortion actor was working". They now say what is
  true either way, and a content test refuses a setback note that claims an
  attack was under way.

- **Two cards named a timescale their effects did not keep.** *Renew with a
  rewritten scope* said "Takes three months to take effect" and took 75 days;
  *Replace the provider* said "Six months of your team's attention" and gave
  the SOC analyst back after 150, and it costs SOC capacity, not the player's
  attention. They now say "about ten weeks" and "The SOC is a person down for
  five months". A content test reads every card that names days, weeks or
  months and holds it to the option's last delayed effect within a tenth; at
  a fifth it let both old lines through, so the tolerance is the tighter one,
  and the old content fails it by name.

- **Two programmes, one team promised a slip it never made.** The card for
  *Prioritise identity* said "Segmentation slips", *Prioritise segmentation*
  said "Identity slips", and *Run both* said "Neither is delivered quickly";
  45 days later Stefan wrote that segmentation "is where you left it" or that
  neither had "moved much". The only effect on delivery was +0.06 to the
  favoured programme (no engine code reads the `priority.*` flags). The
  programme that loses the architecture capacity now loses progress through
  the reducer: 0.05 of segmentation's 240 days or 0.06 of identity's 200,
  about twelve days each, and running both costs each 0.03, about a week, as
  well as the morale it already cost. The letters say "behind where it would
  have been" rather than claiming the work stood still. Milestones are
  recorded by id, so a lower figure cannot fire one twice. A test takes each
  option through the decision and fails on the old content.

- **The audit follow-up misplaced the spring.** The Q4 follow-up and its
  decision said the dates were committed "in the spring". The audit finding
  arrives on day 45, 15 February, and the programme option is not its default,
  so it is chosen within the fortnight: 120 of 120 years that took it did so on
  day 45 (`audit-day.ts`, scratch). Both now say "early in the year". The
  close's "by the autumn it was a console nobody watched" rested on a letter
  that lands 90 days after a decision answered between days 50 and 64, so
  between 20 May and 3 June; it now says "by the summer". The
  other month names in the content were checked against the calendar in
  `src/game/time.ts` and the days their messages can arrive.

- **The chair's year-end request assumed papers.** "I have read your papers
  this year, and I will notice if they do not match" reached every year with
  an open risk, and so did the reply to *Lead with the risks you raised*,
  "the risks you have been bringing me all year". Over 30 years that wrote no
  paper and raised risks, all 30 got both (`prio-papers.ts`, scratch). Each
  now has a twin gated on `review.papersWrittenAtLeast`: the request says the
  committee has had no paper from you, so this is the first thing of yours it
  will read, and the reply says the committee will be hearing of all three
  risks for the first time and he will be asked how long you have known. The
  decision's own context no longer claims he read "every paper you sent".
  After the change, 30 of 30 paperless years get the unread request, and none
  of the 60 years with a paper do; no year gets both. Dropping the gate fails
  the test.

- **The chair quoted a paper that was never written.** In the tidy
  inheritance, *Correct it quietly in the next paper* is always answered on
  day 55 and draws the chair's "The multi-factor figure in your last paper is
  twenty points lower" on day 115, and the only paper between them is the
  first quarter's. Over 36 years that took the option, the 12 that missed
  that paper still got the letter (`tidy-probe.ts`, scratch). A
  `review.papersWrittenAtLeast` condition now gates it; a year without the
  paper gets Fenella instead ("The committee met without a paper, so it is
  still working from last year's number … it is ours"), and the close says
  "the committee met without one" rather than "You corrected … quietly". After
  the change, 24 of 24 letters follow a written paper. The situation tests
  had played the option without papers and so asserted the old letter; they
  now play both paths, and removing the gate or the closing line fails them.

- **A choice's delayed consequence was a toast, and one contradicted the
  game.** Twenty decision options carry a consequence that lands weeks later
  with a note — "Somebody senior on the part of the team you asked to push
  through has resigned", "Legal has flagged the notification timing" — and the
  note was a toast, gone in a moment at speed. It now also arrives as
  *Followed up: <decision>* and sits in *Came back to you* with the other
  follow-ups. Reading them together turned up two faults. "Support now,
  compensate afterwards" fixed checkout on day 60 and said so; on day 80 the
  CIO wrote that he could not find the work and that it had quietly not been
  done. His trust cost was already reasoned as the work never being *visible*
  to him, so the message now says that: the fix window closed and he has not
  seen what it fixed. And "Wait for the scheduled meeting" had the chair ask,
  six weeks on, why he was hearing it late — seventeen days after he had
  written to say exactly that; the later note now records the minutes instead.
  Tests check the follow-up message, its place on the briefing and the
  corrected wording; removing the message fails the first. The toast for a
  hire also names the team it joined.

  Reading every option beside the message it schedules found three more.
  *Take the window now* on the restore test always drew "The restore came
  back in three and a half, the runbook held" whatever the backups were like,
  though the same choice had just assessed them. The success message now needs
  backups at least moderately effective, and a second message says the restore
  ran past the window and was not done by the runbook. Over 20 guided years
  that built recovery and took the window, 14 read the first and 5 the second.
  A test holds the split and fails when the condition is removed. Two timescales were wrong: opposing the launch delays it 45 days,
  not "three months", and waiting on the HR provider's update was five weeks,
  not six.

- **A business objective could fail in silence.** Delivery ("Launch the new
  customer platform delivered.") and slipping each had a notice; failure had
  none, so a player's first word that an objective had missed its date was
  *failed* in the annual review — three of them in one high-pressure year read
  this session. The owning executive now writes on the day it misses ("Missed:
  Launch the new customer platform"), and the day carries a toast. A test moves
  an objective's date to the next day and checks the notice, its day and its
  sender; removing the notice fails it.

  Programmes had the same gap at the other end. Enquiries announce
  themselves ("Completed: Privileged access review"); a programme — the
  largest thing a player builds — finished with a toast about its last
  milestone and nothing in the inbox. It now writes "Delivered: Identity and
  privileged access uplift", names the controls its milestones strengthened
  (read from its own content, counted and separated because several control
  names carry their own "and"), and says an assessment is still the only way
  to know how well they now work. A test drives the identity programme to
  completion and reads the message; removing it fails the test.

- **A machine read of everything a year says.** Over 72 campaigns — every
  mode and every starting situation, half engaged and half neglectful — every
  message, decision text, board reaction and line of the close was checked
  for unrendered tokens, leaked values, doubled words and spaces, stray
  punctuation, articles and plurals; every authored string in the content
  files was checked the same way. Three things turned up: "0 of 1 programmes
  you started reached completion", one evidence line that began in lower case
  ("you answered all 22 of the decisions put to you"), and the list under
  *What you never looked at*, whose items begin lower case because the same
  phrases are joined into a sentence in the narrative. The first two are
  fixed at the source and the list capitalises its items when it shows them.
  `tests/engine/text-lint.test.ts` keeps four of those campaigns under the
  same checks; reverting either fix fails it by name.

  The same pass compared what options say about money with what they spend.
  The dialog prints an option's price beside it, and three options said it
  again in their own words ("Costs £250k", "Costs £300k", "£180k"): the two
  situation decisions from this session and the fourth-quarter platform
  redesign. The words are gone, and the content test that already stops a
  price being stated as both effect and requirement now also stops it being
  written into the option's text.

  And options that promise nothing: "Defer until after the launch" on the
  retention decision said *Nothing changes* and cost Legal's trust and a
  standing concern. It now reads *The data stays where it is* and *Legal will
  remember that you deferred it*, and a content test fails any option that
  says nothing changes while moving trust, confidence, morale or money
  without naming it.

  Attention was the other half of that. Five options spend attention when
  taken; three said *Costs attention* in their own words and two — testing
  restores outside production and reviewing the Kestrel boundary — said
  nothing, so the player found out when the week's count dropped. The card
  now prints the attention an option spends beside its price, from the same
  requirements the engine checks, and the hand-written lines are gone. A test
  reads the flagship decision's card (one option £300k, one 1 attention) and
  fails when the cost is dropped from the view.

  Last, the glossary: the content says *extort…* 27 times and *threat hunt*
  five, and neither was defined for a player who does not know the subject.
  Both have entries now, so the chips appear under the text that uses them,
  and the glossary test holds them like the other terms of art.

  The reverse check — options that warn of a cost the game never charges —
  found one: the fourth-quarter platform redesign said *Engineering time in
  peak season* and took none. It now takes half of engineering's capacity for
  forty days, as the executive-exception redesign does for identity. The
  audit decision's *Requires real budget and capacity* described what keeping
  the promise would take rather than what the choice costs, and now says so:
  *Meeting them means funding and staffing a programme*. A content test fails
  any option that warns of capacity and takes none.

- **"A programme has stalled" arrived on the same day as the blocker it
  reminded about.** The reminder fired on any unresolved blocker, so it often
  landed beside the programme's own "Blocker: …" message and said the same
  thing less exactly. `programme.anyBlocked` takes an optional `forDays`, and
  the reminder waits for a blocker a week old. The existing test that checks
  the reminder is honest now also checks the wait, still sees it arrive, and
  fails with the wait at zero. The year view's loading line is announced as a
  status to screen readers.

- **The last day of the year was "Week 53".** 364 days is 52 weeks and a day,
  so 31 December opened a week 53 in the header and the Briefing masthead,
  seen by every player reading the review. The label stops at 52; a test holds
  it and fails with the cap removed. Found by running the playthrough harness
  after the screenshot gallery turned out to have been broken since the
  late-year decisions landed (it now takes the first reason a decision offers,
  as the main suite does). A high-pressure close read "1 recovery exercise
  completed, one of them a production restore"; the singular now reads "1
  recovery exercise completed, a production restore", held by the existing
  restore test.

- **The first load had 1.4 kB of headroom left.** After this session's content
  and review lines it stood at 258.6 of 260 kB, so the next message written
  would have needed another budget rise. The year view — the annual review
  and the timeline, opened a few times a year and read once at the close —
  now loads when first opened, like the organisation graph. First load
  255.6 kB. The size script lists it as a chunk that must stay lazy, and now
  also fails if such a chunk stops existing at all, which the leak check alone
  could not see: restoring the static import fails it by name.

  The first version of the split hung the whole-year browser test for its
  full five minutes: at the close the review showed a loading line for a
  moment, the test looked for "Annual review", did not find it, and waited
  on a Skip ahead button that no longer exists once the year is over. A
  player would have seen the same line flash. The year view is now fetched
  in the background as soon as a campaign is open — out of the first load,
  not out of the session — and the test accepts the loading line as the
  close having arrived.

- **A situation's own decision was forgotten by December.** The close
  answered the question each situation began with, but not the decision it
  alone asks: whether you paid the attackers, bought the platform, or
  restated your predecessor's figure never appeared again. The close now has
  a line for it, with what came of it where the year showed — "you refused
  and said nothing. They published, and the regulator asked when you had
  known"; "you bought the platform, and by the autumn it was a console nobody
  watched". A test plays each of the nine options to the close and reads the
  line, and checks the usual year has none; dropping the line fails it.

- **A finished year had no way to start another.** The start screen shows
  only when no campaign is loaded, and nothing unloaded one: the annual review
  ended with "Export this campaign", the guide did not mention reloading, and
  a player who wanted the second year the starting situations exist for had to
  guess that refreshing the page would get them there. The review now ends
  with *Another year*: it names the situation this year began in and the
  other three, and *Start another year* saves, closes the campaign and returns
  to the start screen, where the finished year stays in the list. The browser
  test that plays a whole year now presses it and checks the start screen and
  the saved year.

  The same was true mid-year: switching to another saved campaign needed a
  reload. The header now has a save-and-close control beside Save, with a
  browser test that closes a campaign a few days in and reopens it at the same
  day from the start screen.

- **Three small things found reading whole years after the board change.**
  - *The Board screen never said when the paper was due.* An unwritten paper
    now costs something when the next quarter closes, so the screen says the
    date: "Write it by 1 July. After that the committee meets without it, and
    notices." A browser test reads it.
  - *An idle year's review counted "0 of 0 decisions you took carried a
    recorded rationale"* beside "28 decisions lapsed and were taken by
    default". The first line is left out when there is nothing to count; a
    test holds it and fails when the line is restored.
  - *Enquiry and programme messages signed "Stefan Alvarez"* beside authored
    messages from "Stefan Alvarez, Head of Security Architecture". Senders the
    engine builds now carry the title too, and a test plays two hundred days
    and checks every message from a person is signed the same way.

- **CI went red on the size budget again, for the same reason as before.**
  `pnpm check` still did not build or run `pnpm size`, so a push that passed
  every local check failed CI's budget step: the first load was 257.4 kB
  against 255. The earlier entry below found exactly this and fixed the
  measurement, not the gap. `pnpm check` now ends with a build and the size
  budget. The budget itself was raised deliberately, to 260 kB with the
  campaign chunk at 77: the owner asked for more late-year content and more
  replay value, and the fourth-quarter decisions, the four starting situations
  with a decision each and the reworded recurring messages cost about 12 kB of
  campaign between them. The next content that needs room is a decision too.

- **A third of the inbox was word-for-word repeats.** Over 30 CISO years,
  41.5 of 145 messages a year (29%) repeated one already received exactly, and
  one message could arrive eight times in the same words; ten recurring events
  — the benign alerts, finance phishing, the portal scanning, the quiet week
  and six others — were nearly all of it. Events can now carry `variants`,
  taken in turn by how many times the event has fired (a count in state, not
  a draw, so nothing else in the simulation moves: 145.3 messages a year
  before and after). Each of the ten has three. Repeats fell to 14.9 a year
  (10%), and the most any message repeats in a year to three. The two that
  fire most — the benign alerts and the finance lures, up to eight times a
  year — then got three more each, which took repeats to 8.9 a year (6%). A content test
  checks the ten say four different things before cycling, and an engine test
  that a year's second firing is reworded; sending the original body again
  fails it.

- **The board's standing read "Neutral" whatever the player did.** The home
  screen shows board confidence all year. Over 40 CISO campaigns it read
  *Neutral* on 86–90% of days for an idle player, one who only answered
  decisions, one who engaged fully and one who engaged but never wrote a board
  paper; the full engager ended at 0.54 and the one who skipped every paper at
  0.47, both *Neutral*. Two causes: confidence was pulled 1% a day towards the
  executives' average trust, which itself drifts to the middle, so a good paper
  was forgotten inside two months; and a paper never written cost nothing — the
  quarter was simply overwritten by the next.

  The pull is now 0.4% a day, so a paper is remembered for about a season, and
  a quarter whose paper is still unwritten when the next one closes (or the year
  ends) costs 0.08, with a letter from the chair and a line in the review's
  communication evidence. A late paper, written any time before the next
  quarter closes, is not charged. Same 40 campaigns after:

  | | end | days *Solid* or better | end bands |
  |---|---|---|---|
  | Idle | 0.29 | 0% | 37 *Questioning*, 3 *Fragile* |
  | Answers decisions only | 0.33 | 0% | 38 *Questioning*, 2 *Fragile* |
  | Engaged, never writes a paper | 0.32 | 0% | 36 *Questioning*, 4 *Fragile* |
  | Engaged, writes every paper | 0.65 | 40% | 24 *Solid*, 15 *Neutral*, 1 *Questioning* |

  `tune.ts` reads board 0.25 passive against 0.62–0.68 for the three active
  styles; the ladder, whose player writes every paper, reads 0.79 in all three
  modes (was 0.61–0.63). Incidents still do not move the board directly: it
  judges what it is told, through the papers. Tests in
  `tests/engine/board-standing.test.ts`; restoring the old pull fails two of
  them and removing the charge fails one, by name.

- **A starting situation was felt in two messages and then forgotten.** Each
  non-default situation now asks one decision the others never see — after the
  breach, the attackers return with an extortion demand (notify, stay silent,
  or pay); with new money, the board wants a flagship purchase (buy it, fold
  the money into programmes, or show them the plan); in a tidy inheritance, the
  predecessor's coverage figure turns out to have counted staff only (restate,
  correct quietly, or leave it). Every option has a reply of its own later in
  the year, and a bought platform reads differently depending on whether the
  detection programme is feeding it. Tests check each decision arrives only in
  its own year and each reply is reachable; mutating one gate and one reply's
  condition failed both. Defaults are the free options, because a decision
  left to expire does not check its budget.

- **Four smaller things the transcripts found, and a dialog bug the fix for
  one of them exposed.**
  - *"Never independently assessed"* named controls the player had assessed,
    once the 200-day assurance had lapsed: a year that ran the privileged
    access review in January was told in December that privileged access was
    never assessed, beside "0 of 13 controls were independently assessed".
    Lapsed assurance now says so, with the day, and the count separates
    controls assessed during the year from those still current at the close.
  - *A penetration test's findings arrived the moment it was scoped*, and the
    full scope, whose finding is that the legacy estate routes into the core,
    assessed no control at all. Both paid scopes now report a month later,
    with a note that the report is in, and the full scope assesses
    segmentation, which is what its finding is about.
  - *"The acquirer does not know"*, in a year built around acquiring Kestrel,
    means the card-acquiring bank. It says so.
  - *The glossary chips only appeared on risks*, while the words a newcomer
    stumbles on — break-glass, jump servers, credential stuffing, tenancy —
    are in the messages and decisions. Both carry them now.

  **Stacked dialogs.** A word inside a decision opens the glossary as a
  second dialog over it, and every dialog listened for keys on the document:
  Escape closed the decision underneath, and Tab was pulled into whichever
  panel's trap ran first. The dialog primitive now keeps a stack; only the
  topmost handles keys, and the page stays locked until the last one closes.
  A browser test opens a decision, taps a word and checks Escape closes only
  the glossary; with the stack removed it fails.

- **The messages said things nobody had checked, on days that did not fit.**
  From the same three transcripts. Every claim was checked against the
  event's conditions and the engine before anything changed; the ones that
  held are fixed, the ones that did not are listed at the end.

  **Two engine defects behind several of them.**
  - *The opening spine ran four days apart.* Every scripted beat carries the
    `spine` tag, and same-tag events must be four days apart, so the beats
    queued: the CEO's "you have had one morning" arrived on day 5 after a
    meeting that "starts in 23 minutes" on day 1, and the team introduced
    itself on day 9. Pinned beats carry authored days and are now exempt from
    the spacing; the CEO asks on day 2.
  - *A scheduled message skipped every check.* Once-per-campaign and its own
    conditions were both ignored, so a second incident resent the first one's
    callbacks — an invoice asking what we are buying "before the next one",
    after the next one. Scheduled messages honour both now.

  **Recurring messages said the same number every time.** "A third
  comparable business has been extorted this quarter", from day 13 and five
  times more; the same eleven finance staff seven times; the same printer
  eight times; sixty-two leaked addresses four times; "six days" of scanning;
  "four points" of drift; a four-hour outage that always lasted four hours,
  still calling the player "the new person" in October. Each now describes a
  pattern, and a content test fails any repeatable message that states a
  count; it caught all three threat texts when the old file was put back.

  **Messages that claimed a state.** A new identity engineer "starts on
  Monday" three times a year, for a team that may have hired nobody: it is
  the hire "Recruit properly" pays for, told once, only to a year that
  recruited. "Nothing to escalate this week" landed between urgent messages;
  a new condition, `inbox.noUrgentWithin`, holds it to a week with none. "If
  something happens tomorrow, we will be inventing the process" arrived
  after an incident run under formal command. The card data discovery
  arrived months after the decision about it. Corvus's missing second factor
  was told twice as news. "A material risk at severe residual exposure"
  checked nothing about severity, which the new bands make rare. A closing
  message counted every decision taken while an incident ran as a "response
  decision", including an unrelated card data fix.

  **The calendar.** A launch "taken with your conditions attached" before it
  happened; "we have moved the launch" for a launch that went live six days
  later; "six months on" at three months; a committee "six weeks away" three
  weeks before it sat; a diligence window "closing in six weeks" nine days
  before completion; the peak trading freeze announced after peak weekend,
  and an identity decision offering to act "before the freeze" a fortnight
  into it; a recovery blocker citing a peak that had not begun.

  **Decisions.** "Isolate the route in" said the route ran through
  third-party access whatever it was — one year's ran through the build
  pipeline. Cutting access contains the actor in the model regardless of
  route, so the decision is now about cutting external access, which is true
  of every family that uses it. The legacy option accepted exposure "on the
  basis that the platform retires this year" beside "migration is at least a
  year away". A quiet-year budget said "nothing happened" to a year of
  phishing and leaked credentials. The post-incident option offered to "show
  the path" that the incident's own closing message reserves for the year end.

  Tests: the spine lands on authored days; a scheduled once-message is sent
  once and not at all when its condition fails; a quiet week never follows an
  urgent message; no new starter for held vacancies; response decisions
  counted as such. Each mutation-checked. Coverage unchanged at 132 of 134,
  the same two gated behind one Q4 decision; soak of 400 clean.

  **Checked and left.** "Restoration of affected services" after a data
  theft: the model does disrupt a service, and the closing message names it.
  Executive assistants and privileged access: reworded to the delegated mail
  and file access such a flow plausibly covers, rather than removed.

- **The annual review contradicted the year's own record, in all three modes.**
  Graded by reading three whole years end to end — `pnpm ladder transcript`,
  one per mode, every message, decision and line of the close — with three
  reviewers reading the message streams in parallel and each of their claims
  checked in source before anything changed. Seven defects in the close, all
  real:

  - **"Nothing you did went near it"** counted programmes and enquiries only.
    A year that chose to fix card data outside the payment environment on day
    244 was told nothing it did went near the card data risk; another that
    enforced the retention policy was told the same of customer records.
    Decisions the player chose, not ones that lapsed, now count as having gone
    near whatever risk their effects touch. They do not enter the score: the
    game offered them, the player did not pick the risk.
  - **"Among it"** named the most material risk anything could have reached,
    not anything the player's work was aimed at. It names the player's own
    top target now.
  - **Resilience read Solid beside "the consequences ran well beyond what the
    business could absorb".** The sentence was picked from its own threshold of
    0.5 while the band sat on 0.52..0.75; it is led by the band now, as
    prioritisation's already was.
  - **Every hidden dependency was listed twice**, as "stayed hidden" and again
    as "was never traced", because the edge case never drew the line the node
    case did between never seen and taken on trust. And the screen showed the
    same list four times: in the opening summary, the dimension's sentence, its
    evidence and its own section. The dimension now counts — never discovered,
    known about but taken on trust — and the list appears once. Its sentence no
    longer says "never brought into view" under "38 of 38 systems were ever
    brought into view".
  - **"You relied on backups without ever testing it"** printed beside "1
    recovery exercise completed". Two things: an assumption whose test the
    player met was still counted as untested if the truth had changed first,
    and a test before the reliance began does not count by design, which the
    player cannot know. The first is fixed; the second is now stated with the
    day the reliance began.
  - **"Nexora met 4 of 5 objectives; 1 were missed."**
  - **Business enablement blamed "security friction you chose to impose"** on
    every year, including one that ran no programme, and said "some of that"
    of a single objective.

  Also: the reasoning section printed "nothing this year contradicted it" on
  every line, six times over; it says so once for the section now. Tests hold
  the review to agreeing with itself across three modes, building and idle, and
  two arranged cases for the branches a played year rarely reaches. Every fix
  was mutation-checked, and two of the first round of tests survived their
  mutation because no played year reached the branch, which is why the
  arranged cases exist.

  **Checked and left.** A reviewer read "among it: the build pipeline" as
  unearned; the architecture review the player commissioned is aimed at it, so
  it stands. "Multi-factor authentication was in place" beside "never
  independently assessed" is two true things: the reconstruction reveals what
  was there, and the player never checked it.

- **A player's investment had a visible cost and an invisible benefit.**
  Grading with `tune.ts` at its default of 25 campaigns a style put the passive
  player, who builds nothing, on the fewest incidents, the most clean years and
  the lowest worst consequence of the four. At 150 a style that ordering
  dissolved: incidents read 1.08 to 1.27 across every style, within noise of
  each other, while objectives achieved fell from 4.9 of 5 for the passive
  player to 2.3 for the balanced one. The cost of security work was plain and
  the benefit was not, so doing nothing looked like the strongest play.
  `tune.ts` now prints a standard error beside every mean, because the first
  reading was noise and nothing on the line said so.

  **Programmes do work; the register could not show it.** A new harness,
  `scripts/efficacy.ts`, plays the same seeds idle and with one programme
  started on day 5 and its blockers cleared, 150 seeds a programme. Identity
  and detection cut incidents after day 180 by about a fifth (0.83 idle
  against 0.66 and 0.67, two standard errors). Recovery leaves frequency alone
  and cuts the worst late consequence by about a quarter (0.29 against 0.21),
  which is what recovery is for. Third-party and cloud move no incident family
  measurably in one year. But the largest residual reduction any finished
  programme produced on any risk was 0.02, about a third of one band, so a
  player who funded and finished a programme saw no risk change band, and the
  function that describes movement in words, `describeChange`, was never
  called by anything.

  Each risk now keeps its first assessment and, after a fortnight, says which
  way it has moved since: a green Improving or an amber Worsening on the list
  and the briefing, a sentence in the detail, and nothing at all when it has
  not moved. Measured at the close against the first assessment, an idle
  year's register reads worsening 69% of the time, unchanged 23%, improved 6%;
  a year with the recovery programme finished reads unchanged 51%, improving
  48%, worsening 2%. On the recovery risk itself, on seeds that deal it, an
  idle year was told it was worsening 10 times in 10 and a funded year that it
  was holding 7 in 10. That is the feedback the core loop was missing, and it
  is read off the simulation rather than added to it. Tests pin the baseline,
  the fortnight's silence and the two readings; both mutations were checked.

  **Left.** The third-party and cloud programmes are real spend with no
  measurable effect on incidents inside a year. Whether that is honest (their
  risks rarely materialise in twelve months) or a weakness the player should
  not have to discover is a question about what the game is teaching, so it is
  recorded under Known weaknesses rather than tuned.

- **On a phone, the inbox and the organisation list ran off the right edge,
  and the layout test could not see it.** Seen in screenshots of a campaign
  played to day 200, not caught by any test: at 320px the inbox list measured
  456px and the organisation list 840px, so every sender, subject, badge and
  description was cut off at the edge, and the inbox's day column was never
  on screen at all; the briefing ran 28px wide. Fifteen grids set a column
  template only from a breakpoint up, so below it the single implicit column
  sized itself to the widest line that will not wrap — a truncated subject —
  and two desktop templates used bare `fr` tracks with the same property.
  Every grid now has a base `grid-cols-1` and `minmax(0, …)` tracks. The
  layout check measured only the page, but the main region is a scroller of
  its own and absorbed the overflow; `expectNoHorizontalScroll` now measures
  it too. With the old layout both layout tests fail at 320px, including the
  day-one test, so this was broken from the first screen.

- **An enquiry came back without saying what it found.** Every completion
  message in a year read end to end was the quality line alone — "answered
  part of the question and raised others" four times — and the findings were
  on another screen. The message now names what came back ("What came back:
  Privileged access recertification is 11 months overdue; MFA exception
  register holds 214 accounts; …"), counts what it only confirmed, and says so
  when it found nothing new. Presentation only; test in
  `tests/engine/messages-honest.test.ts`.

- **The tuning harness's defensive player was not defensive.** It took each
  decision's last option — as often "leave it for now" or "note it and keep
  watching" as anything protective — and started all six programmes on
  consecutive twenty-day marks, which overloaded the team and finished 1.7 of
  them. It read 1.10 incidents a year against the passive player's 1.08, which
  looked like building not paying. It now takes the option whose effects do
  most for security and starts the next programme only once the last is past
  halfway, as every style does. Over 60 CISO seeds: passive 1.08, business
  0.87, balanced 0.77, defensive 0.70 incidents (±0.10–0.11), worst
  consequence 0.40 / 0.28 / 0.32 / 0.22, objectives 4.9 / 4.2 / 3.7 / 4.3.
  The harness, not the game.

- **The start screen had never been audited.** Every accessibility test began
  after "Begin your first day", so the first screen anyone sees, now carrying
  the situation picker, was outside the audit. It is audited in both themes,
  with a saved campaign listed and the replay settings open: clean, and it
  fits at 320px. The Continue list read "Day 1 · ciso" whatever situation a
  campaign began in, so two saved years looked alike; it names the situation
  now, tested in the browser.

- **Every year began the same way.** At the owner's request for replay value,
  a year can now begin in one of four situations: the usual opening, after a
  breach, with new money and short patience, or with a tidy inheritance, or
  one drawn from the seed. Each is data — a budget and setup effects through
  the one reducer — with an opening message, a mid-year beat and an answer in
  the annual review to the question it started with. Reading the new openings
  against existing content found four messages each situation made untrue (an
  abandoned restore test and a stalled vault in a tidy year; an unexercised
  incident plan and "could it happen to us?" after a breach), now guarded with
  closing guards so they stay paced. Tests in `tests/engine/situations.test.ts`
  (mutation-checked on the seed draw and a guard) and a browser test of the
  picker. Soak 1,000 and coverage now draw a situation per campaign: clean,
  and all six situation messages reached. Reading a year in each situation
  afterwards (`pnpm ladder transcript ciso <seed> <situation>`) found one
  more: an after-breach year was told on day 136 that "the last restore test
  was abandoned fourteen months ago", after a real restore last quarter. It is
  guarded for that situation too.

- **Detection stopped paying off once steps could hold.** Measured over 150
  seeds: 79% of campaigns are seen eventually whether or not anything is
  invested, because detection is rolled on every active day, so the detection
  programme could not add sightings; and the chance of pushing a seen actor out
  was read from the attacked step's preventive resistance, so a better SOC
  barely acted on what it saw — 0.06 evictions a year idle, 0.08 with the
  programme. Controls now carry a `responseStrength` (SOC 0.8, endpoint
  response 0.5, incident readiness 0.3), and eviction on a sighting is the
  step's detection times the best response capability. Evictions go from 0.13
  a year idle to 0.29 with the programme, and second-half incidents to 0.54
  against 0.73 idle, second only to identity. An idle year barely moves (0.59 /
  1.23 / 1.68 against 0.63 / 1.26 / 1.73), so nothing was compensated. The
  engaged ladder reads 0.45 / 0.65 / 1.05. Test in
  `tests/engine/response.test.ts`, which fails with the old formula.

- **A control could delay a breach but almost never prevent one.** An actor
  kept trying a step until it passed and gave up only after 70+ days without
  progress, so on the supplier routes about 70% of campaigns became incidents
  whether or not the third-party programme had halved the entry step's pass
  chance (0.43 incidents a year through those routes idle, 0.455 with it, 200
  seeds). That is why identity and third-party moved no totals. At the owner's
  choice, a step that resists is now abandoned: each day an attempt fails the
  actor gives up with chance 0.2 × resistance², so an unhardened step (0.1 to
  0.17) barely changes and a well-controlled one (0.35 and up) holds. Holding
  also made the game easier for everyone — the engaged ladder fell to 0.38 /
  0.50 / 1.00 — so campaigns start a third more often (0.006 to 0.008), which
  puts an idle year back where it was: 0.63 / 1.26 / 1.73 incidents against
  0.72 / 1.25 / 1.74, 150 seeds each. What building earns is now visible: the
  engaged ladder reads 0.45 / 0.75 / 1.15 over 40 seeds (0.40 / 0.85 / 1.68
  before), so on high pressure a player who builds sees a third fewer
  incidents where before they saw almost none. Over 150 seeds second-half
  incidents read identity 0.56, segmentation 0.65, cloud 0.67, third-party
  0.69 against 0.75 idle; third-party cuts its own routes from 0.36 to 0.28.
  A hold used to leave no trace, so a control that worked read the same as a
  year nobody tried. The campaign now records where it held; if the SOC had
  seen the attempt it reports that it did not get through (0.22 times a year
  idle, 0.60 with identity), and the annual review counts the attacks that gave
  up, naming only systems the player has mapped. Tests in
  `tests/engine/holding.test.ts`, which fail with holding switched off. Soak
  1,000 clean. One incident test read messages by family and date and, with two
  incidents of one family running at once, counted the other one's decisions;
  it reads the incident's own closing message now.

  Re-photographing the guide from the new year found two more. An incident
  still running when the year ended kept its "Incident active" panel above the
  annual review, offering a response log for decisions that could no longer be
  taken; it is hidden once the year is over, and the review already says the
  incident was still running. And a year that agreed a budget cut in a quiet
  autumn and was then breached on day 347 read "Nothing happened this year"
  beside "tested the organisation on day 347"; the cut is only offered while
  nothing has happened, so a later incident now reads "The year did not stay
  quiet". Tested, mutation-checked. The guide's seed is now guide-3, whose
  prepared year still has an incident with the identity programme working.

- **Two programmes' controls did not count on the steps they claim to fix.**
  Asked to make third-party and cloud pay off, the attack paths showed both
  controls on real steps but not against the techniques there: cloud posture
  did not count against persistence, though the programme's own milestone
  makes pipeline credentials short-lived and scoped, nor against lateral
  movement between tenancies; supplier access governance did not count against
  credential stuffing on the partner portal. Both now do, and "Standing access
  removed" shrinks the supplier entry points (exposure and weakness on Corvus,
  Lattice and remote access), as the cloud programme already does for the
  pipeline. Over 150 seeds cloud's second-half incidents read 0.69 against
  0.86 idle (0.73 before). Third-party cuts its entry steps' pass chance from
  0.41 to 0.20 but still does not reduce incidents through the routes it
  targets, for the reason now in CLAUDE.md's known weaknesses: in this threat
  model a harder step delays a breach and rarely prevents it. The ladder over
  40 seeds reads 0.40 / 0.85 / 1.68 incidents (0.40 / 0.88 / 1.63 before);
  soak 1,000 clean.

- **The fourth quarter had least to decide.** Four decisions now follow up
  earlier choices, each earned in Q1–Q3 as `docs/CONTENT.md` requires: the
  Corvus renewal (anyone whose supplier-access decision was made or lapsed),
  the Kestrel quarantine (only after quarantining it), the audit follow-up
  (only after committing to a funded programme with dates) and next year's
  priorities (only with a risk raised). Presenting the audit programme as on
  track is answered by the auditors finding it so only if the identity
  programme is in fact complete, and by their finding production behind the
  account otherwise. Q4 decisions went from 2.7 to 4.8 a year on a fixed
  policy, and every choice is tested to reach its reply.

- **The close told two incidents backwards, and called a running one over.**
  From a high-pressure year read end to end: the story narrates the worst
  incident first whatever its date, then listed the others as "again", so it
  read "tested the organisation on day 358 … the same kind of incident again on
  day 198". An earlier one is now "earlier, on day 198". The same year ended
  with its second incident still running, beside "came through with little
  lasting damage"; every resilience sentence described an ending. A year that
  closes mid-incident now says so in the band's sentence ("with little lasting
  damage so far, but an incident was still running when the year was written
  up"). One of the twelve played years in the review test ends that way. Tests
  for both, mutation-checked.

  An idle CISO year read afterwards found two more of the same kind. Its
  resilience evidence called two data exposures "the same weakness, still
  open" by family alone, beside a story that said the second came "by a
  different route"; the line now claims the same weakness only when the route
  was the same. And a year in which nothing was taken, commissioned or built
  opened "You worked what was in front of you" under the headline "The year
  was decided largely without you"; it now opens "You let the year run
  without you". Both tested, mutation-checked.

- **Toasts could pass in silence for a screen reader.** The toast live region
  was rendered only once a toast existed, so it arrived together with its
  first message, and screen readers do not reliably announce a region's
  initial content: "Campaign saved" and "Campaign deleted" could go unspoken.
  The pause-reason pill had the same shape. Both regions are always present
  now, empty when there is nothing to say. A browser test holds the toast
  region to existing, empty, before the first toast and to being the same
  element afterwards; mutation-checked. Whether the announcements read well is
  for a person with a screen reader, not a harness.

- **A running clock took focus out of every dialog.** Found driving a decision
  with the keyboard alone, which nothing had tested. Every caller passes the
  dialog an inline `onClose`, and the dialog's focus effect depended on it, so
  each render re-ran the effect and each run put focus back on the panel. With
  the clock at 1× the chosen option lost focus within a second, and so would a
  reason being typed into the note. The effect now depends only on the dialog
  opening and closing. And once a decision was taken, the "Decide" button that
  opened it no longer existed, so focus fell to the page body and a keyboard
  player started again from the top; it now goes to the main region. A browser
  test takes a decision by keyboard with the clock running, and fails on
  either defect (both mutation-checked). Focus was otherwise visible on every
  stop, trapped in the dialog, and a skip link is present.

- **Five messages described a weakness after the player had fixed it.** Read
  from the firing days of every date- or state-sensitive message over 60
  campaigns across the three modes and four play styles: "the vault stalled at
  a third of administrators and nobody pushed" arrived on day 288 while the
  identity programme was pushing it; the public storage buckets and the
  cluster's broad read role arrived after the cloud programme finished; "the
  last restore test was abandoned fourteen months ago" arrived after recovery
  was built and tested; "318 of 340 escalations were false positives" after
  the SOC scope was rewritten to measure escalation quality. Each is now
  withheld once its fix is in. Gating them took them out of the pacing — each
  then fired within a day of becoming possible, median day 33 to 107 — because
  the pacing treated any condition as a trigger. A negated condition says when
  a message stops being true, not when it becomes true, so `not`,
  `flag.notSet`, `node.notDiscovered` and `event.notFired` no longer disqualify
  a message from being paced; the five spread across the year again (median
  day 65 to 168), and so does the cardholder-scope message, which an earlier
  fix this session had taken out of the pacing the same way. Tests for each
  gate and for the spread, mutation-checked (unpaced, the storage message
  arrived by day 43 in every year). A high-pressure year read afterwards met
  a sixth — "412 service accounts, nobody owns them" on day 329, after the
  identity programme that puts them under ownership had finished — and a check
  of every remaining weakness report against the programme descriptions found
  three more: the MFA exception register (identity), the pipeline's shared
  production credential (cloud) and Corvus's missing MFA (third-party). All
  four are withheld once their programme completes.

  A service-recovery test sampled health once, at day 132, and on the new draw
  a separate breach reached order management on day 129; it now reads the
  recovery before any later incident touches the service. The ladder over 40
  seeds afterwards reads 0.40 / 0.88 / 1.63 incidents, 0.13 / 0.24 / 0.43
  worst consequence and 0.61 / 0.48 / 0.36 patience left: monotone, and within
  noise of the last 40-seed reading.

- **Two calendar fixes from the first grading had come back.** The earlier
  pass moved the board-risk decision and the identity enforcement decision to
  days where their text was true, but both open on state — a raised risk, a
  programme at 80% — and the fourth year read met each on the wrong side of
  its date: "the next scheduled meeting is in six weeks" on day 70, three
  weeks before the first paper, and "Enforce now, before the freeze" on day
  305, a month into it. Neither is fixable by day. The board text now renders
  `{{nextBoard}}` from the day it opens, the option no longer says six weeks,
  and enforcement is worded to hold before or during the freeze. Tests pin
  both, mutation-checked; `docs/CONTENT.md` now says a date in the text must
  hold on every day the text can appear.

- **Three more messages and one close line from a fourth year read end to
  end** (guided, building). "A quiet quarter — nothing has gone wrong for three
  months" checked only that no incident was running, so it could arrive a
  fortnight after one closed; a new condition, `incident.noneWithin`, holds it
  to ninety days with none running or closed. "Nordic market: local payments
  partner selected — integration work starts next month" is colour, and once
  colour was paced across the year it arrived on day 253 against a market entry
  due on day 280; it now closes on day 190. And the close listed "Behavioural
  Data Lake was taken on trust and never examined" in a year whose incident
  reconstruction ran through it. Both halves are true, so it now says both:
  "was never examined, except by the incident that ran through it". Each has a
  test, and each was mutation-checked.

- **Colleagues reported findings the player already had.** Forty-five
  messages reveal evidence that an enquiry can also reach, and none checked
  whether it had: a player who ran the recovery test was then told by Jo that
  she "went looking for the last recovery test report" and found it abandoned
  fourteen months ago. Measured over 20 campaigns of a player who kept the team
  on enquiries, 29.9 messages a year re-announced only evidence already held,
  about 20 of them once-only discovery reports rather than repeatable sector
  news. Fixed in the event engine rather than in forty conditions: a once-only,
  unpinned message whose every effect reveals something already known is not
  sent, and is not counted in what the pacing has left to spend. Repeatable
  news and anything that also changes the world still arrives. Re-announcements
  fell to 18.4 a year, of which about 3 are once-only (the rest are the
  repeatable threat texture). The cost is volume: that player's inbox reads
  45.0 / 47.7 / 33.5 / 31.8 messages a quarter against 46.8 / 52.3 / 34.4 /
  34.5. It changes no information, and idle incidents over 300 seeds read
  1.363 ± 0.052 against 1.333 ± 0.056; the ladder stays monotone (15 seeds:
  0.47 / 1.13 / 1.53 against 0.67 / 1.07 / 1.73). Tests in
  `tests/engine/messages-honest.test.ts`, mutation-checked. One judgement test
  sampled fourteen idle seeds for a quiet year and found none on the new draw
  path; it now searches up to forty.

- **"Coverage has quietly gone backwards" arrived while the detection programme
  was raising it.** The endpoint-drift message had no condition. It now waits
  for the detection programme not to be running; mutation-checked (it fired on
  days 150 and 255 of a run with the programme live).

- **A year written up early said the business met every objective.** Found by
  a new layout test that closes a prepared campaign on day 200: the close read
  "Nexora met all 5 of its stated objectives" beside a list of one achieved and
  four in delivery, and business enablement said the business "met its
  commitments". Both counted anything not failed as met. Measured, no full year
  leaves an objective unresolved (0 of 60, idle and building), so only "Write
  up the year now" reaches it — but any player can press that. The outcome now
  counts objectives still in delivery separately, the sentence says so, and the
  enablement band gives each half credit rather than none. Test in
  `tests/engine/review-agrees.test.ts`, mutation-checked.

- **The rail's "Due" badge failed the contrast floor in light mode.** Near-white
  text on the brass fill measures about 3:1; the open-decision count used the
  same pair. The accessibility audit only ever saw day one, when no board paper
  is due, so it never met the badge. The audit now also runs on a campaign the
  engine played to day 200 and on the close written up from it, in both themes,
  and a new `--on-brass` token puts dark ink on brass. Failed before, 28 of 28
  audit tests pass after across desktop, tablet and both phones.

- **The risk list read "Moderate moderate".** Its two leading badges were a
  bare residual band and a bare confidence word, which on most rows are the
  same word; the briefing and the detail already said "residual" and
  "confidence". The list says so too.

- **The guide's board-paper picture could not be regenerated.** The
  screenshot harness drove a quarter of play through the interface at 4x to
  reach the first board paper, and it no longer got there: neither raising its
  poll cap to 2,200 nor its timeout to fifteen minutes reached day 91, while the
  engine reaches board papers on days 91, 182 and 273 of every campaign. The
  loop, not the game. Closed by not driving the clock from a browser at all:
  `scripts/prepare-campaign.ts` plays a light, engaged year in the engine up to
  a named stopping point (a pattern on offer, a board paper due, a given day)
  and prints the save record, and `tests/e2e/prepared.ts` puts it in the
  browser's save store and opens it from the Continue list. The screens
  photographed are the real ones loaded from a real save. The pattern and board
  test now takes 2.5 seconds instead of timing out. The first version of the
  policy never formed a pattern, so the board paper it photographed read "You
  have nothing to report"; the policy now forms what the game notices, and the
  picture shows four raised risks on the agenda. The preparation runs outside
  Playwright because Playwright loads modules as native ESM and the campaign's
  JSON imports are written for Vite and tsx.

  The incident and annual-review pictures went the same way afterwards: that
  test drove a whole year through the interface, up to 500 polls and ten
  minutes, and now loads prepared campaigns stopped mid-incident and at the
  year's natural end, in about three seconds. The prepared policy was first
  too idle to photograph honestly — the Q3 board paper still "Due" on 30
  December, 157 unread messages, a review about a player who built nothing —
  so it now files each quarter's paper with what is material, reads the
  inbox, runs the identity programme and clears its blockers. The mid-year
  layout and accessibility tests use the same prepared year.

- **Five risk bands were authored and two were ever used.** One cut list at
  0.16 / 0.34 / 0.55 / 0.75 served three different quantities, and it was cut
  for a 0..1 range none of them reach. Measured with a new probe,
  `pnpm ladder bands`, which samples every visible risk row weekly across the
  ladder: 13,385 rows over 24 campaigns.

  | | Before | After |
  |---|---|---|
  | low | 12.0% | 8.0% |
  | moderate | 87.1% | 42.7% |
  | elevated | 0.9% | 31.1% |
  | high | 0% | 17.8% |
  | severe | 0% | 0.3% |

  The underlying numbers span 0.08 to 0.38 for residual, 0.10 to 0.28 for
  exposure and 0.06 to 0.58 for consequence, so exposure could never read
  above `moderate` whatever happened, and an incident that had actually
  damaged the business was described as moderate. Each quantity now has cuts
  fitted to the range it can reach, with headroom above the worst observed.
  They stay absolute rather than percentiles, so a risk the player genuinely
  reduced comes down a band instead of a moving scale hiding it. A row moves
  0.001 in a median week and 0.004 at the ninetieth percentile, so cuts this
  close together still read as change rather than flicker.

  The same flatness was in the change language: "materially worse" needed a
  0.14 swing on a scale whose whole range is 0.29, which the simulation cannot
  produce, so it was a phrase the game could not say. It is 0.05 now, and the
  risk review's own materially-worse trigger reads the same constant.

  **Reach checked, not assumed.** The cuts also feed board materiality, and a
  bar of "elevated or worse" on the new scale would have made half the register
  material. Moved to "high or worse", the board pack calls 21% of open risks
  material against 26% before, so it still has something to choose between.
  The ladder is unchanged on every other row, which is what a presentation
  boundary should do. Tests: every band must be reachable inside each
  quantity's measured maximum, and a played year must read more than two
  words for its risks. Mutation-checked by putting one cut list back.

- **Executive patience stopped describing the mode after about week seven.**
  It seeded from the profile at 0.62 / 0.50 / 0.38 and then drifted up 0.0015
  a day with no ceiling: +0.55 over a year against a 0.24 spread, so every
  mode finished at or near maximum patience. It now recovers towards the
  profile's own value and no further. Measured at the close, 12 seeds a mode:
  0.59 / 0.47 / 0.32, against baselines of 0.62 / 0.50 / 0.38.

  The friction term this feeds was the other half. It bit only below 0.45,
  which sits between the three profiles' starting values, so it fired on 0
  days of 364 on two of the three modes. Bounding the drift alone was tried
  before and reverted because it made high pressure miss 76% more objectives:
  an absolute cliff below a mode's own baseline punishes the business rather
  than the security posture. The term now reads the shortfall from full
  patience as a standing drag, weighted at 0.02, which is monotone across the
  ladder and small. Objectives missed went 1.60 / 1.10 / 1.80 before to
  1.92 / 1.58 / 1.92 after, rather than the 2.80 / 2.30 / 3.00 that a heavier
  weight produced. A test fails if a mode ends the year far from its profile's
  patience, or if two modes converge at day 60, 200 or 364.

  That test first asserted a strict ordering on one seed and failed, because a
  briefing that goes well can leave an executive more patient than the mode's
  baseline. That is the dial working, so the test averages five seeds a mode.

- **The noise dial could not move, and the measurement behind that was
  wrong.** The recorded figure was exactly 2.00 noise events per campaign at
  every difficulty. It came from counting `firedEventIds`, which records an
  event's first fire and not its repeats, and both noise-tagged events are
  repeatable on a cooldown. Counted from the inbox instead, over 30 campaigns
  a mode: 10.73 / 10.80 / 10.67 noise messages a year, out of 153 / 159 / 170.
  Ten times what the note said, and still flat across the ladder, because both
  events are cooldown-bound and the weight only chooses which day they land on.

  `noiseMultiplier` is deleted rather than tuned. Scaling their cooldown by
  mode would make it bite, and was declined on the reasoning already recorded
  here: high pressure is meant to be strategically harder, not to cost more
  attention to read, and the evidence already carries the signal-from-noise
  discrimination plan §44 asks for. The profile, the draw and the architecture
  note no longer describe a dial that does nothing.

- **"A programme is on plan" was a message the game could not send.** The
  condition asked for progress within 0.02 of the nominal rate. Measured, a
  programme with no blockers and nothing competing for its team holds about
  92% of nominal, so the absolute gap passes 0.02 within about two months and
  never comes back. The event was also gated to day 120, by which time any
  programme started early was outside the window. It is a tenth of plan now,
  and opens on day 60. The condition first reads true on day 52 of a clean
  programme, and the message arrives.

- **Two of the three "never fired" events were the probe, and one was a door
  it never opened.** Coverage listed three events as unreachable. One was the
  programme-win message above. The other two are scheduled by particular
  decision options, and the report had no way to say so. Coverage now names
  the gate: "behind dec-q4-recovery-window → Take the window now". The
  remaining pair sit behind the two options of one Q4 decision, which needs
  the ransomware programme at four fifths by day 275. A test now proves that
  chain: a player who funds recovery early and clears its blockers is offered
  the restore window on day 275, and the programme completes.

- **"Programmes finished 0.42" was a probe that never pressed the button.**
  A blocker is shown to the player and can be cleared for budget or attention,
  and neither the ladder nor the coverage harness ever cleared one, so every
  programme sat at-risk for the rest of the year. With blockers cleared, a
  focused player finishes what they start: started against finished reads
  2.7 / 1.4 on guided, 1.8 / 1.8 on CISO and 1.3 / 1.0 on high pressure. The
  player guide's advice to pick one programme and finish it stands.

- **The budget said a first-time player downloaded 241 kB; they downloaded
  301 kB.** CI had been red for four commits on the job named "Typecheck,
  lint, content and unit tests", which also builds and runs `pnpm size`.
  Nothing was wrong with the typecheck, the lint, the content or the tests:
  the critical-path budget was exceeded by 1.6 kB. `pnpm check`, which is
  what gets run before a push, does not include `pnpm size`, so four pushes
  went out green locally and red on CI.

  The budget was a hand-kept sum that added the app, the campaign, the
  framework and every stylesheet, and deliberately left out the graph
  library "because it is behind a dynamic import". It was not. `lazy()`
  around the organisation view is real, but naming `@xyflow` in
  `manualChunks` made it a shared chunk, and the built `index.html` carried
  a `modulepreload` for its 59 kB and a render-blocking `<link>` for its
  stylesheet. Every first-time player fetched the graph library before the
  first screen, which is the exact thing the code split exists to prevent.

  Dropping the manual chunk leaves the library reachable only through the
  dynamic import. Measured, gzip, from the entry HTML:

  | | Fetched before the first screen |
  |---|---|
  | Before | 301.0 kB |
  | After | 242.8 kB |

  The budget script no longer keeps its own list: it reads the module
  script, the preloads and the blocking stylesheets out of `dist/index.html`
  and sums those, prints `first load` or `on demand` beside every chunk,
  and fails if a chunk named in `MUST_STAY_LAZY` appears in the first load.
  Restoring the manual chunk fails it by name, on both the script and the
  stylesheet. The limit is raised from 240 to 255 kB against the corrected
  measurement, which is a tightening: the real figure it replaces was 301.

- **One campaign appeared on the start screen as three or four saves.**
  Reported by the owner: "why i get multiple saves". Measured on a fresh
  browser profile before changing anything. Playing one campaign for four
  actions listed three rows, days 28, 22 and 18, all the same seed and all
  badged `Autosave`. Starting a second campaign and taking one action listed
  the new campaign twice and the old one once, because the rolling slots
  shifted rather than cleared.

  The cause was the save layout: three rolling autosave slots plus a manual
  and an import slot, each listed as its own row. Nothing in the interface
  said three of those rows were the same year, so they read as separate
  games. The history was only reachable by picking an older row out of that
  same list, which is the thing that was confusing.

  A campaign is now the storage key, so every write replaces that campaign's
  one save. Existing players are not left with the old duplicates: the first
  time the database opens, pre-campaign-key records are folded to the newest
  per campaign and the rest are deleted, which is idempotent and swallows its
  own failure so a bad collapse cannot stop the game opening. The listing
  also groups by campaign rather than trusting the key, so an interrupted
  collapse still shows one row. Because the manual save and the autosave are
  now the same write, the record carries whether the player asked for it, and
  the row is badged `Saved by you` when they did.

  Tests: a campaign played for four actions is one row and one record, and a
  second campaign makes two rows with two distinct campaign ids; three
  rolling-slot saves seeded into the database as the old build stored them
  collapse on reload to the newest one, keyed by campaign, and it still
  loads; the resume test asserts the badge, which is what now proves the
  Save campaign button writes anything at all.

  **Two lines of copy had gone stale with it, and the guide had no picture.**
  The delete confirmation still said "including its autosaves", which is no
  longer a thing a campaign has, and told the player to "export it first",
  which they cannot: export is offered only on the annual review, at the end
  of a year. Both are rewritten, and the player guide's claim about exporting
  is corrected to say where it lives. The guide described the Continue list in
  words but showed no picture of it, because the start-screen shot is taken on
  a fresh profile where the list does not exist. `pnpm guide:shots` now plays
  two campaigns and photographs the list as a returning player meets it.

  **The first mutation check failed to fail, and that was the finding.**
  Disabling the collapse and keying saves per day both left the start screen
  showing one row, because the listing groups by campaign defensively. The
  tests were asserting the list and could not see storage. They now read the
  records out of IndexedDB directly, and the same two mutations fail on the
  stored count. Defence in depth in the code is a reason to test both layers,
  not a reason to test the outer one.

- **Dialogs ran off the bottom of a phone screen with no way to scroll
  them.** Reported by the owner from a phone. Every pop-up in the game is
  the one `Dialog` primitive, whose panel was capped at `92dvh` with a
  scrolling body inside a non-scrolling overlay. Measured in Chromium at
  320×568 and as a Pixel 7, capped, the first decision's panel fits and its
  body scrolls 1,949 px inside 566, by touch drag and by wheel, so the
  layout is right where `dvh` is understood. On a browser that does not
  know `dvh` (Samsung Internet before 21, iOS before 15.4, older Android
  WebViews) the cap is dropped at parse time, the panel grows to its
  content — 2,527 px for that decision at 320 wide — and the buttons sit
  2,500 px below the bottom edge of an overlay that cannot scroll. That is
  the report.

  Two changes. The cap now has a `vh` fallback behind a `@supports not
  (height: 1dvh)` query, because the minifier folds two `max-height`
  declarations into the last one and drops the fallback. And the overlay
  scrolls: a dialog taller than the screen for any reason at all scrolls
  as a whole, so the footer is always reachable. Measured with the cap
  forced off as a stand-in for the browser without `dvh`: the footer was
  at 2,508 px and is reached by scrolling to 551 of 568.

  Tests: at every viewport the first decision's panel fits the screen, its
  footer is on it without scrolling, its last option can be scrolled to,
  and with the cap forced off the footer can still be scrolled to. Checked
  by removing the overlay scroll and watching the last assertion fail. A
  first run of that check failed on the *first* assertion instead: the
  panel's rise animation was still six pixels short of home when it was
  measured, so the test now waits for the animation to finish — the
  harness, not the game.

  **Making the overlay scroll introduced a bug of its own, caught by a
  screenshot.** The regenerated picture of the opening decision came out
  with the dialog shoved up and its title off the top. Measured: with the
  panel at 828 px inside a 900 px viewport, so plainly fitting, the overlay
  still reported 1,389 px of scrollable content and one flick of a wheel
  over the dimmed backdrop moved the panel to -264. The scrolling body's
  full content was counting towards the overlay's scrollable area even
  though the body clips it. `contain: paint` on the panel, which only
  states what the rounded, clipping panel already does, takes the overlay's
  scroll height to exactly its client height. The dialog test now asserts
  that a dialog which fits leaves its overlay unscrollable, and fails
  without the containment. The overlay still scrolls when the cap is
  forced off, so the fallback above is untouched.

- **Guided mode stopped guiding at the enquiry list.** An opening playtest
  across three personas (`docs/playtests/2026-09-21-ai-three-personas-opening.md`,
  an AI playing an experienced CISO, a newcomer and someone with no
  security knowledge, three fresh seeds) agreed on the premise and the
  opening decisions and disagreed with the Investigate screen: seventeen
  enquiries in one unprioritised list, with nothing connecting a risk card
  to an enquiry, so the newcomer's next action was word-matching. Verified
  in the source: `InvestigationPanel` rendered `content.investigations` in
  file order and no selector related an enquiry to a scenario.

  Every enquiry now carries a `theme` from a five-entry union — what the
  business cannot lose, how an attacker would get in, identity and supplier
  access, recovery and response, team and governance — and the list is
  grouped under those questions; the schema refuses an enquiry without
  one. A selector, `enquirySpeaksTo`, names the player's own open risks an
  enquiry bears on: those whose trigger systems it would reveal, or whose
  attack path steps use a control it would assess. Only risks on the
  player's list are named, so nothing hidden is handed over; the card names
  three in the order the player's list ranks them and counts the rest, so
  a broad review does not become a catalogue of its own. Where the profile
  coaches decisions, the enquiry that speaks to the top concern is badged.

  **The point of confusion now opens the glossary.** The newcomer called
  the glossary comprehensive and unusually good, and long, passive and not
  surfaced where the confusion was. A `Terms` component finds the
  subject's words in a risk's title and statement and renders them as chips
  that open the glossary at the entry, on the briefing's top concerns and
  in the risk inspector. "Identity platform", on the first risk card every
  campaign opens with, had no entry; it has one, and the glossary test
  holds it to being used.

  **Guided mode sustains its guidance.** A first-quarter aim opens a coached
  year: check one service the business cannot lose, one route an attacker
  would take, one assumption about recovery, before the Q1 board paper. It
  is advice, not a mechanic, so lessons can now be `coachedOnly` and the
  CISO and high pressure modes never see it. And the rationale list says
  what it is for: the governance basis of the decision, read back at the
  annual review, not a score.

  Tests: every enquiry has a theme; `enquirySpeaksTo` names only listed
  risks, names the recovery risk to the recovery test once it is open, and
  names them in the list's order; the chips find "Privileged access",
  "Managed service provider" and "Identity platform" in a sentence and open
  the glossary at the entry; the aim opens a guided year and not a CISO
  one. Each was checked by removing the behaviour and watching the test
  fail.

  **Left.** A one-line "what this will reveal" preview after the opening
  choice would state the reveal before it happens, which is the hidden
  truth rule; the undiscovered count on the briefing already changes. A
  post-choice recap is the came-back block, which arrives when the result
  does. Hiding rationale reasons behind "More reasons" is a layout question
  for a person.

- **The reconstruction asserted what the player's choices had changed.** The
  third observed playthrough (`docs/playtests/2026-09-21-ai-fresh-seed.md`,
  a fresh seed, an AI again) enforced the retention policy on day 103 and
  was told on day 216 that "data held longer than the retention policy
  allowed" had hurt; it was credited "backups that could not be reached from
  the compromised accounts" beside a step that encrypted them. Every incident
  family carried two or three authored helped-and-hurt lines, appended
  whatever the state. Each line now carries a condition from the same
  `Condition` union events use — the retention line is not said to a player
  who took the delete option, the backup line is said only when backup
  coverage is there, "recovery that had never been timed" is not said after
  a restore — and the reconstruction filters on it. A test starts a data
  breach in two campaigns, one that enforced retention and one that did
  not, and expects the line in only one of them.

  **Four more from the same run, fixed.** "One material item was not on the
  agenda" now names the item. "You are holding a risk assessment the board
  has never seen" now names the risk, by `{{unseenRisk}}`: the most material
  open risk on no quarter's agenda. "It was never on your list, because
  nothing brought it into view" was said of a risk whose pattern the
  briefing had offered three months running; the sentence now distinguishes
  a hypothesis formed and never raised, a pattern set aside, evidence in
  hand that never became a pattern, and nothing having brought it into view.
  And "the shape of the organisation itself went unexamined", to a player
  who began with the architecture review, now says that much of how the
  organisation fits together was never verified, which is what the score
  measures.

  **Three interface findings, fixed.** The whole incident panel was sticky
  and, for the second session running, covered the control a player was
  reaching for mid-incident; the band stays pinned and the panel scrolls.
  The team screen's "your functions are at available" now carries the same
  health note as the briefing. The team sustainability list showed five of
  six functions because the debrief capped evidence at five; incident
  response was the one dropped, in the sentence that said it was spent.

  **The incident's closing message says what happened.** "Post-incident
  review complete" was the whole account a Skip ahead left a player with.
  The message now says how long the incident ran, which services it touched,
  how bad the consequence was in the band's words, and how many response
  decisions were taken. How the actor got in stays for the annual review,
  which is where hidden truth is revealed and the report agreed it should
  stay.

  **Left.** The report's ask for the attack route and impact scope during
  the incident is the hidden-truth rule, and stays. The recruitment label
  reading "Recruiting" after capacity rose is the sixty-day hire running its
  course while capacity was bought another way; not changed.

- **The annual review contradicted the decision record three times.** The
  second observed playtest (`docs/playtests/2026-09-21-ai-browser-repeat.md`,
  same seed, an AI session again) found the previous fixes working — the
  team note, the came-back block, the agenda explanation, the finance copy —
  and then found the review telling the player three things the same review's
  own judgement list contradicted. All three were real in the source.

  - *"Incident command was never formally stood up"*, under a judgement
    list recording "Day 307: Stand up incident command now". The option set
    a flag and the incident never heard: `commandActivated` was initialised
    false and nothing in the engine wrote it, so the reconstruction said
    "never" to every player who had. A new `incident.command` effect sets it
    on the live incident, and the option carries it.
  - *"Recovery was never exercised"*, beside "2 of 2 recovery controls
    carried assurance you established yourself", after a production restore
    that came back in three and a half hours. The dimension's score already
    counted the restore; the evidence line beneath it did not. It reads "2
    recovery exercises completed, one of them a production restore".
  - *"Recovery fails when it is needed was among the largest risks you
    inherited, and nothing you did went near it"*, for a player who funded
    the recovery programme on day one. A programme is scored against the
    most material scenario it treats — the right rule for the score — and
    "missed" read only that one, so a programme treating three scenarios
    was told it went nowhere near the other two. Missed now reads every
    scenario a commitment was aimed at.

  A test starts an incident and stands up command, sets the restore flag,
  and funds identity and recovery together, and fails on any of the three
  sentences; each mutation — an inert command effect, an evidence line that
  ignores the restore, a missed list that reads only the scored scenario —
  fails it by name.

  **Five smaller findings, also fixed.** "Nothing needs an answer" still
  sat beside a due board paper; the decision list now says nothing at all
  when a paper is waiting above it. The briefing headline said nothing was
  waiting while an incident was running; it says an incident is running and
  response decisions follow. "Open the response log" landed on whatever
  message was selected last; it lands on the incident's newest. Skip ahead
  could carry a player from containment to closure in one click and leave
  the consequence, recovery and debrief in the inbox; incident updates are
  in "Came back to you" now. The recovery programme's milestone read
  "Restore tested end to end" while the fourth-quarter decision said
  recovery had never been run against production; the milestone reads
  "Restore tested outside production", which is what it was. And the CEO
  option that still said "one morning" no longer does.

  **Left, and why.** Generic enquiry results — "answered part of the
  question and raised others" — are the quality summary; what an enquiry
  found is on the Evidence screen, where the result's evidence lands, and a
  link from the message to it is the next thing to test rather than a
  rewrite. The £140k recruitment decision after a £120k hire fires only
  while a vacancy nobody is hiring for remains, which was true of the other
  roles; the decision could say so. Both are recorded as questions for a
  human session, not changed on an AI's word.

- **The briefing said what needed an answer and never what the answers
  did.** From the first observed playtest: a player who followed the
  briefing and Skip ahead missed a thin enquiry result for a month, left a
  formed hypothesis unraised for two, and found the identity enforcement's
  successful follow-up only on a deliberate inbox review. Every one of those
  was in the inbox; none was on the screen the game puts you on. Filed as a
  weakness for a human to confirm; the owner chose to act on it.

  The briefing carries a ruled block under "Waiting on you": **Came back to
  you**, the unread messages the player's own actions produced — an enquiry
  that returned, a callback to a choice, a decision the organisation took
  for them, an acceptance that ran out, work pulled back — newest first,
  four at most, each with a way into the message. Routine and threat
  messages are not in it; those are the inbox's. It stays a ruled list
  rather than cards, because the visual pass reserved cards for what can
  be acted on, and this is what to know. Mutation-checked: listing results
  only once read fails `tests/ui/came-back.test.tsx` by name.

  Not done from here: the live suite against the deployment, release-gate
  step 13. The environment this is worked on from rejects the connection to
  `vercel.app` at its proxy, so the step is the owner's, at a terminal of
  their own; `docs/HOSTING.md` says so and gives the command.

- **The first observed playtest, and what it found.** An AI-driven browser
  session on the live site, 20 September 2026, seed `quarry-5813`, following
  `docs/PLAYTEST.md`; the report is kept verbatim at
  `docs/playtests/2026-09-20-ai-browser-session.md`. It is not a human
  session and says so, and it separates concrete message inconsistencies
  from tuning, which is the split this entry keeps. Each concrete finding was
  checked in the source before anything moved; six held, and the report's
  own recommendation — verify the inconsistencies separately from the
  subjective tuning — is followed.

  **Held, and fixed.**
  - *Finance asked for 15% of the remaining budget and the options said
    £220k and £110k.* The amounts are fixed and imposed; the copy named a
    percentage authored against the opening allocation. Both the CFO's
    message and the decision now name the sum, and say the money is taken if
    it is there.
  - *"Several assumptions are past their review date" with none recorded.*
    The reminder had no condition. It gates on `assumption.anyRecorded` now.
  - *A £140k recruitment decision after a £120k recruitment.* "Both identity
    roles are still open" fired on day 18 regardless. It gates on
    `team.vacancyOpen` — a vacancy nobody is hiring for.
  - *"Nothing is waiting on you" beside the board paper that was.* The
    decision list's empty state made a claim about the whole briefing. It
    says "No decision is open" now.
  - *"You inherited a backlog and largely worked it"* for a player who
    started with business services. The sentence asserted what the player
    did; it now says what went unexamined.
  - *Prioritisation named the build pipeline as never having had any
    effort.* It is the most material risk in Nexora and it was never on the
    player's list. The sentence now says so when that is why.

  **Held, and made visible rather than changed.**
  - *Capacity relief read as team recovery; the review led with burnout.*
    The briefing's team reading said "available" while two functions were
    burning out, because capacity is what the team can carry this week and
    morale is what it costs them. The reading now carries the worst
    function's morale beneath it when it is below holding up —
    "Engineering burning out" — so the year's people cost is on the main
    screen before the review counts it.
  - *Only one risk was offered to the board and nothing said why.* The
    agenda now says how many risks are emerging and that the board hears
    about the ones you raise, from the Risk screen.
  - *"You have had one morning" on day five.* The CEO's decision can be
    answered days after it opened; the context says so.

  **Checked and left.** Budget rising from £20k to £80k to £170k: two
  events return money, a cancelled licence and a cancelled duplicate tool,
  and each says so in the inbox the player was not reading. The
  completion-versus-assurance distinction the report noticed is the design:
  100% delivered and "recovery confidence limited" are two facts, and the
  reading already says it rests on what was verified. The report's
  recommended next step — the same protocol with human participants,
  comparing their Q3 reading of team health against the review — stands.
  Mutation-checked three ways: ungating either event and blanking the team
  note each fail `tests/engine/playtest-2026-09-20.test.ts` by name.

- **The second half of the inbox was repeatables only.** What the
  fourth-quarter content did not settle, measured: 60 / 55 / 27 / 23
  messages a quarter from 92 / 93 / 54 / 55 distinct subjects, and only 33
  distinct events ever firing in the second half against 94 in the first.
  The cause was the draw, not the authoring. Of 134 events, 92 open in the
  first quarter's window and 68 are one-shot pool events; those fired
  **30.6 / 25.5 / 2.4 / 0.3** per quarter, so by July the pool was spent and
  the inbox had nothing left but the fourteen repeatables — the loop of
  recycled threat-intelligence subjects a hand-played year had already
  noticed.

  The draw now paces the one-shots that gate on nothing but the calendar:
  each is drawn with a probability that keeps the unfired reservoir in step
  with the days left, so it lasts the year. Anything gated on state still
  fires when the state arises, pinned beats and decision-opening events are
  never held back, and the daily budget is unchanged.

  **The first version cost the player their information.** Paced as one
  reservoir, an engaged player's CISO incidents rose from 0.93 to 1.20 a
  year: 19 of the 35 paced events reveal evidence, and holding evidence back
  held back the patterns formed from it. Texture is paced in two tiers now —
  signal (anything that reveals evidence, a node or an edge) at a rate that
  spends most of it by the end of the second quarter, colour at a rate that
  lands the last of it in the fourth. Measured over 20 campaigns of engaged
  play on CISO:

  | | before | one tier | two tiers |
  |---|---|---|---|
  | messages a quarter | 60 / 55 / 27 / 23 | 49 / 51 / 28 / 36 | 49 / 53 / 33 / 34 |
  | distinct subjects a quarter | 92 / 93 / 54 / 55 | 91 / 113 / 83 / 92 | 77 / 123 / 94 / 94 |
  | one-shots fired a quarter | 30.6 / 25.5 / 2.4 / 0.3 | 16.4 / 19.6 / 10.4 / 11.1 | 18.1 / 20.6 / 10.9 / 8.4 |
  | distinct events firing in H2 | 33 | 67 | 67 |
  | ladder incidents, CISO | 0.93 | **1.20** | 0.97 |

  With the three peak-trading decisions of the fourth-quarter arc moved to
  the quarter they are about (the identity enforcement to late Q3, before
  the freeze), decisions now arrive **12.3 / 7.2 / 3.9 / 2.8** a quarter
  against the original 12.4 / 6.5 / 2.8 / 1.4, and the longest stretch with
  nothing to decide is **67 days, max 89**, against 114 and 164. An idle
  player reads 10.8 / 5.6 / 1.6 / 2.9. The ladder over 40 seeds:

  | | Guided | CISO | High Pressure |
  |---|---|---|---|
  | Incidents a year | 0.38 → 0.42 | 0.93 → 0.97 | 1.57 → 1.38 |
  | Objectives missed | 1.95 → 1.60 | 1.20 → 1.15 | 1.32 → 1.60 |
  | Worst consequence | 0.13 → 0.12 | 0.29 → 0.32 | 0.39 → 0.37 |

  Incidents stay monotonic across the ladder and within hundredths of
  before on the two easier modes; high pressure trades incidents for
  objectives, because three colour events carry executive patience and now
  land in the half of the year where objectives fall due. Soak unchanged.
  `tests/engine/pacing.test.ts` walks six campaigns and fails if the second
  half gets less than half the first half's texture, if the fourth quarter
  gets none, or if a quarter of the reservoir is never spent; turning the
  pacing off by mutation fails it with 20.5 / 13.2 / 1.3 / 0.0.

  One thing the reshuffled draw turned up: "A programme is on plan" fired
  about a programme started the day before, which is trivially on plan, and
  was paused by "stop something" later the same day. The condition now
  needs a month of track record, which is the least "on plan for once"
  means.

  This is the event draw, which the working notes had frozen, changed at
  the owner's decision. The rule for authors follows from it: an event
  gated only on the calendar will be spread across the year, so an event
  whose timing matters must say so with a condition or be pinned.

- **The fourth quarter, authored from the player's position.** The
  longest-standing open weakness, acted on from a desk at the owner's
  decision rather than waiting for a playtest. Measured before anything was
  written, over 20 campaigns of engaged play on CISO: decisions arrived
  **12.4 / 6.5 / 2.8 / 1.4** per quarter, the longest stretch with nothing
  to decide averaged **114 days** and reached 164, and every fourth-quarter
  decision was an incident. Nothing in the back half arose from what the
  player had done.

  Five decisions now do, in the shape a source review proposed — *what
  organisation have I created, and what must I now change?* — each gated on
  the player's own position rather than the calendar:

  | decision | arises when | who meets it |
  |---|---|---|
  | Make the identity controls mandatory | the identity programme passes 80% | only a player who built it |
  | The restore test needs an outage window | the recovery programme passes 80% | only a player who built it |
  | An acceptance has run out | a temporary acceptance the player gave expires | only a player who accepted |
  | The platform has outgrown its recovery design | the launch succeeded and recovery was never built | a player who left recovery alone |
  | Next year's budget after a quiet year | day 300 with no incident all year | a quiet year, whoever had it |

  The renewal is opened by the engine when the acceptance runs out, linked
  to whichever scenario it was; its text carries `{{scenario}}` and its
  options act on `scenarioId: "linked"`, so it is authored once. It used to
  flip back to open in silence. The restore window counts as a recovery
  exercise in the resilience dimension, and the budget answer is narrated
  in the annual review.

  Measured after, same probe: **12.4 / 6.5 / 4.5 / 1.9**, longest stretch
  **80 days** (max 124), and the fourth-quarter list now carries the restore
  window, the identity enforcement and the budget question beside the
  incidents. An idle player who answers decisions and does nothing else
  reads 11.0 / 6.2 / 2.5 / 1.4 and meets two of the five: the platform
  question, because they never built recovery, and the budget question in a
  quiet year. That is the rule holding — the back half now depends on the
  front half — and it is why Q4 rises less than Q3: the programme questions
  land where the programmes finish, from day 220.

  The ladder, with its philosophy given an answer for each (enforce, take the
  window, look again, fund the redesign, make the case), over 40 seeds:

  | | Guided | CISO | High Pressure |
  |---|---|---|---|
  | Incidents a year | 0.50 → 0.38 | 1.02 → 0.93 | 1.57 → 1.57 |
  | Objectives missed | 1.88 → 1.95 | 1.07 → 1.20 | 1.27 → 1.32 |
  | Worst consequence | 0.17 → 0.13 | 0.30 → 0.29 | 0.44 → 0.39 |
  | Programmes built | 2.8 → 2.5 | 1.8 → 1.8 | 1.2 → 1.2 |

  Guided pays £180k for the platform redesign and four hours of payments
  for the restore, and buys fewer incidents and a smaller worst case with
  it; the other modes have no spare money and are unmoved except by the
  friction of enforcing identity in peak trading. Soak unchanged (0 / 0 /
  1.21). Every choice in the five has a callback the organisation remembers
  it by — the COO on the restore that came back in three and a half hours,
  the SOC on the third alert from an unenrolled account — because a content
  test fails on a flag that is set and never read, which is the plan's "the
  organisation remembers" held by a test. Coverage reaches all 134 events
  and 31 decisions except the one sampled callback already recorded. Mutation-checked three ways: the
  engine never opening the renewal, the identity event firing for anyone,
  and the budget event ignoring incidents each fail
  `tests/engine/fourth-quarter.test.ts` by name.

  **What this does not settle.** Whether the back half now feels like the
  year building or like more of the same is the playtest question it always
  was, and `docs/PLAYTEST.md` still asks it. The event draw is untouched.

- **The glossary defined the game's words and none of the subject's.** The
  player guide is written for somebody who knows nothing about the subject,
  and the glossary held nineteen entries, all of them mechanics — evidence,
  hypothesis, residual exposure, dwell time. Counted across every authored
  string: "privileged" appears 82 times, "credential" 78, "segmentation" 52,
  "pipeline" 45, "MFA" 35, "telemetry" 17, "peering" 14, "tenancy" 12, "jump
  server" 8, "break-glass" 4, "egress" 3, and none of them was defined
  anywhere a player could reach. The first decision of the game asks about
  "standing privileged access"; the first risk on the list is about a
  "managed service provider identity".

  Twenty-eight subject terms now have entries in a second section of the
  glossary, "The subject's words", each two sentences: what it is, and why
  it matters in this game. `tests/content/glossary.test.ts` holds a table of
  the terms the content leans on against the entries that define them, and
  fails on a term of art that arrives without one — or an entry whose term
  the content no longer uses. This is authored text, not a mechanic, which
  is the kind of change the working notes still allow.

- **The migration test had no save from an earlier build.** It synthesised
  older saves by deleting fields from a fresh one, which cannot catch a
  change that makes a real old save unplayable rather than unloadable.
  `tests/fixtures/save-before-2026-09-20.json` is a real save written by the
  build at `309fc5c`, day 121 of a CISO campaign with a programme running, an
  enquiry commissioned and a risk raised. The test migrates it, checks the
  invariants, plays it to 31 December through every change this session
  made, and builds its annual review. It passes.

- **"Because: residual risk is within tolerance" under "stand up incident
  command now".** Every decision offered the whole twelve-word rationale
  vocabulary, so a reason that belongs to accepting a risk could be recorded
  against running an incident, and the annual review read it back as
  reasoning. First seen in the photographed playthrough, where the harness
  clicked the first reason every time; a player can do the same. A decision
  may now name the reasons it can be taken for (`rationaleTagIds`): the dialog
  offers only those, the engine refuses the rest, and the validator checks
  the ids. Seven decisions name theirs — the five incident decisions, the
  post-incident one and the overload one — each keeping at least six, and
  none offering "within tolerance" or "the system retires imminently". The
  other nineteen are unrestricted, because for them most of the vocabulary
  is arguable and a wrong argument is the player's to make.

  Four offline harnesses recorded "within tolerance" for everything and would
  have lapsed those seven decisions rather than take them — coverage fell to
  119 of 123 before they were taught `rationaleFor`, which takes the first
  reason on offer. The browser harnesses fall back to the first chip. Coverage
  is back at 122 of 123 at 60 campaigns, the same as before. Mutation-checked
  twice: removing the engine's refusal fails `tests/engine/rationale.test.ts`,
  removing the dialog's filter fails `tests/ui/decision-rationale.test.tsx`.

- **Two maps of function names.** The engine said "identity" and "cyber
  risk" in messages while the screens said "Identity" and "Cyber risk" from a
  second map in `src/lib/formatting`, which could drift. One map in the
  engine now; the screen label is the prose name capitalised, and a test
  holds the two forms to the same word.

- **A teaching note on top of the annual review.** Frame 14 of the
  photographed playthrough, 31 December: "You are relying on something —
  carrying a risk means depending on something staying true. Record what,
  because it will be checked" sitting above the closing headline. The lesson
  had been triggered by accepting a risk and never dismissed, which is the
  harness; but a lesson has no year-end gate, so a player who reaches its
  trigger late meets the same thing. The notes now step aside once the year
  is over. `tests/ui/onboarding.test.tsx` renders the note three weeks in
  and again with the year finished, and fails if the gate goes.
  Mutation-checked.

  Seen and left alone in the same frames: every judgement in the review
  reads "Because: Residual risk is within tolerance", under "Stand up
  incident command now" as much as anything else. That is the playthrough
  harness clicking the first rationale every time. The dialog offers the
  whole rationale vocabulary to every decision, so a player can pick nonsense
  too, and the reasoning review will read it back to them; whether the list
  should be narrowed per decision is a content question and is left.

- **The gallery showed a card that no longer existed.** `pnpm screenshots`
  and `pnpm playthrough` both looked for the heading "You may have found a
  pattern" to photograph a pattern offer. The visual pass renamed it "Pattern
  emerging", so neither harness had photographed one since; the gallery kept
  serving `11-pattern-offered.png` from before the rename, and said nothing,
  because a capture the loop never reached was simply not written. Found by
  regenerating the gallery after this session's changes and noticing the
  pattern card looked nothing like the source. Both specs match the current
  heading, and the gallery now deletes, and warns about, any of its three
  conditional captures it could not refresh this run — stale is worse than
  missing. The pattern offer is photographed again, on both viewports.

- **A year with two ransomware incidents closed on a review that spoke of
  one.** The narrative picked the worst incident and narrated it — "tested
  the organisation on day 166" — and never mentioned the second, on day 217,
  though the resilience evidence under it already grouped the pair. The
  narrative now follows the worst with the rest: "It was not the only one:
  the same kind of incident again on day 217, by a different route", or
  "through the same route — the same weakness, still open" when the path
  matches, or the family and day when it is a different kind. A test starts
  two incidents of one family and fails if the review omits either day.
  Mutation-checked.

  The same hand-played year, for the record: no decision at all between day
  273 and day 364, which is the fourth-quarter fade already filed under
  Known weaknesses, seen again by hand.

- **Two programme messages that claimed a state nobody checked.** Day 266
  of the same hand-played year: "A programme has stalled … it needs somebody
  senior to make a decision", from the Head of Security Architecture, with
  the only programme at 100% and nothing blocked. Both `evt-org-programme-
  blocked` and `evt-org-programme-win` fired on `programme.anyActive` and
  nothing else. Measured over 20 campaigns that build four programmes one at
  a time: "A programme has stalled" arrived **93 times and a live programme
  had an unresolved blocker in 27**; "A programme is ahead of plan" arrived
  **54 times and was true in 0**.

  The second could not be made true. Over 6,291 live-programme days the
  largest lead any programme held over its linear plan was **0.000** —
  progression cannot outrun the expectation, only fall behind it — and
  delivery confidence never reached `Good`. A message that can never be true
  is not a message; it now says "A programme is on plan", on a condition that
  happens: progress within 0.02 of the plan with nothing blocking. Two
  condition kinds, `programme.anyBlocked` and `programme.anyOnPlan`, carry
  both. After: stalled 45 of 45 true, on plan 17 of 17. A test walks eight
  building campaigns, fails on either message arriving untrue, and fails if
  either never arrives, so the fix cannot have silenced them instead.
  Mutation-checked.

- **Two incidents, one line, twice.** The Q3 board pack on day 273 listed
  "Ransomware and service encryption (incident)" and, under it, "Ransomware
  and service encryption (incident)": two incidents of one family, which
  reads as a duplicate rather than as the point the annual review already
  makes ("the same weakness, still open"). The agenda line carries the date
  the incident began. The calendar moved from the store into
  `src/game/time.ts` so engine text can date things; the store re-exports it.
  Mutation-checked.

- **"Recovery, Contained, Not yet recovering."** Day 183 of the same
  hand-played year, on one line of the incident command view, above a
  timeline entry from two days earlier saying restoration of affected services
  had begun. The phase was `recovery`, recovery stood at 0.18, and the bottom
  word of the four-step scale was chosen without reference to the phase. Once
  the phase is recovery it has started, however little there is to show; the
  word reads "Recovery just starting" there and "Not yet recovering" before
  it. Six high-pressure campaigns walked day by day fail
  `tests/engine/presentation.test.ts` by name if the contradiction returns.
  Mutation-checked.

- **Ten risks, one word, content order.** Found on day 128 of the same
  hand-played year: nine risks on the list, every one "moderate residual /
  moderate confidence". Measured over 20 campaigns per mode: **86% of the risk
  rows a player ever sees read `moderate`** (462 of 535 for an idle player,
  770 of 894 for an engaged one), the list shows 1.5-2.2 distinct bands among
  five to ten rows, and the residuals across the whole estate span 0.13-0.20 —
  about one band's width. Sorted by band alone, rows in the same band fell
  into content order, so the Briefing's three "top concerns" were the first
  three moderate risks the content file happened to list. The scenario the
  annual review grades prioritisation against — the most material by the
  day-one snapshot — was first in the list in **1 to 4 campaigns of 20**, for
  an engaged player as much as an idle one.

  Within a band the list is now ordered by the assessment itself. The bands
  stay words and the order shows no number; it is the one thing that
  separates ten moderate rows. For an engaged player the most material
  scenario now leads the list in **12 of 20** campaigns by day 180 (11 of 20
  on high pressure), from 2 and 5. The rest is not the sort: the yardstick is
  the day-one snapshot and the list is today's assessment, and in the other
  eight the scenario is not on the list at all, because the player never
  raised it. An idle player is unchanged at 2 of 20 for the same reason —
  the biggest risk in Nexora is one nobody tells them about, which is the
  hidden-truth design working. Mutation-checked: ordering by band alone fails
  `tests/engine/judgement.test.ts` by name.

  **Two things measured on the way, both recorded rather than fixed.** Five
  risk bands exist and two are ever used: across 1,429 rows over two play
  styles and two modes, `elevated` appeared 58 times and `high` and `severe`
  never. The band thresholds (0.16 / 0.34 / 0.55 / 0.75) are calibrated for
  a wider scale than the simulation produces for a quiet estate — filed under
  Known weaknesses, because re-cutting them moves materiality, collisions and
  the debrief together and is a tuning question for a playtest. And the
  prioritisation entry below claims "the biggest risks differ between
  campaigns rather than being a fixed answer to learn"; measured over 40
  seeds per mode, **the pipeline is the most material scenario in 36 of 40
  on every mode** and the top three are one of two sets. The full ordering
  differs (38-39 distinct of 40) but only in the middle. That is a property
  of the authored estate, and a fair one — Nexora has a biggest risk — but
  the claim was wrong and is corrected below.

  **And one in the harness.** Day 168 of the same year: an incident, three
  decisions open at one day left, and `pnpm play` printing its own warning —
  "answer this before `go`: advancing past today decides it for you" — under
  each. Answering the first advanced the clock, because `decide` always
  advanced to the next stop, and the other two lapsed into "manage it through
  the line" and "run it in-house". `decide` now shows what is still waiting
  and only advances once nothing is. The hand-played year carries the two
  defaults; they were the harness's choice, not the game's.

- **An empty board paper earned the full bump.** Found at the Q1 close of the
  same hand-played year: "Q1 paper is due. Material items:" and nothing under
  it. The player had answered every decision, commissioned two enquiries and
  raised no risk — nine scenarios were *emerging* and none assessed — so the
  pack had nothing on it at all. The Board screen says the right thing ("You
  have nothing to report … that is itself something the board may ask
  about"), and then the scoring gave the paper the maximum: coverage of an
  empty agenda was 1, so an empty paper scored as a complete one.

  Measured over 20 campaigns on CISO. A pack with nothing on it at all,
  by quarter:

  | | Q1 | Q2 | Q3 | year-end board confidence |
  |---|---|---|---|---|
  | Answers decisions, nothing else | 18/20 | 12/20 | 8/20 | 0.623 |
  | Commissions enquiries, forms nothing | 17/20 | 13/20 | 7/20 | 0.641 |
  | Forms patterns and raises risks | 0/20 | 0/20 | 0/20 | 0.640 |

  A player who took three empty papers to the board finished the year with
  the same board confidence as one who raised everything and covered it —
  the same shape as the quiet year that was automatically resilient. The
  earlier entry on materiality reported empty packs at 0% for "both play
  styles"; both of those styles raised risks. A player who has not raised one
  is the new player, and their first paper is the one that matters.

  An empty paper now earns nothing from the board and a sentence: "the chair
  asks what the quarter found, and when they will hear what it means".
  Candour still counts on its own, so a candid empty paper is worth a little
  and a full one a lot. Year-end confidence now reads 0.592 / 0.611 / 0.640
  across the three styles, in the order of engagement, and the ladder is
  unmoved (board 0.61 / 0.62 / 0.63) because its player raises risks before
  the first paper is due. Mutation-checked: removing the branch fails
  `tests/engine/debrief.test.ts` by name.

  Not done: offering emerging scenarios as agenda items, so the new player
  has something to choose between. It would put "we have not looked at this"
  on the board agenda as if it were an assessment, and the plan's "choose
  material topics" (§28.7) means assessed ones. The Board screen already
  tells them why the pack is empty.

- **"Costs GRC capacity."** One option in the HR provider decision named the
  function by its content id, where every screen calls it "Cyber risk". The
  annual-review test forbids the ids in the closing screen but not in
  authored option text. Reads "cyber risk capacity" now.

- **Four propositions, one list of evidence.** Found on day 82 of the same
  hand-played year: seven patterns on offer, and four of them — supplier
  privileged access, one identity platform, the deployment pipeline, a
  supplier integration — cited the identical four pieces in the identical
  order. "Backup platform shares administrative credentials with production"
  was listed as what led to *the deployment pipeline is a privileged path into
  production*, which it says nothing about. A player reads that as a menu, not
  as something clicking.

  The cause is a coarse tag. `privileged` is a supporting tag on five
  templates, one shared tag was enough to count a piece as support, and the
  list was ordered newest first — so when one generic piece arrived, every
  template resting on the tag was re-offered with the same list, the generic
  piece at the top. Measured over 20 campaigns on CISO, with a fit score of
  the supporting tags a piece shares with a proposition plus one for the tag
  the proposition is about:

  | | passive player | engaged player |
  |---|---|---|
  | offers whose evidence list is identical to another's that day | 24% | 29% |
  | cited pieces sharing one tag or fewer with the proposition | 42% | 42% |

  Two blunt rules were measured first and rejected. Requiring two shared tags
  makes `hyp-recovery` unreachable in 20 of 20 campaigns; requiring the
  proposition's own tag or two shared ones loses `hyp-acquisition` and
  *raises* duplication to 60%, because two pairs of templates are
  near-duplicates in tag space (`hyp-supplier-privilege` / `hyp-logistics`,
  `hyp-identity-concentration` / `hyp-partner-portal`) and the pieces that
  survive are the ones they share. The tag vocabulary will not carry a
  stricter threshold.

  What was done is presentation and a gate. The cited list leads with the
  best-fitting piece and only then the newest, so the four lists differ where
  the evidence does; and an offer needs at least one piece that fits at 2 or
  better, because something in hand has to speak to the proposition itself.
  Identical lists fell **24% → 7%** for a passive player and **29% → 13%** for
  an engaged one; one-tag citations **42% → 15%** passive and **42% → 36%**
  engaged; the gate costs 1.5% of offers and no template its reach (13 of 14
  in 20 of 20 campaigns, `hyp-team-capacity` unreached by this probe under
  every rule, as before). The engaged figure moves least because a player who
  forms patterns as they come holds only two or three pieces at a time, and
  the list already shows all of them. Mutation-checked: removing the gate and
  removing the ordering each fail `tests/engine/presentation.test.ts` by name.

  **What remains is content-shaped, and is left.** An engaged player still
  sees a one-tag citation a third of the time, and two pairs of templates
  will keep sharing lists while they share tags. Finer tags — `pipeline`,
  `logistics`, `partner` on the pieces that are about those things — would
  fix it at the source and would touch most of the 48 pieces of evidence;
  that is a content pass on a frozen campaign and a playtest should ask for it
  before it happens. Recorded so the next reading of "the patterns look like a
  menu" starts from here.

- **"Stop something" stopped nothing, and the overload decision blamed the
  SOC whatever was breaking.** Found on day 20 of a hand-played year: one
  enquiry and one programme, both on identity, took identity to breaking point
  in fifteen days. `dec-team-overload` fired, and its text said "The SOC lead
  has told you plainly that the team cannot carry the current volume of work".
  "Stop something" lifted morale and handed back an attention point while every
  enquiry kept running and identity stayed broken; "Buy capacity" spent £200k
  on **SOC** capacity; "Push through" cost the SOC an analyst 45 days later.
  Strain reads from the most pressed function (`teamStrain` is 0.6 the worst
  function), so the event fires on whichever part of the team is breaking, and
  everything that reacted to it assumed it was the SOC.

  Measured over 20 campaigns per mode of a player who builds everything they
  can afford: the decision fired **92 times, and the SOC was the most pressed
  function in 0 of them** — engineering in 42, incident response in 35,
  identity in 12, architecture in 3 — and SOC strain was under 0.3 on all 92.
  The decision was never once about the function it named.

  Effects that act on a function can now target `most-pressed`, resolved in
  the reducer at the moment the option is taken; `leader.morale` resolves it
  to whoever leads that function. A new `work.stop` effect makes the option
  true: it abandons the newest enquiry drawing on the pressed function, and if
  no enquiry does — **62 of the 92 firings**, because the load is programmes —
  it pauses the newest programme that does, which the player resumes from the
  Programmes screen when there is room. A message says which, and that the
  money already spent stays spent. Mean strain relieved on the pressed
  function: **0.04-0.08 → 0.50-0.69**, and the decision refires about half as
  often because the load actually comes off. The text carries
  `{{pressedFunction}}`, rendered by `renderDecisionText` for the interface
  and the harness alike; a content test fails the build if any option of this
  decision names the SOC by id.

  **The ladder moved, and the first reading was the harness.** The ladder takes
  the first option of any decision it has no opinion on, which is "Stop
  something", and it never resumed what was paused: objectives missed on high
  pressure read **0.40** against 1.30, because half its programmes sat paused
  all year imposing no friction. Given the philosophy it declares — one
  programme at a time — it now resumes a paused programme once the team is
  below `stretched`. Re-measured over 40 seeds against the pre-change build
  run side by side:

  | | Guided | CISO | High Pressure |
  |---|---|---|---|
  | Incidents a year | 0.50 → 0.50 | 0.95 → 1.02 | 1.70 → 1.57 |
  | Objectives missed | 1.88 → 1.88 | 1.13 → 1.07 | 1.30 → 1.27 |
  | Worst consequence | 0.17 → 0.17 | 0.31 → 0.30 | 0.48 → 0.44 |
  | Programmes built | 2.8 → 2.8 | 1.9 → 1.8 | 1.2 → 1.2 |
  | Resilience `developing` | 4 → 4 | 12 → 15 | 20 → 16 |

  Guided is untouched because the decision rarely fires there. High pressure
  eases slightly because the SOC no longer loses an analyst for a problem it
  did not have. "Push through" run as the counterfactual lands within 0.03 of
  "stop and resume" on incidents and 0.16 worse on objectives missed, so the
  decision is a trade-off with no dominant answer, which is what the game says
  a decision is. The ladder stays monotonic. Mutation-checked three ways: a
  `work.stop` that stops nothing, the buy option pointed back at `soc`, and
  the selector leaving the placeholder unrendered each fail
  `tests/engine/overload.test.ts` by name.

- **A fresh pass over the repository, not trusting the record — including
  this file.** Played a year by hand, sampled the file's own "mutation-checked"
  claims by re-running the mutations, and read the docs against the code.
  Four things, in order of weight.

  **A decision that lapsed was never told to the player.** Found on the second
  stop of a hand-played year: the CEO's "three risks" was at one day left, the
  clock advanced, and at the next stop it had simply gone. The engine had
  recorded a lapse — `resolveByDefault` wrote a history line and applied the
  default's effects — and sent nothing to the inbox, the channel every other
  consequence arrives through. Between day 6 and day 18 the inbox carried seven
  messages and not one of them said the organisation had answered the CEO with
  "talk in general terms" on the player's behalf. The only trace was in the
  Briefing's four-item "Recently" list, which had rolled off. The player learned
  what was chosen for them on 31 December, when the review counted it against
  them. A lapse now sends an urgent message from Nexora Group naming the option
  taken, linked to the decision. `tests/engine/lapse.test.ts`; mutation-checked
  by removing the message.

  **One of the file's "mutation-checked" claims was false.** Sampled four:
  toast pointer-events, the board-paper card on the Briefing and the
  red-herring exclusion each failed their named test when re-mutated, as
  claimed. The unaffordable pattern offer did not: with `disabled={noAttention}`
  changed to `disabled={false}` — the exact defect it exists to catch — the
  end-to-end test stayed green, because its only assertion sat inside
  `if (week.startsWith('0'))`, which on its seed never ran. A test that passes
  with the defect present guards nothing. The contract is now held by
  `tests/ui/pattern-notice.test.tsx`, which arranges zero attention directly and
  asserts both branches every run (mutation-checked); the end-to-end test skips
  loudly, naming why, rather than passing quietly — which is why the suite's
  skip count rose from 3 to 8 across the five local viewports.

  **`pnpm play` read a sixth of what the game was saying.** On day 44 of the
  hand-played year nine patterns were on offer and the harness printed one;
  it printed no history at all, so the lapse above was invisible to the one
  harness whose job is to read what the game says. It now prints every
  pattern with a count, every lapse since the last stop, and a warning under
  any decision at one day left — the trap the first lapse fell into.

  **`docs/ARCHITECTURE.md` said "ten dials".** There are eleven since
  `showsDecisionCoaching`, and it is neither a world dial nor a player dial —
  it is a presentation dial, which the document now says.

  The measured weakness about this file's own length is filed above, ranked
  last, as a recommendation rather than a change.

- **The player guide described a screen that no longer existed, and the release
  gate was a list nobody checked.** Two pieces of debt, both created by the
  three passes above rather than found in them.

  **The guide had gone wrong, not just stale.** It told a new player to look for
  "the four bands across the top", which the visual pass had moved into a strip
  under a masthead; it quoted "You may have found a pattern", which is now
  `Pattern emerging`; it described unverified systems as carrying a badge, when
  they are drawn dashed and resolve as you check them; and it had no section at
  all for `Your year`, a screen with its own destination and keyboard shortcut.
  Nine of its ten screenshots predated the changes. The text is corrected and
  the pictures regenerated with `pnpm guide:shots`. **The board-paper capture
  failed again** — it is the one the spec's own comment says does not reliably
  reach its screen — and that image is left as it was, which is honest here
  because nothing in this pass touched the Board screen.

  **Six of the fourteen release-gate conditions are now asserted rather than
  remembered.** `docs/HOSTING.md` said CI covered five and "the remainder are
  checked before release", which in practice meant nobody checked them: they all
  hold by construction and would only break by accident. `tests/content/release-gate.test.ts`
  reads them off the source — no network primitive anywhere in `src/` (steps 7,
  8 and 14), no account (4), no store outside the browser (5), and no
  environment variable beyond Vite's build-time booleans (9). Mutation-checked
  three ways: adding an analytics `fetch`, a `VITE_API_KEY` read and a `signIn`
  each fail a named test.

  Worth stating plainly: the reason the Vercel Functions tab shows no
  invocations is not restraint, it is that the application has no way to make a
  request. That property is now held by a test, so an accidental analytics call
  fails `pnpm check` rather than turning up on a bill. Steps 12, 13 and 14's
  confirmation still need a deployment and a person; nothing in the repository
  can check those and no test pretends to.

- **The interface read as an enterprise dashboard rather than a command
  centre.** A visual review graded the game 8.5/10 — structure strong, identity
  and tension weak — and named five changes worth more than the other ten. All
  five were real when checked against the source, and one was worse than
  reported: the Briefing carried **16 bordered cards**, four of them the
  standing bands, so nothing on the screen looked more important than anything
  else.

  **The Briefing leads with what wants you.** A masthead (`CISO BRIEF · WEEK 14`
  / `NEXORA GROUP · INTERNAL`), then a headline counting what needs an answer,
  then the four standing readings as one unboxed strip rather than four cards of
  equal weight. Cards are now reserved for things that can be acted on. 16 → 14
  and the four that went were the ones competing hardest.

  **A collision is drawn as a race.** Two tracks on one scale: the business date
  as a tick, because a commitment can be stated, and the covering milestone as a
  **band**, because it is a projection off the rate the programme has actually
  managed. The review asked for "41 days" on the second track; the file's own
  rule is that a collision is "never a date the game cannot stand behind", and
  that rule is right — staffing, blockers and the player's next move all shift
  it. The band says *about here, and we are not sure*, the gap is shown as
  distance, and the verdict is written in words beside it.

  **Pattern emerging is no longer a card.** The moment something clicks was
  arriving in the same bordered box as everything else. It is ruled off top and
  bottom now, the proposition set in the display face, the evidence listed
  under "what led here" — an analyst's inference rather than a notification.

  **"Taken on trust" is visible, not just labelled.** An unverified system was a
  solid row with a badge on it, which reads like every other row. Unverified
  nodes are dashed and set back, in the list and in the graph, and resolve to
  solid as the player checks them. The graph was already dimming by
  *confidence*, which is a different thing — an inherited entry can arrive
  confident and wrong — so it now draws `verified` as well. On day one the whole
  estate is dashed, which is the truth and the point.

  **The annual review is a report.** Rules top and bottom, the organisation and
  "annual review" as a kicker, the headline centred in the display face with
  room around it, and the eight dimensions as a strip you read down rather than
  eight boxes competing for the eye.

  A sixth, from further down the same list: **a risk leads with the scenario,
  not the rating.** The badges sat above the title, so the most prominent thing
  on a risk was its colour — which is how players learn to optimise the colour
  instead of reading the risk.

  Cost 1.2 kB gzip (228.1 → 229.3 of a 240 kB critical path). Both themes pass
  axe on every screen. Rendering and looking caught two faults no test would
  have: the `?` buttons made two of the four standing labels taller, so their
  badges sat lower than the others, and the risk cards needed the order flipped
  to make the point above. The other nine recommendations — screen-by-screen
  visual dialects, milestone tracks on programmes, evidence-source headers,
  incident-mode subordination — are not done and are not recorded as weaknesses:
  they are a design direction, and the next one should start from a playtest
  rather than from another reading.

- **The year was eight paragraphs of prose and no picture.** The annual review
  described a campaign the player had just spent a year in without ever showing
  it to them, and it only existed on 31 December. `Your year, day by day` is the
  same year as one 364-day strip — decisions taken and lapsed, programmes
  running and finished, enquiries, board papers, assumptions that stopped
  holding, incidents — in `src/components/debrief/YearTimeline.tsx`, derived by
  `yearTimeline` from state the player already saw. It reads no hidden state: an
  incident contributes its family name and its day, never its attack path.

  **Identity is the lane, not the colour.** Six rows, six labels, six icons.
  Take the colour away entirely — print it, or read it with any colour-vision
  deficiency — and the figure still works, which is the rule the rest of the app
  already holds to. Marks are 3px ticks rather than icon bubbles, because an
  icon at 11px repeated twenty-one times is not an icon; it lives once on the
  lane label where it can be read. Every mark is also a sentence with its day in
  "Read the year as a list", which is what a screen reader gets and what anybody
  gets on a phone where 364 days will not fit.

  **The palette was computed, not chosen.** Three chart hues, validated rather
  than eyeballed: green 150, accent 250, magenta 340 pass the lightness band,
  chroma floor, colour-vision separation and contrast checks in both themes.
  Violet 300 was the first choice and **failed against the accent at ΔE 2.3 for
  deutan vision**, which is why programmes are magenta. Ink was in the first set
  too and does not belong in a categorical palette at all — it is a text colour.
  Dark is chosen, not flipped: chart marks want L 0.48-0.67 against that
  surface, where the band tokens sit at 0.72-0.79 because they are also label
  text. Both themes pass axe with the list open; the audit did not cover this
  screen before, because nothing navigated to it.

  **Two things turned up while building it.** The debrief had no route into it:
  the only way in was a banner shown once the year was over, so the screen's own
  "your year is not finished yet — write it up now" branch was unreachable, and
  a player could never close the year early though the screen offered to. It is
  a destination now (`Y`), and the timeline renders mid-campaign, which is the
  point of it — you can see the shape of your year while there is still year
  left to change. And drawn honestly it shows the fourth quarter thinning out,
  which is a measured weakness this file already carries: that is a reason to
  have built it, not to soften it.

  The whole feature costs **2.6 kB gzip** (225.5 → 228.1 kB of a 240 kB critical
  path), which is why the icons are seven hand-drawn inline SVGs and not a
  library. Checked by rendering it and looking: two layout faults no test would
  have caught — lane summaries truncating to "11 decisions, all yo…" and the
  quarter axis vanishing at 320px, leaving a mark three-quarters along a row
  saying nothing about when it happened.

- **Prioritisation measured decision discipline, not prioritisation.** The
  dimension scored whether the player decided at all, decided in time, and
  recorded why — none of which establish that scarce attention and money went
  to what mattered. Measured: a player who answered every decision promptly and
  committed to **nothing of their own read `strong` on 20 of 20 seeds**. That
  is the gap the whole review was pointed at — succeed by judgement, or by
  learning the assessment rules — and it was the last one open.

  It now reads where the effort went. `src/game/debrief/prioritisation.ts`
  takes the commitments that cost budget, attention and the team's capacity —
  programmes started, enquiries commissioned — and scores how close to the
  biggest risk in the organisation the average one was.

  Four things it deliberately is not. **Not coverage**, which is the
  blind-spots dimension: a player who commits to one thing and picks the right
  one scores full marks, because "pick one programme and finish it" is what the
  player guide tells them to do. **Not judged against the year-end picture**,
  because a programme that worked lowers its scenario's residual and scoring
  the end state reads success as having worked on something that did not
  matter — the same trap that once emptied the board pack for the player who
  had done the most. `risks.initialMateriality` snapshots the true residual of
  every authored scenario on day one, per seed. (It was claimed here that
  this made the biggest risks differ between campaigns. Measured later over
  40 seeds per mode, the most material scenario is the pipeline in 36 of 40
  on every mode: the estate is authored, so its biggest risk is largely a
  property of Nexora rather than of the seed. The snapshot still matters for
  the reason above — it is taken before the player's own work moves the
  residuals — but it is not a moving answer.) **Not judged
  against what nothing could reach.** And **not charged against work that was
  not about a risk** — a team review is real effort and addresses no scenario,
  so it is ignored rather than counted as a bad aim.

  Measured over 20 campaigns per style on CISO:

  | | allocation | band |
  |---|---|---|
  | Did nothing | 0.00 | weak 20/20 |
  | Answered everything, built nothing | 0.00 | **developing 20/20** |
  | Built the two least material programmes | 0.54 | solid 19/20 |
  | Commissioned all eighteen enquiries | 0.64 | solid 20/20 |
  | Built the two most material programmes | 1.00 | strong 20/20 |

  The declared philosophy from `pnpm ladder` — investigate selectively, build
  one programme at a time, answer everything, take every board paper — reads
  `strong` on 19-20 of 20 across all three modes, so the dimension is winnable
  by playing well rather than by playing to it. The simulation is untouched:
  soak 1.20 / 28% / 3% and the ladder identical, because this reads state at
  year end plus one snapshot at setup.

  **Three attempts were wrong before this one, and measuring caught each.**
  Matching an enquiry to a scenario through whole attack paths counts a mean of
  **6.0 of the 14 scenarios per enquiry, and up to all 14** — the paths cross
  the estate — so three enquiries scored a perfect year. The raw ratio never
  approaches zero even for the worst available choices, so passing it through
  unshaped put a player who deliberately chased the smallest risks in the top
  band on **19 of 20 seeds**; it is normalised against the worst set of choices
  the campaign itself offered. And passed through flat, an undirected year sat
  exactly on the `strong` boundary and fell either side of it by seed, which
  reads as noise to a player.

  **The timeliness term was dead and is gone.** The old rule wanted a third of
  the decision window still unspent and charged everything else as late, which
  marks a player down for the thing the game keeps asking them to do — find
  something out before committing. Softening it to catch only the wire made it
  inert: measured over 20 campaigns of a player who waits for the deadline every
  time, a decision resolved on or after its deadline day happened **0.0 times a
  campaign in 0 of 20**, because the deadline lapses the decision before it can
  be answered. There is no "late" in this game — you answer or the organisation
  answers for you — and `decidedTerm` already says which. Removed rather than
  shipped as a row that describes nothing, which is the `noiseMultiplier`
  lesson.

  A save written before the snapshot existed cannot have its first day
  recovered, so it is assessed from where it stands — approximate, and much
  closer than scoring a year of good choices at zero for a missing yardstick.
  Mutation-checked three ways; the test that pinned the old contract
  (`prompt` → `strong`) was rewritten rather than made to pass.

- **Five things found by a source review of the assessment rules, and what
  measuring them actually showed.** A reviewer read the repository rather than
  playing it and raised five defects. All five were real in the source. Two of
  the fixes then had to be rebuilt after measurement contradicted the first
  attempt, and a third turned out to be broader than reported.

  **The budget floor concealed a shortfall instead of resolving it.** The floor
  on `budget.change` stopped the balance going negative, and that was all it
  did. Affordability was checked against `requirements.budget` — and **not one
  of the fifteen priced options declared it**, so the gate was dead for every
  decision in the game, not just the reported one. £320k of emergency response
  could be taken with £100k left: budget to zero, full containment and morale
  benefit applied, and the missing £220k recorded nowhere. A player who kept a
  contingency finished level with one who spent everything.

  Options now state a price once, as the negative `budget.change` the reducer
  applies, and the gate is derived from it — so it covers all fifteen and cannot
  drift from what is actually spent. `budgetTreatment` says how it is funded:
  `discretionary` (the default) is refused unless the year can pay, `imposed`
  is money taken from you and floors without becoming a debt, and `emergency`
  may exceed the allocation with the shortfall carried in
  `resources.unfundedCommitment` and named in the annual review. The price is on
  the card now instead of the word "Expensive". A content test fails the build
  if any decision's every option is discretionary and priced, because a
  decision nobody can afford would lapse into its default for the one reason the
  player can do least about; **0 of 26 are, today**.

  Measured over 40 seeds per mode: the simulation is unmoved (incidents
  0.50 / 0.95 / 1.70, programmes 2.8 / 1.9 / 1.2, board 0.61 / 0.62 / 0.63,
  soak 1.20 / 28% / 3% — all unchanged) and one row moves. Objectives missed
  went 1.88 / 1.65 / 1.50 → 1.88 / 1.13 / 1.30, and the cause is a single
  substitution a campaign: the player wants to quarantine the acquisition
  (£120k), cannot afford it, connects on schedule instead, and the business
  keeps its date while the exposure is carried. That is the trade-off the game
  exists to teach, and it used to be free. **Checked it was not lapsing**: the
  ladder retried one option daily until it timed out, which no player does —
  the dialog disables what they cannot afford and they pick from the rest. The
  harness falls back now, and the row did not move back, so the substitution is
  real. Mutation-checked, six ways.

  **A quiet year was automatically resilient.** `resilience` was
  `1 - worstConsequence * 0.8`, and with no incident the worst consequence
  defaults to zero, so every untested year reached the maximum — while the
  sentence beside it read "whether that was capability or fortune is worth
  asking". The verdict answered the prose's question, in the player's favour.
  Absence of an incident is an outcome, not evidence of capability. A tested
  year is still scored on how the organisation came through it; an untested one
  is scored on whether recovery was ever exercised — `inv-recovery-test` or
  `inv-ir-readiness` completed, and recovery controls the player established
  assurance over themselves rather than inheriting — and is capped below
  `strong`, because nothing demonstrated it.

  **The first version of that fix was wrong and measurement caught it.**
  Multiplying the exercise and capability terms put all three play styles in
  `developing` — a dial with no room to move, the same failure as
  `noiseMultiplier`. Adding them instead discriminates: over 20 quiet years on
  guided, an idle player reads `weak`, one who exercises recovery
  `developing`, and one who builds the ransomware programme *and* exercises it
  `solid` (10 of 12, mean recovery capability 0.13 → 0.33). Across the ladder
  `developing` went 2/9/17 → 4/12/20 of 40, still monotonic.

  **The reasoning review ignored chronology.** It built one set of incident
  paths for the whole year and asked whether an accepted risk shared one, with
  no day comparison — so an incident on day 40 could be cited as evidence
  against an acceptance made on day 120 through the same path, which may have
  been made *because* of that incident, after remediating it. Incidents are kept
  with their days now and only count against reasoning recorded before them.

  **Accepting a risk removed it from the player's own top concerns.**
  `topConcerns` filtered to `open`, `treated` and `emerging`, so a material risk
  disappeared from the Briefing precisely because the player took
  responsibility for it — teaching that acceptance is how you make something go
  away. Accepted risks stay and are badged "Accepted — carried"; only `closed`
  drops off. In the same selector, an unassessed scenario took
  `riskBand(residual ?? 0)` and rendered as **Low residual**, so "we have not
  looked at this" and "we looked, and it is fine" were the same row. It reads
  "Not yet assessed" now and sorts after the assessed rather than among the low.
  **Reachable in 12 of 12 campaigns** — a risk the player raises themselves is
  unassessed until they assess it — though the first probe said zero because it
  never raised one. Third harness fault this session.

  **Some decisions printed the preferred answer above the options.** Seven
  decisions carry a `teaches` note and it rendered in the dialog while the
  player was choosing: the platform launch reads "Supporting with conditions is
  usually more effective than opposing outright" above an option labelled
  "Support, with conditions". The game says that decision has no mechanically
  superior answer; the note gave it one. It is now the profile's
  `showsDecisionCoaching` — guided keeps it, CISO and high pressure give the
  same facts and let the debrief judge afterwards. One decision context named
  its answer too ("saying yes with conditions… usually lands better") and now
  states the trade-off without the verdict. The mechanics lessons in
  `lessons.ts` are untouched: those explain what a mechanic *is*, which every
  mode still needs.

- **A consequence could take the budget below zero.** `spendBudget` refuses
  any player action that would overdraw, and `focus.change` and
  `capacity.change` both clamp at zero — `budget.change` was the one resource
  effect without a floor. Fifteen authored options carry a negative amount, the
  largest being external IR support at £320k, so a player who had committed to
  programmes and then met a costly consequence went overdrawn in silence and
  the Briefing read "£-70k of £2.4m". It floors at zero now: you spend what the
  year actually has. `budget-non-negative` joins `focus-non-negative` in the
  invariants, so a soak catches it coming back.

  Behaviourally neutral otherwise — over 40 seeds per mode the ladder is
  unchanged (incidents 0.50 / 0.95 / 1.68, programmes 2.8 / 1.9 / 1.2) and only
  the overdraft disappears. It never reached a player who merely answered
  decisions; it took building as well, which is why three passes of hand-played
  years missed it and the ambitious appetite in `pnpm ladder` found it.
  Mutation-checked.

- **"1 business objective were missed."** Found by playing the same year on all
  three difficulties: the closing screen builds that sentence from a count, and
  only the plural was written. The singular case is written out now, and
  `tests/engine/presentation.test.ts` checks both. Mutation-checked.

- **Five things found by playing a year in a browser rather than through the
  engine.** Three earlier passes drove the simulation directly; this one drove
  the actual interface — clicking, reading what was on the screen and taking
  what the game offered. The interface, not the simulation, is where every one
  of these lived.

  **A whole year could be played without ever being told the board paper was
  due.** The quarterly review appeared only on the Board screen. Played from
  the Briefing — where the game puts you, and where "Waiting on you" tells you
  what needs an answer — 364 days and 23 decisions went by and the four board
  papers were never mentioned; "Nothing is waiting on you. No decision needs an
  answer right now" was shown with one outstanding. The annual review then
  marked the year down: `Communication and escalation: developing — 0
  quarterly reviews prepared`, for a mechanic the game never surfaced. The
  Briefing now carries the due paper in "Waiting on you" with a way in, and the
  rail badges Board the way it already badges the Inbox. Mutation-checked.

  **The first three weeks told a new player they had already checked 41% of
  Nexora.** "Checked for yourself: a start" on day one, dropping to "none of it
  yet" on day 21 with no explanation. The wording was fixed before; the
  quantity was not. The inherited assurance picture is recorded at day -180 and
  `ASSURANCE_LIFE_DAYS` is 200, so for twenty days somebody else's assessment
  counted as the player's own examination — the exact mistake the verification
  model exists to teach, on the first screen of the game. Nodes and edges
  already drew this line with `verified`; controls now do too, on the basis
  that a negative day is before the player arrived.

  **The annual review still rendered the internal understanding score.** `66%
  of the estate was brought into view` — the same 0..1 aggregate taken off the
  Briefing for being a number where a band belongs — sitting directly above `0
  of 32 things you could have examined yourself, you did`, which reads as a
  contradiction. It is a count now: `37 of 38 systems were ever brought into
  view`.

  **A player who did nothing was credited with a trade-off.** Sixteen of
  eighteen decisions lapsed and the headline read "The business got its year.
  The security programme did not." A trade-off is something you make; the
  tension headlines now require that prioritisation did not fail, and an absent
  year closes on "The year was decided largely without you."

  **The main screen offered an action it would then refuse.** With the week
  spent, "Form the hypothesis" stayed live and a click produced a toast. The
  Investigations panel in the same codebase disables what you cannot afford and
  says why in place; the pattern card does both now. Mutation-checked in the
  end-to-end suite.

  One text change came out of reading the close: three incidents from the same
  family listed as three near-identical lines, which looks like a duplicate
  rather than the point. Repeats are grouped — "Customer data exposure on day
  88, and again on days 176 and 300 — the same weakness, still open".

- **Four things found by playing a third year permissively, on high pressure,
  and then looking at the gallery.** Two earlier passes both played carefully;
  this one waved things through, accepted risks formally and recorded
  assumptions against them, which reached parts of the game the careful route
  never touches.

  **"Supplier assurance questionnaire returned clean" was cited as grounds for
  alarm again.** The same sentence this file already records as fixed. The
  earlier fix was real but closed one instance: it relied on each template
  naming the contradicting tag in its own `contradictingTags`, and only 2 of
  14 templates name any, so the clean questionnaire still supported
  `hyp-logistics` and the claim that legacy is isolated still supported
  `hyp-detection-gap` — 817 offer-days across **20 of 20 campaigns**. The rule
  is structural now: a `contradicts-x` tag argues against `x` for every
  template that rests on `x`, whatever that template lists. One piece was also
  under-tagged and gained `contradicts-legacy`. Down to zero, with no offers
  lost. Mutation-checked.

  **The closing screen printed raw enum ids.** "Your architecture and grc
  functions are spent", "soc: burning out" — internal names in the last
  paragraph a player reads. `src/lib/formatting` holds two maps of these words
  and the engine cannot reach either, so `functionName` now lives beside
  `moraleLabel` in `src/game/team/capacity.ts`. A test walks three whole
  campaigns and fails if any line of the annual review contains `grc`, `soc`,
  `iam` or `incident-response`.

  **Hovering the rail made an item look like the page you were on.** Selected
  and hover were 3.5% of lightness and one font weight apart, with identical
  text colour — convincingly enough that the gallery's Board screenshot read as
  a navigation bug, and the bug was chased through three probes before the rail
  turned out to be right. The selected item now carries an accent bar, which
  hover cannot produce. The gallery was at fault too: Playwright leaves the
  pointer where it last clicked, so `pnpm screenshots` was photographing a
  hover state. It parks the pointer before every shot now.

  **A toast swallowed clicks meant for the page.** Three stack above the fold,
  over the Decide button, for 5.2 seconds; the body was `pointer-events-auto`,
  so a click aimed at the page hit the toast and did nothing. Only the dismiss
  control needs the pointer. Mutation-checked in the end-to-end suite.

- **The accessibility audit was racing a 220ms animation.** Screens and dialogs
  fade in from opacity 0, and both `toBeVisible()` and a click resolve on the
  first frame, so axe measured contrast against a half-transparent panel. The
  same commit gave 75 green tests on one run and a `color-contrast` violation
  on the next, reporting `#71767d on #eff2f5` for text that settles at 7.8:1 on
  white. A test that fails at random gets dismissed as flake, and would hide a
  real violation just as easily. The audit waits for `document.getAnimations()`
  to finish now, and is green three runs in a row at two viewports. The
  violation was a phantom: the settled colours were checked directly.

- **Two things found by playing a second year, investigating this time.** The
  first pass answered decisions and never commissioned anything; this one
  commissioned work, formed patterns and raised risks, and the different route
  found different faults.

  A pattern was offered on the strength of a **misconfigured print server**.
  `ev-soc-noise-printers` is marked `noise: true` in the content and reads
  "Benign. Worth fixing, not worth a programme", and `patternSuggestions`
  counted it toward the two pieces an offer needs. Measured over 20 campaigns:
  308 offer-days cited a red herring, and in 160 of them — at least one in
  **every campaign** — the offer existed only because of it. Noise is now
  excluded from what supports a proposition, which is the same rule already
  applied to contradicting evidence. The template stays reachable: offers fell
  0.8% and offer-days 0.6%. Mutation-checked — putting the red herring back
  fails `tests/engine/presentation.test.ts` by name.

  **The board pack was empty for the player who had done the most.** A
  scenario counted as material only at residual >= 0.45, a number from the
  middle of the `elevated` band, so a player's own mitigation pushed the risks
  they had raised off their own agenda. Measured over 12 campaigns with 7 live
  scenarios each: **78% of board packs had nothing material and Q1 was empty in
  12 of 12** — worse than an idle player's 47%, and an empty pack scored full
  coverage and full board confidence. Plan §28.7 asks the player to "choose
  material topics", which needs something to choose between. Materiality is now
  read in bands: residual `elevated` or worse, **or** consequence `elevated` or
  worse (a severe-consequence risk you believe you control is exactly what a
  board needs to know you are relying on), **or** accepted (carried on the
  organisation's behalf). Empty packs went to 0% for both play styles, 2.0-2.5
  material items per pack for an engaged player against 1.3-2.3 for an idle
  one, and year-end board confidence was unmoved (0.55 idle, 0.64 to 0.65
  engaged).

  A third thing turned up while wiring the harness: `convertHypothesis` would
  **raise the same hypothesis twice**. The workspace hides the button once a
  hypothesis is raised, so the rule lived only in the component; called again it
  charged attention, wrote a duplicate note and a second history entry, and set
  `scenario.status = 'open'` over a risk the player had since **accepted**,
  discarding a recorded rationale in silence. The action refuses now, like every
  other branch of `applyAction`.

- **The annual review graded a player well and told them they had failed.**
  Found by playing a whole year one decision at a time and reading the closing
  screen: prioritisation read `STRONG — 3 decisions lapsed and the organisation
  chose for you`, and communication read `STRONG — the board listened, but never
  quite came to depend on you`. Each dimension's sentence was picked from its
  own thresholds, independently of the band printed beside it, so the verdict
  and the explanation could contradict each other — and the sentence is the part
  a player reads. Narratives are now led by the band, with the specifics as
  qualifiers after it. `tests/engine/presentation.test.ts` fails the build if a
  `strong` or `solid` dimension uses failure language.

  The playthrough itself is now a harness: `pnpm play` runs the campaign until
  something needs the player, prints the situation and stops, so a year can be
  played a decision at a time and the state survives between invocations. It is
  the only harness that reads what the game actually says.

- **Three things found by playing a year and looking at every screen.** None
  would have failed a test, and all three undercut the game's own argument.

  The Briefing told a brand-new player **"Organisation understood: 53%"** before
  they had checked anything — a rendered percentage on the main screen, claiming
  understanding nobody had earned, which is the exact mistake the verification
  model exists to teach. It now reads "Checked for yourself: none of it yet",
  in words, and rises as the player actually examines things.

  A pattern offer cited **"Supplier assurance questionnaire returned clean"**
  under *what suggests it*. That evidence is tagged both `supplier` and
  `contradicts-supplier` — it is about suppliers and argues the other way — and
  matching on the supporting tag alone made the game cite reassurance as
  grounds for alarm. Contradicting evidence is now excluded from the list.

  The annual review named **Engineering Workstations twice**, once as "never
  brought into view" and once as "taken on trust and never examined", which
  cannot both be true of the same system. "Taken on trust" now applies only to
  things the player knew were there, and the list caps at twelve rather than
  running to thirty lines nobody reads.

- **A collision said "talk to the business".** The date belongs to a person, and
  that is who has to be talked to, so the button names them: "Talk to Priya".

- **Three defects that only a screenshot could find.** `pnpm screenshots` had
  never been run against the new work, and it turned up things no test was
  looking at.

  The header showed **30 February**. Months were a uniform 30.33 days, so every
  date after January was wrong and some did not exist. It is a real calendar
  now, pinned by a test that walks all 365 days.

  The annual review called a team **strong** and "able to do this again next
  year" with its architecture function at zero morale, because the dimension
  averaged morale across functions — the same flat-average mistake that once
  hid team strain. It now leans on the worst function and caps the band when
  any function is spent: a team is as sustainable as the part of it closest to
  walking out. Measured over 24 campaigns, a burnt-out function read `solid` or
  `strong` in 11 of them and now reads so in none. Morale in the evidence lines
  is words rather than percentages, which the bands-not-numbers rule asked for
  all along.

  The incident command view was **quieter than the teaching note under it** and
  scrolled away with the page. It is sticky while an incident runs and carries
  a solid `INCIDENT ACTIVE` bar. Two Tailwind classes were silently doing
  nothing on the way there: the severe "soft" token is near-white in light
  mode, and `bg-[--token]` is Tailwind 3 syntax that v4 ignores.

  The gallery itself only ever photographed the calm state. It now captures the
  pattern offer, a collision and a live incident — the screens most likely to
  look wrong — and its default seed was one of the roughly quarter of campaigns
  that never has an incident at all.

- **Forming a hypothesis was filing, not discovery.** The mechanic was right and
  the interaction was not: the player opened a dialog, read a list of templates
  and matched them against evidence from memory, which turns the most
  interesting moment in the game — when something clicks — into paperwork. The
  game now says what it noticed. `patternSuggestions` offers a proposition the
  evidence in hand would support, names the evidence behind it, and stops there:
  forming it still costs attention and "Not this" is a real answer that sticks.

  The first version offered every supported template every day — fourteen on
  screen at once, on 95% of days. That is a backlog wearing an insight's
  clothes. A pattern is now offered only while the evidence that revealed it is
  recent, which halves the days one is waiting and makes the offer a moment the
  player can miss rather than a queue they must clear.

- **A collision named a problem and left the player to find the screen.** The
  card now carries ways into the decision — open the programme that is running
  late, see the risk already raised against the same dependencies, take it to
  the business — which is navigation into existing mechanics rather than a new
  one. A test checks the ids it navigates by resolve to real content.

  The incident command view gained the same treatment: containment and recovery
  now show as words beside the affected services, so the player can see where
  the response has got to without opening anything. They are 0..1 internally
  and are never rendered as numbers.

### Checked and left alone

- **Coverage read 122 of 123 after this session's condition changes.** The
  one unreached event was `evt-con-priority-segmentation-felt`, the callback
  scheduled 45 days after choosing to prioritise segmentation. Run on the
  build from before the session it was the same 122 of 123 with the same
  event missing, and on the current build at 120 campaigns instead of 60 it
  is 123 of 123. It is sampling: the harness varies its choice per campaign
  and the tradeoff decision opens late enough that the callback sometimes
  falls past day 364. Nothing changed. Check the pre-change build before
  reading a harness number as a regression.

- **The ladder, played rather than reasoned.** One CISO philosophy — understand
  the business first, be candid about uncertainty, investigate selectively,
  build one programme at a time, take every board paper — declared up front and
  run identically on all three modes over 40 seeds each. `pnpm ladder`.

  Re-measured after the fourth-quarter content, with the philosophy given an
  answer for each of its five decisions; the figures below are current.

  | | Guided | CISO | High Pressure |
  |---|---|---|---|
  | Programmes built | 2.5 | 1.8 | **1.2** |
  | Days wanting to build, no money | 110 | 170 | **218** |
  | Incidents a year | 0.38 | 0.93 | **1.57** |
  | Worst consequence | 0.13 | 0.29 | **0.39** |
  | Resilience `developing` | 6/40 | 11/40 | **11/40** |
  | Objectives missed | 1.95 | 1.20 | 1.32 |
  | Board confidence | 0.61 | 0.62 | 0.63 |

  Both halves of the ladder bind. The budget decides how much gets built —
  2.8 programmes against 1.2 for the same intent — and every mode ends the year
  spent to roughly zero, so the multiplier is the constraint rather than a
  number in a table. The threat side moves with it: incidents and worst
  consequence each roughly treble, and the resilience band inverts. On a shared
  seed the identical policy closed on "You built the capability on people who
  cannot do it again" on the first two modes and on "You built the capability,
  and the business paid for it in delivery" on high pressure. `Your team is
  past sustainable load` fires on CISO and high pressure and never on Guided.

  Objectives missed does not track the ladder (1.88 / 1.07 / 1.27) and that is
  correct, for two reasons pulling against each other. Live programmes impose
  `businessFriction`, so the mode that builds most disrupts most — which is why
  guided misses the most. And incidents cost the business too, which is why
  high pressure misses more than CISO despite building half as much. Business
  enablement measures the friction the player chose to impose plus the damage
  they failed to prevent, not the mode. Board confidence is flat at 0.61-0.63
  for a player who prepares every board paper.

  The CISO figure was 1.65 before the budget gate landed. The fall to 1.13 is
  one substitution a campaign — the acquisition quarantine the player can no
  longer afford — and is recorded under that entry.

  **An earlier version of this entry was wrong, and the harness was why.** The
  programme list held `prog-recovery`, which is not a real id, so
  `index.programme.get` returned undefined, the loop stopped advancing and
  every mode silently built exactly one programme. That produced "41% of the
  budget unspent on Guided" and the conclusion that the budget multipliers
  never bind — the opposite of what happens. The script throws on an unknown
  id now. Check what the simulated player actually did.

- **The pattern offer looked like a queue again.** Playing in the browser,
  forming one hypothesis immediately surfaced another, three times in a row on
  the same day, which looked like the backlog the recency window was meant to
  remove. Measured over 12 campaigns: an offer is on screen on **2% of days**,
  and on those days the median number waiting is **1** (mean 1.5, max 5).
  Forming one reveals another on about three days a campaign. The earlier
  figure that suggested otherwise came from a probe that never formed anything,
  so offers accumulated forever. Nothing changed.

- **Two resume entries that looked identical.** The start screen showed two
  autosaves of the same campaign, same day, same second, indistinguishable. It
  was an artifact of advancing the clock as fast as a script can: in ordinary
  play the rolling autosaves are seconds apart and legible. Nothing changed.

- **The rail, twice.** A screenshot of the Board screen showed Team
  highlighted, and the Organisation screen looked like its Inspector was
  covering the filter tabs. Both were misreadings — the first was the pointer's
  hover (since fixed), the second a tab strip that ends 12px before the
  Inspector begins. Measure the DOM before believing a screenshot.

- **The reasoning review read as congratulation.** Two hand-played years closed
  with six rationale lines and all six saying "nothing this year contradicted
  it", which looked like a section that never reckons with anything. It was the
  play, not the game. Contradiction reaches a rationale two ways — a risk the
  player formally **accepted** whose attack path later carried an incident, and
  an assumption recorded beside a choice that stopped holding — and only 7 of
  80 decision options record an assumption, all of them the permissive one
  (wave the launch through, leave the supplier alone, note the anomaly and
  watch). Measured over 12 campaigns per style: a permissive player is
  contradicted in 11 of 12 campaigns and 18 of 47 lines, a player who formally
  accepts what they raise in 12 of 12 and 26 of 48, and a careful player in 0
  of 12 — correctly, because nothing they relied on failed. Both playthroughs
  were careful. Nothing changed.

- **Message pacing.** Worth recording because the worry was reasonable and the
  measurement did not support acting on it. Over 20 campaigns and 1,040
  player-weeks: 175 messages a year, a median of 3 a week, 6 at the 90th
  percentile and 10 at the worst. 18% of weeks carry nothing or one thing, and
  the average campaign has an eleven-day stretch with no message at all. The
  priority mix is shaped rather than flat — 25% routine, 52% notable, 18%
  urgent, 6% critical — so an urgent thing still reads as urgent. Quiet periods
  exist; nothing was changed.

  The first measurement said the opposite (82% urgent, one message repeated
  2,808 times) and was wrong: inbox messages are prepended, and the probe
  counted new arrivals by position, so it re-counted the oldest message every
  day. Check the harness before believing a finding.

- **The end-to-end suite could pass against a build nobody made.** Playwright
  reused whatever was listening on port 4173, so a preview server left over from
  an earlier run kept answering after its `dist` had been deleted: seventy-five
  tests failed against nothing, and the failure looked like a regression in the
  app. It reuses nothing now and builds its own server each run. A stale server
  can hide a real break as easily as invent one.

  Checked by mutation rather than by reading: leaking undiscovered systems into
  the Organisation view fails the suite, and shipping an empty annual review
  fails it. One mutation was *not* caught — making the Save campaign button
  write nothing left the test green, because the game autosaves constantly and
  the resume step took whatever save was newest. The test now resumes the manual
  save specifically, and fails when that button does nothing.

  The hidden-truth rule was guarded end-to-end by one assertion that one named
  system is absent from one screen, which a leak of any other node would pass.
  `tests/engine/hidden-truth.test.ts` now checks every node and dependency the
  selectors emit, across whole campaigns.

- **An incident looked like ordinary management.** The simulation ran incidents
  well and the interface showed one as a line on the Home screen, so the
  organisation could be in crisis while the game still looked like a quiet
  Tuesday. There is now a command view above every screen while an incident
  runs: what the player has been told, what they have already decided, and what
  is waiting on them. It is assembled from their own inbox and their own
  choices — reading the attack path would put the hidden graph on screen, and a
  test checks every timeline entry against a message they were actually sent.

  Wiring it up found a dead field. `IncidentRuntime.decisionsTaken` was
  initialised at creation and nothing ever wrote to it, so no record of what was
  decided during a response existed anywhere. Choices taken while an incident is
  live are now recorded against it; the section appears in every campaign that
  has an incident, where it appeared in none before.

- **The three clocks never met on screen.** The business date, the programme
  that would cover it and the risks raised against it each lived on their own
  screen, leaving the player to notice for themselves that the control arrives
  after the launch. `collisions` joins them: an objective due soon, the
  programme whose next milestone would cover what it depends on, and whether
  that milestone lands first. Expressed as *covered*, *close*, *too late* or
  *not started*, never as a date the game cannot stand behind.

  Two things it deliberately does not do. It follows dependencies only through
  edges the player has discovered, so the collision becomes visible as they map
  the organisation rather than being handed to them. And it says nothing at all
  about an objective no programme could cover — "nothing covers this" every day
  for a year teaches people to stop reading. Measured over 24 campaigns: an
  engaged player meets a collision in 9, all of them *close* or *too late*; an
  idle one carries a *not started* warning about the platform launch from day 60.

- **The whole campaign was inside the app's JavaScript chunk.** 298 kB of
  content JSON sat in a 587 kB main chunk, and it grows with every authored
  event — the consequence callbacks added 23 kB without anybody noticing. The
  campaign is now its own chunk (94 kB gzip of app code against 152 kB before,
  with 56 kB of campaign beside it), so a content edit no longer invalidates
  cached app code, the two are fetched at once rather than one after the other,
  and the size of the content is visible in the build output. `pnpm size`
  checks every chunk against a budget and CI fails on a breach, because the
  cost of authoring should be a decision rather than a drift. The page also
  paints a static shell now instead of staying blank until React mounts.

  Zod was the other suspect and was not worth touching: building without the
  schema path saved 5.4 kB gzip.

- **Five of the eight mechanics the plan says to teach had no lesson.** Risk
  scenario, investigation, stakeholder influence, assumption and incident were
  all encountered with nothing explaining them, against the plan's "teach
  mechanics when first encountered" and the definition of done's "new player
  can start without reading external documentation". They have one now, in the
  same one-at-a-time dismissible note. A sixth problem surfaced while testing
  it: `lesson-hypothesis` also required no raised scenario, so a player who
  raised one before forming a hypothesis could never be taught what a
  hypothesis is for — the trigger now fires on forming one.

  Lessons live in `src/components/game/lessons.ts`, apart from the component,
  so a test can run their triggers against real campaigns. One test fails the
  build if a mechanic the plan names has no lesson; another plays four
  campaigns and fails if any lesson never becomes showable, because a note
  nobody can reach teaches nobody anything. Measured over 30 campaigns: eight
  of the nine reach the player in 100% of runs, and the incident lesson in 80%
  — the share of campaigns that have an incident to teach from.

- **High pressure was flatter than normal difficulty, not harder.** Good play
  bought 26% fewer incidents there against 37% on CISO, and over 100 seeds the
  defensive player came out *worse* than the passive one (1.96 incidents per
  run against 1.81). Two causes. The profile was not the whole story: the
  threat engine held its own hard-coded difficulty factor applied daily on top
  of the profile's multiplier, sector pressure held a third, and the event
  engine had its own copy of the noise numbers, leaving the profile's
  `noiseMultiplier` dead — so hard mode escalated threat three times over while
  claiming one. And the mode squeezed the player's levers (budget, capacity,
  attention, how fast work comes back) alongside the world's hostility, which
  cuts the very channels skill flows through.

  Every difficulty branch now reads the profile, which gained `threatTempo` and
  `sectorPressurePull` so the hidden dials are visible. High pressure keeps its
  harsher world — more threat, less inherited knowledge, more noise, less
  executive patience — and returns the player's levers to near normal. Good
  play now buys 31%, the defensive player beats the passive one (1.55 against
  1.63, and 20% clean years against 13%), and the ladder is monotonic: idle
  players take 0.57, 1.25 and 1.63 incidents a year across the three modes.

- **The organisation did not remember what the player chose.** Twenty-six of
  the twenty-eight flags a decision option can set were written and never read
  by anything: the machinery for consequences existed and no content used it,
  so the plan's "the organisation appears to remember past decisions" was not
  true. Every one of those choices now has a callback that refers back to it,
  in the voice of somebody who was there — the four weeks you asked the CEO
  for, the launch you waved through, the provider access you left alone, the
  update you waited six weeks for. A content test fails the build on a flag
  that is set and never read.

  Two measurement lessons came out of it. Authored as ordinary pool events, the
  twenty-six callbacks diluted the weighted daily draw enough to cost engaged
  players real outcomes (defensive clean years 37% to 30% over 100 seeds), so
  events can now be `scheduledOnly` and are scheduled by the choice that causes
  them; balance returned to baseline. And the coverage harness took the same
  decision option in every campaign, so half of them looked unreachable until
  it was made to vary its choices per campaign. Every authored event and
  decision is now reached: 123/123 and 26/26.

- **The debrief counted rationales without reckoning with them.** It reported
  how many decisions carried a recorded reason, which says nothing about
  whether the reasoning was any good. The annual review now joins each
  rationale to what followed it — a risk carried as "within tolerance" that
  reached the business anyway, an assurance assumption recorded beside a choice
  that later turned out not to hold — and puts it to the player in their own
  words. See `reasoningReview` in `src/game/debrief/review.ts`.

- **The prioritisation dimension was binary.** It scored `weak` or `strong` and
  nothing between: the lapse term forgave anything under half a year's
  decisions, and the rationale term was constant because the game requires a
  rationale where it matters. It now composes three things multiplicatively
  rather than averaging them — whether the player decided at all, whether they
  decided while there was still time to act, and whether they recorded why —
  because a weighted sum let a perfect rationale record carry somebody who let
  four decisions in ten go by default. Answering everything promptly reads
  `strong`, everything at the wire `solid`, ignoring a third `developing`, and
  ignoring a third *and* answering the rest late `weak`. Fixed a double
  penalty on the way: the decisions log records lapses too, and they carry no
  rationale by definition, so the old rationale share charged a player twice
  for the same lapse.

- **`dec-programme-tradeoff` was reachable all along.** It fires when the
  identity and segmentation programmes are live together, which the coverage
  harness never arranged: it started programmes in content order one every
  forty days, so segmentation began around day 200, long after identity had
  finished. A player who runs both meets the event in 13 of 20 campaigns. The
  harness now starts the contending pair together in a quarter of its runs, and
  **every authored event and decision is now reached** — 97/97 and 26/26.

- **Discovery was not earned.** The blind-spots dimension scored `strong` in
  25 of 25 campaigns, including for a player who did nothing all year: the
  inherited register starts most of the estate "discovered", and passing
  mentions in events reveal the rest, so by day 365 an idle campaign had seen
  every node. Entities now record whether the player established them
  themselves — investigations and assessments set `verified`, inheritance and
  hearsay do not — and the review scores the share of what was reachable that
  was actually examined. An idle year now reads `weak` (0 of 30), a frantic one
  `developing` (13-15 of 30, because over-commissioning returns thin work that
  reveals little) and a measured one `solid` to `strong` (21-25 of 30). Risk
  understanding moved with it, and the overall band spans Difficult to Credible
  where it previously read Credible for almost everyone. The distinction is
  visible on the Organisation screen — an unverified system is badged "Taken on
  trust" and the inspector says so in words — because the review should not
  penalise a player for something the game never showed them. See
  `unexaminedMaterial` in `src/game/knowledge/discovery.ts`.

- **The harnesses were measuring a player who pressed one button.** Every
  offline loop commissioned the first investigation that would start, which is
  always the same repeatable threat hunt near the top of the content file — one
  run reached 6 of 18 investigations and repeated one of them 90 times — and
  none of them ever went to the board, which made the communication dimension
  look impossible to pass. They now work down the list least-commissioned first
  and prepare the quarterly board pack. Content reach rose to 99% of events,
  and a player who does the board reviews reaches `strong` communication. See
  `scripts/play-helpers.ts`.

- **The annual review headline ignored the dimensions** — it keyed on incident
  count alone, so three very different strategies closed on the same line while
  the dimensions underneath differed correctly. `chooseHeadline` now reads the
  shape of the year: the tensions between dimensions first (business delivered
  at the cost of the programme, capability built on a team that is finished, an
  organisation understood but never changed), then severe single-dimension
  verdicts, then the weakest dimension by name. The blind-spots dimension is
  also scored proportionally now, against how much there was to find, so a large
  estate is not penalised for being large. Twelve runs across three seeds and
  four play styles produce five distinct closing lines where they produced one.
  See `chooseHeadline` in `src/game/debrief/review.ts`.

- **Control drift was uniform and severe** — every control lost coverage at a
  flat rate toward zero, taking IR readiness to 0.05 over an idle year. Drift
  now has three shapes matching why a control actually decays, and runs toward
  a floor set as a share of the best level ever reached, so built capability
  persists and a programme raises the floor as well as the value. An idle year
  now leaves IR readiness deployed but unexercised rather than gone. See
  `applyDrift` in `src/game/controls/effectiveness.ts`.

- **Team capacity was close to inert** because only investigations ever
  committed capacity — programmes declared a demand but never occupied anyone,
  so "delegated work competes with programme delivery" was untrue. Committed
  capacity is now derived each tick from running assignments *and* live
  programmes, strain reads from the most pressed function rather than an
  average that hid it, and morale declines faster than it recovers. A player who
  commits to everything reaches overload and loses morale; a restrained one
  stays sustainable. `dec-team-overload` and `evt-org-morale-low` now fire, and
  delegated work returning late or thin roughly doubled. See
  `src/game/team/capacity.ts`.

- **Assumptions recorded when already false** used to invalidate on the next
  tick, so the game announced "the world changed" about something it had always
  known to be untrue. Assumptions now record whether they held when made, and a
  never-true one stays quiet until the player's knowledge catches up — the
  relevant control is assessed or dependency discovered — at which point it is
  worded as a failure of assurance rather than of change. An investigative
  player now meets them ~29 days after recording; an incurious one never does,
  and the annual review names them as things relied on all year and never
  tested. See `src/game/assumptions/validation.ts`.

