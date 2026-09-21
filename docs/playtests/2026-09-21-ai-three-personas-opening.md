# CISO: First Year, multi-persona fresh playtest

Playtested 21 September 2026 at https://ciso-risk-game.vercel.app/. Three distinct newly generated campaigns were started. The test stayed in the visible interface. No source, hidden state, saved campaign, or prior report was consulted during the passes.

## Scope

This was an early-journey comparative playtest, from game start through the opening decision, CEO briefing, and investigation menu. It tests comprehension, decision confidence, discoverability, and first-session onboarding. It does not claim to be a complete annual-playthrough outcome assessment.

| Persona | Difficulty selected | Fresh seed | First instinct | Result |
|---|---|---|---|---|
| Experienced CISO | CISO | `orbit-47994` | Architecture first, communicate uncertainty to CEO | The core trade-off model is clear and credible. The enquiry screen becomes cognitively flat after the opening decision. |
| New to cybersecurity | Guided | `sentinel-56545` | Business services first, communicate uncertainty | Opening notes usefully explain why transparency is valuable. Selecting an investigation still relies too much on jargon and catalogue scanning. |
| No cybersecurity knowledge | Guided | `vellum-59987` | Leadership team first, then cautious CEO response | Business framing is accessible, but the risk cards and action menu require a glossary before a confident decision is possible. |

## Persona findings

### 1. Experienced CISO

The premise is immediately credible: limited attention, an inherited risk register, competing transformation programmes, and a CEO who wants an answer before the evidence exists. The opening option descriptions clearly express trade-offs, especially the distinction between architecture, business services, team knowledge and threat intelligence.

The CEO decision is excellent. “Give her your three, and say how confident you are in each” feels like a realistic leadership response, rather than a safe game answer. The outcome of the first choice visibly changes the number of undiscovered systems, providing useful feedback without revealing hidden mechanics.

The main first-session weakness is the **Investigate** screen. Seventeen enquiries are presented in a single unprioritised list. They have sound descriptions, but no grouping by the question the player is trying to answer, for example: business criticality, attack paths, recovery, identity, suppliers, people. A CISO can scan it, but has to reconstruct the strategy themselves from a catalogue.

### 2. New to cybersecurity

Guided mode changes the opening experience meaningfully. It provides more budget, more capacity and a plainer note under decisions. The note on the opening decision, “Cyber risk cannot be understood from one data source,” makes the intended learning point explicit without choosing for the player. The CEO note, about uncertainty building credibility, is equally effective.

The top-risk cards are mostly understandable because they describe business harm in plain language. Terms such as standing administrative accounts, identity platform and production remain demanding, but the player can understand the broad danger. Choosing business services is an intuitive, defensible first action.

The transition from these helpful guided cues to the enquiry list is too abrupt. “Privileged access review”, “targeted threat hunt” and “control effectiveness testing” are descriptions of cyber work, not an explanation of why the player should choose one now. Guided mode needs a light recommendation or category label linked to the player’s opening choice and visible risk cards.

### 3. No cybersecurity knowledge

The narrative entry point still works. The player can understand that the CEO wants an answer, that the organisation is not well understood, and that a choice must be made. Starting with the leadership team is a natural, plausible response. The options give enough business language to avoid paralysis.

The main problem begins with the risk cards. “Recovery fails when it is needed” is understandable, but “workload identity”, “extranet”, “identity boundary”, “residual exposure” and “confidence” are not self-evident. The ? controls explain some metrics, but the player must infer that they need to use them. The **Glossary** is comprehensive and unusually good, with clear examples, but it is long, passive and not surfaced at the point of confusion.

The player can choose a cautious CEO response because the explanatory note is good. They cannot confidently connect a risk card to an investigation or later programme. The game risks becoming a well-written cyber glossary followed by word-matching.

## Cross-persona findings

| Area | What worked | What needs improvement |
|---|---|---|
| Opening premise | Clear stakes, credible CISO context and an immediate trade-off. | None material. |
| Opening decision | Business language works for all personas. No mechanically superior choice is a helpful framing. | Show a brief one-line “what this will reveal” preview after selection. |
| Guided mode | Decision notes meaningfully improve novice confidence. | Keep the same level of guidance after the first two decisions. |
| Top-risk cards | Business consequences make risk concrete. | Add on-card plain-language definitions or a “Why this matters” expansion for specialist terms. |
| Glossary | Excellent content and examples. | Surface contextually from jargon, not only as a sidebar reference. Remember recently opened definitions. |
| Investigate screen | Enquiries have clear descriptions, duration, cost and attention. | Group and filter by question or risk. Add “best next evidence” recommendations in Guided mode. |
| Rationale taxonomy | Useful for later annual review and understandable to a CISO. | Novices do not know why they must choose a rationale. Add a short explanation and hide irrelevant options behind “More reasons”. |
| Feedback loop | Visible undiscovered-system count reinforces that choices change knowledge. | Show a small post-choice recap: “You learned more about X; Y remains unknown.” |

## Highest-value changes

1. **Turn Investigate into a decision aid, not a catalogue.** Group it into Business impact, Attack paths, Identity and supplier access, Recovery and response, and Team and governance. In Guided mode, highlight one or two reasonable next enquiries based on the opening choice and current top risks.

2. **Add contextual plain-English help.** Make specialist terms in risk cards and enquiry descriptions tappable. Open a short definition first, with a route to the full glossary. Do not force newcomers to search a long reference list.

3. **Sustain Guided mode.** The first two decision notes are strong. Use the same approach for the first investigation, first programme, first board paper and first incident decision.

4. **Explain why rationale is collected.** One line above the list would help: “This records the governance basis for your decision. It affects how your reasoning is read back at year end.”

5. **Add an early player goal card.** For example: “Before the Q1 board paper, validate one critical service, one attack path and one recovery assumption.” This gives non-specialists a coherent first-quarter mental model without prescribing specific choices.

## Overall assessment

The game is already strong for an experienced CISO. It presents uncertainty, limited attention, executive trade-offs and evidence-versus-assumption more realistically than a typical cyber awareness game.

Guided mode makes the opening accessible to cyber newcomers, but it currently stops guiding just when selection complexity rises. For someone with no cybersecurity knowledge, the business story is understandable but the next-action logic is not yet sufficiently scaffolded. The core opportunity is not to simplify the game’s substance. It is to make the path from **risk → question → evidence → decision** visible.

