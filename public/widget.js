/* Helpforge embeddable widget — stub.
 *
 * The real widget ships in Phase 7 polish. For now this script just logs that
 * it loaded so the embed snippet on the settings page demonstrates the
 * delivery contract: <script src="..." data-project="..." async></script>.
 *
 * The data-project attribute carries the Helpforge project id. In the real
 * widget this will be used to scope the chat to the right knowledge base.
 */
(function () {
  try {
    const me = document.currentScript;
    const projectId = me && me.getAttribute("data-project");
    if (!projectId) {
      console.warn("[helpforge] widget loaded without data-project attribute");
      return;
    }
    console.info("[helpforge] widget stub loaded for project", projectId);
  } catch (e) {
    // Best-effort. Don't ever break the host page.
    console.error("[helpforge] widget stub error", e);
  }
})();
