# Steady Pitch

A pitch monitor that runs in a browser tab. It listens to a sung or played
note, names the note, and tells you how many cents sharp or flat you are. It
works offline, needs no account, and never uploads audio.

Live page, https://thibaudlepan77-svg.github.io/steady-pitch/

## Why it exists

Most tuners on a phone store install free and then charge to unlock the range
you actually sing in. Measuring a frequency is not the hard part and it has no
business sitting behind a paywall, so the meter is free and stays free.

## How it measures

The detector is YIN, ported faithfully from a C++ implementation rather than
rewritten from the paper.

The autocorrelation is computed through an FFT, zero padded to the next power
of two, squared into a power spectrum and inverse transformed. From there the
difference function, then the cumulative mean normalised difference. Threshold
at 0.13.

Two details matter more than the algorithm choice.

A small bias, 0.15, favours the longer lag when two lobes compete. That is what
keeps a low voice from reading an octave high, and it is the failure mode you
hear people complain about with these tools. A sung bass note often carries
more energy in its second harmonic than in its fundamental, so a plain peak
picker reports the wrong octave and looks confidently wrong. The bias picks the
lobe, and never refines position inside it. Position comes from parabolic
interpolation on the unbiased curve, which is a distinction worth keeping if
you touch this code.

The floor is 65.41 Hz, C2. Below that the window would have to grow and the
reading would lag behind the note.

Cents are the usual `1200 * log2(f / fref)`.

## A4 is a setting, not a constant

Pinning the reference at 440 is a bug disguised as a default. The University of
Iowa reference piano, recorded properly, comes out at 442.2 Hz. European
orchestras and conservatories commonly tune to 442 or 443, and early music sits
at 415. The reference is exposed, with those values offered.

Get this wrong and every reading is off by a fixed amount that looks like the
player being flat.

## How accurate it is, measured

`test-justesse.js` pulls the detector out of the published `app.html` and runs
it against synthetic signals, at the window the product actually uses, 2048
samples. No dependencies.

```
node test-justesse.js
```

Error in cents, signed. Positive means it reports you sharper than you are.

    note   Hz        harmonic-rich   pure sine
    C2     65.41         +5.3          +23.8
    E2     82.41         +2.4          +29.8
    G2     98.00         +1.6          +15.5
    A2    110.00         +4.7          +13.1
    C3    130.81         +4.0           +9.1
    A3    220.00         +0.7           +8.9
    A4    440.00         +0.4           +2.6
    A5    880.00         +0.7           +2.1

The harmonic-rich column is a voice or an instrument, with the fundamental
deliberately weaker than the second harmonic, which is the case that makes a
naive detector jump an octave. It never does here, and it stays under six cents
across the whole range.

The pure sine column is the honest bad news. A sine has no upper partials to
constrain the lag estimate, and at 82 Hz a 2048 sample window holds barely two
periods inside the search range, so the reading drifts sharp by up to thirty
cents. If you test this with a tone generator rather than a voice, that is what
you will see, and it is a property of the window rather than a bug you can
report.

At the edges it stays quiet rather than guessing. Below the 65.41 Hz floor, on
silence, and on white noise, it returns no note at all.

## Running it

No build step, no dependency. `app.html` is one self contained file. Open it
from disk and it works with the network off.

```
git clone https://github.com/thibaudlepan77-svg/steady-pitch
cd steady-pitch
```

Then open `app.html` in a browser with Web Audio support.

## Layout

    index.html         the landing page
    app.html           the tool, one file, no imports
    test-justesse.js   accuracy measurement, plain node
    og.png             share card

Identifiers and comments in `app.html` are in French.

## Licence

Published for reading and for use. Not placed in the public domain.
