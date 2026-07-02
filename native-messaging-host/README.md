# Native Messaging host

Registration for the GHLG native app as a browser Native Messaging host
(Chrome first; structured so Firefox is a small addition).

Why Native Messaging: it is stdio-based and OS-gated to the registered,
trusted extension only. It is not network-reachable and not URL-addressable
by any webpage — GHLG deliberately opens **zero network ports**.

Contents (added in delivery step 8):
- `com.ghlg.host.json` — host manifest template (path + allowed extension ID)
- registration logic invoked by the native app on first run
