/**
 * Speaker that takes a string. CommandBar is the only caller.
 * Missing `speechSynthesis` is a silent no-op — the log still writes.
 */
export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* swallowed — log line still appears */
  }
}

export function cancelSpeech(): void {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* swallowed */
  }
}
