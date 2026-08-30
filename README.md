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

## Running it

No build step, no dependency. `app.html` is one self contained file. Open it
from disk and it works with the network off.

```
git clone https://github.com/thibaudlepan77-svg/steady-pitch
cd steady-pitch
```

Then open `app.html` in a browser with Web Audio support.

## Layout

    index.html   the landing page
    app.html     the tool, one file, no imports
    og.png       share card

Identifiers and comments in `app.html` are in French.

## Licence

Published for reading and for use. Not placed in the public domain.
