type Toast = (t: { message: string; tone?: 'success' | 'info' }) => void;

/** Native share sheet where available, else copy the current URL. */
export function shareOrCopy(title: string, toast: Toast, text?: string) {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
    return;
  }
  navigator.clipboard?.writeText(url).then(
    () => toast({ message: 'Link copied', tone: 'info' }),
    () => toast({ message: 'Could not copy the link', tone: 'info' }),
  );
}

/** Triggers a browser download of generated text content. */
export function downloadText(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}
