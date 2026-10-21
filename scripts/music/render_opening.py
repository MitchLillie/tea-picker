"""
Renders the opening music: Charlie Huang's guqin recording of 平沙落鴈
Pingsha Luoyan (CC BY 2.5, Wikimedia Commons), excerpted and cleaned, set in a
synthetic valley reverb over an original ambient bed (sheng-like drone tuned
to the recording, mountain wind, a temple bell).

  python3 -I scripts/music/render_opening.py <guqin.f32> <out.f32>

Input: the recording as mono float32 at 44.1 kHz, already high-passed (DC and
rumble removed) and lightly denoised by ffmpeg (see build-opening.sh).
"""
import sys

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
rng = np.random.default_rng(1957)

TUNING_CENTS = -24  # the qin is tuned 24 cents flat of A440
GUQIN_IN = 5.0  # seconds of bed before the qin enters
EXCERPT = 154.0  # ends on a natural rest
TAIL = 9.0  # reverb and drone ring-out


def hz(midi):
    return 440 * 2 ** ((midi - 69 + TUNING_CENTS / 100) / 12)


def lowpass(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def smooth_noise(n, rate_hz, seed):
    """Slowly wandering 0..1 control signal."""
    g = np.random.default_rng(seed)
    k = max(4, int(n / SR * rate_hz) + 4)
    pts = g.random(k)
    t = np.linspace(0, k - 3, n, endpoint=False)
    i = t.astype(int)
    f = t - i
    # Catmull-Rom between control points
    p0, p1, p2, p3 = pts[i], pts[i + 1], pts[i + 2], pts[i + 3]
    return 0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f ** 2 + (-p0 + 3 * p1 - 3 * p2 + p3) * f ** 3)


def db(v):
    return 10 ** (v / 20)


guqin = np.fromfile(sys.argv[1], dtype=np.float32).astype(np.float64)
guqin = guqin[: int(EXCERPT * SR)]
fade = int(1.5 * SR)
guqin[-fade:] *= np.linspace(1, 0, fade) ** 2

total = int((GUQIN_IN + EXCERPT + TAIL) * SR)
t = np.arange(total) / SR

# ── Valley reverb: dark, 4.5 s decay, 40 ms pre-delay ───────────────────────
ir_len = int(4.5 * SR)
ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / SR * 6.9 / 4.5)
ir = lowpass(ir, 3200)
ir = np.concatenate([np.zeros(int(0.04 * SR)), ir])
ir /= np.sqrt(np.sum(ir ** 2))
qin = np.zeros(total)
start = int(GUQIN_IN * SR)
qin[start:start + len(guqin)] = guqin
wet = fftconvolve(qin, ir)[:total]
qin_mix = qin * 0.8 + wet * 0.42

# ── Sheng-like drone: D and A (the mode's home and fifth), breathing ────────
def reed(f, level, seed):
    """Free-reed tone: odd-leaning harmonics, slight beating between two reeds."""
    out = np.zeros(total)
    for h, a in ((1, 1), (2, 0.35), (3, 0.5), (4, 0.15), (5, 0.25), (7, 0.1)):
        for detune in (-0.6, 0.6):
            out += a * np.sin(2 * np.pi * (f * h + detune * h * 0.3) * t + rng.random() * 6.28)
    breath = 0.55 + 0.45 * smooth_noise(total, 0.08, seed)
    return lowpass(out, 1800) * breath * level

drone = reed(hz(50), 1.0, 1) + reed(hz(57), 0.7, 2) + reed(hz(62), 0.35, 3)  # D3 A3 D4
# A high F drifts in and out, like a second sheng player joining.
drone += reed(hz(65), 0.25, 4) * smooth_noise(total, 0.03, 9) ** 2
drone /= np.max(np.abs(drone))
drone_env = np.clip(t / 8, 0, 1) ** 2 * np.clip((total / SR - t) / TAIL, 0, 1)
drone *= drone_env * db(-31)
drone = drone + fftconvolve(drone, ir)[:total] * 0.5

# ── Mountain wind: brown noise, band-limited, in slow gusts ─────────────────
brown = np.cumsum(rng.standard_normal(total))
brown -= lowpass(brown, 0.5, 1)
wind = bandpass(brown, 180, 1400)
wind /= np.max(np.abs(wind))
gust = 0.25 + 0.75 * smooth_noise(total, 0.12, 21) ** 2
wind *= gust * db(-28) * np.clip(t / 4, 0, 1) * np.clip((total / SR - t) / 5, 0, 1)

# ── Temple bell: inharmonic partials, once at the start, once mid-way ───────
def bell(at, f, level):
    out = np.zeros(total)
    i = int(at * SR)
    n = min(total - i, int(9 * SR))
    tt = np.arange(n) / SR
    for ratio, amp, decay in ((0.5, 0.6, 7), (1, 1, 5), (2.76, 0.45, 2.5), (5.4, 0.25, 1.2), (8.93, 0.12, 0.6)):
        out[i:i + n] += amp * np.sin(2 * np.pi * f * ratio * tt) * np.exp(-tt / decay * 2.2)
    out[i:i + int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
    return out * level

bells = bell(1.2, hz(74), db(-24)) + bell(GUQIN_IN + 78, hz(69), db(-31))
bells = bells * 0.5 + fftconvolve(bells, ir)[:total] * 0.6

mix = qin_mix + drone + wind + bells

def rms_db(v, a=GUQIN_IN + 10, b=GUQIN_IN + 140):
    seg = v[int(a * SR):int(b * SR)]
    return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)

ref = rms_db(qin_mix)
for name, layer in (('drone', drone), ('wind', wind), ('bells', bells)):
    print(f"{name:6s} {rms_db(layer) - ref:+.1f} dB relative to the qin")
mix /= np.max(np.abs(mix)) / 0.89
mix.astype(np.float32).tofile(sys.argv[2])
print(f"rendered {total / SR:.1f}s")
