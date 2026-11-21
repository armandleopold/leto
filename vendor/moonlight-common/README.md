# moonlight-common, as Leto builds it

This is the protocol crate of
[moonlight-common-rust](https://github.com/MrCreativ3001/moonlight-common-rust)
at commit `23bbe19d3bb760a5c659bfc9e0db16747beac878` (2026-11-19), under its
own licence, the GPL 3.0 or later (`LICENSE`). Leto used to take it with git;
it is copied here because Leto needs changes upstream does not have. It was
first copied at `5a3aa1f`; the move to `23bbe19` brought upstream's new HTTPS
clients (its own, on rustls, in place of ureq and hyper) and changes to its
tokio driver, neither of which Leto uses.

Only the crate itself is here: its source and licence. The C bindings, the
examples and what its tests and examples need were left out of `Cargo.toml`.
It is not a member of Leto's workspace, so Leto's lints and tests leave it
alone, as they did when it came from git.

## Leto's changes

Each is marked with a comment that starts with `Leto:`.

- `src/stream/proto/mod.rs`: AV1 is chosen when the host offers it in its
  DESCRIBE and the client says it decodes it, before H.265 and H.264, as
  moonlight-common-c does. The upstream commit never chose AV1. The rest of
  the crate already carried AV1 pictures.
- `src/stream/proto/sdp/server.rs`: a host offers AV1 with the line
  `a=rtpmap:98 AV1/90000`, which the commit read as an attribute named
  `rtpmap` and so never recognised. It is recognised now, as
  moonlight-common-c does: `AV1/90000` anywhere in that attribute.
- `src/stream/std/driver.rs`: a UDP socket reads on when the system reports
  that a packet it sent met a closed port (a reset connection on Windows, a
  refused one elsewhere), as moonlight-common-c does. The commit stopped the
  whole stream on it.
- `src/stream/proto/audio/payloader.rs`: the recovery packets of encrypted
  sound are as long as its data packets, as Sunshine and Apollo send them.
  The commit made them longer and panicked. Only Leto's stand-in host sends
  sound with this crate.
- `src/stream/proto/control/packet.rs`: the state of a gamepad is sent
  reliably, as moonlight-common-c sends it. The commit sent it unreliable
  and sequenced, so a state lost on the way was never sent again, and a
  button let go stayed held on the PC until the gamepad moved again.

## Updating

Copy `src/` from a newer commit, apply the changes above again, and compare
its `Cargo.toml` with this one. Once a commit upstream chooses AV1 itself
and sends the state of a gamepad reliably, Leto can go back to taking the
crate with git.
