import { errorMessage } from '../services/http';

/**
 * Open a record file through a short-lived signed link from the server.
 *
 * The tab is opened synchronously (inside the click) so pop-up blockers
 * allow it, then pointed at the signed URL once it arrives. Links expire in
 * five minutes and are never stored.
 */
export async function openSignedFile(
  fetchUrl: () => Promise<{ url: string }>,
  onError: (message: string) => void,
): Promise<void> {
  const tab = window.open('', '_blank');
  try {
    const { url } = await fetchUrl();
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.assign(url);
    }
  } catch (e) {
    tab?.close();
    onError(errorMessage(e));
  }
}
