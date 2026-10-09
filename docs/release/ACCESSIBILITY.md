# Accessibility statement

*CISO: First Year* is meant to be playable by keyboard, with a screen reader,
on a small screen, and with motion turned off. This page says what has been
checked, how, and what has not. Last reviewed 9 October 2026.

## What is checked on every change

The game's automated browser tests run before every release.

- **WCAG 2.2 A and AA rules** (axe) on every screen, in light and dark themes,
  at the start of a year, in the middle of one and at its close.
- **Small screens**: every screen at 320 pixels wide, a phone, a tablet in
  both orientations and a desktop, with no sideways scrolling and every
  control reachable.
- **Reduced motion**: when the system asks for it, every animation stops.
- **Print**: the annual review prints on white, without the game around it.

## How the game is built for access

- **Everything works from the keyboard.** Every control is reachable with
  Tab, and single-key shortcuts move between screens and run the clock (the
  list is in the [player's guide](/guide#keyboard-shortcuts)). The shortcuts
  belong to the page: they do nothing while a dialog is open or a control has
  focus, so Space presses a button and the arrows move between tabs. Dialogs
  keep focus inside them and return it when they close. Changing screen moves
  focus to the new one.
- **Nothing is said by colour alone.** Every rating carries a word, and risk
  ratings a height mark as well (▁▃▅▆█). The dependency map has a key, and
  every box on it names what it is.
- **The dependency map has an equivalent.** The list view shows every system,
  and following a dependency from the inspector moves focus to where it
  arrives and keeps a trail back.
- **Status is announced.** What stopped the clock, and every notification,
  is in a live region.
- **Sound is optional and off by default,** and never the only way anything
  is said.
- **Text is set at sixteen pixels or more** in form fields, so phones do not
  zoom on focus.

## What has not been checked

- **Nobody using a screen reader, switch access or voice control has played
  it yet.** The automated checks find what rules can find; they do not tell
  us whether a year is pleasant to play with NVDA or VoiceOver. Sessions with
  assistive-technology users are planned and have not happened.
- **Zoom and text scaling** beyond the 320-pixel layout have not been tested
  on their own.
- **The shortcut list is not shown inside the game**, only in the guide, and
  **the single-key shortcuts cannot yet be turned off** (WCAG 2.1.4). They no
  longer act from inside a dialog or a control, which was where an AI
  keyboard session found them harmful, but a screen-reader user in browse
  mode may still meet them.
- **Only English** is available.
- **The dependency map** is a drawing; the list view is the accessible way
  through the same information.

## Telling us

If something gets in your way, please say so on the
[project's issue tracker](https://github.com/cisohabitat/CISO-Risk-Game/issues):
what you were trying to do, what you use (browser, device, any assistive
technology), and where in the year. Accessibility problems are treated as
defects, not requests.
