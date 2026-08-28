export function createAudio() {
  let ctx = null;

  function context() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type = "sine", gain = 0.08) {
    const audio = context();
    const oscillator = audio.createOscillator();
    const amp = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    amp.gain.setValueAtTime(gain, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(amp);
    amp.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  return {
    unlock() {
      context();
    },
    click() {
      tone(380, 0.06, "triangle", 0.05);
    },
    rotate() {
      tone(520, 0.08, "square", 0.04);
      setTimeout(() => tone(640, 0.06, "square", 0.03), 40);
    },
    wrong() {
      tone(180, 0.12, "sawtooth", 0.05);
    },
    match() {
      tone(660, 0.1, "sine", 0.07);
      setTimeout(() => tone(880, 0.14, "sine", 0.06), 70);
    },
    complete() {
      [523, 659, 784, 1046].forEach((freq, i) => {
        setTimeout(() => tone(freq, 0.22, "sine", 0.07), i * 90);
      });
    },
  };
}
