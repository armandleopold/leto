# Inventory of the projects Leto builds on

Leto does not start from a blank page. This document lists the open-source
projects it starts from, what was read in each, and what Leto does with it:
reuse it as a dependency, port it to Rust, or keep it as a reference.

Everything below was read at the commits listed, on 2026-11-17. Line counts are
`wc -l` on source files and are there to size the work, not to be exact.

## Summary

| Project | Role | Language | Size | Licence | Leto's decision |
|---|---|---|---|---|---|
| [Apollo] | Host (fork of Sunshine) | C++ | about 52,000 lines + 5,600 of web UI | GPL-3.0-only | **Port** to Rust, Windows first |
| [Apollo microphone fork] | Host with client microphone | C++ | Apollo + mic patch | GPL-3.0-only | **Port** the microphone receiver |
| [Artemis] | Android client (fork of Moonlight Android) | Java + C | 43,300 Java, 38,600 C | GPL-3.0 | Reference only, superseded by Super Artemis |
| [Super Artemis] | Android client (fork of Artemis) | Java + C | 65,800 Java, 11,200 of tests | GPL-3.0 | **Start from it** for the Android client |
| [moonlight-common-c] | Client protocol core used by every Moonlight client | C | reference implementation | GPL-3.0 | Reference only |
| [moonlight-common-rust] | Client protocol core in Rust | Rust | about 39,000 lines | GPL-3.0-or-later | **Reuse** as a dependency |
| [moonlight-web-stream] | Web client: bridge server + browser app | Rust + TypeScript | 10,500 Rust, 19,700 TypeScript | GPL-3.0-or-later | **Reuse** the bridge design, replace the UI |
| [Craft Anything] | Not streaming: a Rust app with one engine and several shells | Rust | n/a | n/a | **Follow** its repository structure |
| [eframe_template] | Minimal egui app, native and web | Rust | small | MIT OR Apache-2.0 | Reference for the app shell |

[Apollo]: https://github.com/ClassicOldSong/Apollo
[Apollo microphone fork]: https://github.com/logabell/apollo-microphone
[Artemis]: https://github.com/ClassicOldSong/moonlight-android
[Super Artemis]: https://github.com/Arora-Sir/Super-Artemis
[moonlight-common-c]: https://github.com/moonlight-stream/moonlight-common-c
[moonlight-common-rust]: https://github.com/MrCreativ3001/moonlight-common-rust
[moonlight-web-stream]: https://github.com/MrCreativ3001/moonlight-web-stream
[Craft Anything]: https://github.com/storytold/craft-anything
[eframe_template]: https://github.com/emilk/eframe_template

Commits read:

| Project | Commit | Date |
|---|---|---|
| Apollo | `adc5c5a` | 2026-05-21 |
| Apollo microphone fork | `9979406` | 2026-03-18 |
| Artemis | `c5cf27f` | 2026-09-09 |
| Super Artemis | `465127d` | 2026-11-13 |
| Super Artemis's moonlight-common-c (branch `super-artemis`) | `1578f05` | 2026-11-13 |
| moonlight-common-c | `94c65fd` | 2026-11-13 |
| moonlight-common-rust | `23bbe19` | 2026-11-21 |
| moonlight-web-stream | `c1de423` (v3.0.2) | 2026-11-16 |
| eframe_template | `f108546` | 2026-08-31 |

## Licence consequence

Apollo, like Sunshine, declares `GPL-3.0-only` (`CMakeLists.txt`, packaging
files). A Rust port of Apollo is a derivative work of it, so Leto as a whole is
licensed **GPL-3.0-only**. The GPL-3.0-or-later projects (moonlight-common-rust,
moonlight-web-stream) can be combined with it without trouble.

## The host: Apollo

Apollo is Sunshine plus features aimed at remote desktop use. Size of `src/`:

| Part | Lines | Notes |
|---|---|---|
| Shared code (`src/*.cpp`, `src/*.h`) | 25,200 | Pairing, RTSP, streams, encoding pipeline, input, process launcher, config |
| Windows (`src/platform/windows`) | 12,500 | Capture (DXGI, WGC), audio (WASAPI), input, virtual display |
| Linux (`src/platform/linux`) | 10,200 | KMS, X11 and Wayland capture, VAAPI and CUDA, PulseAudio, input |
| macOS (`src/platform/macos`) | 2,200 | AVFoundation capture, audio and input |
| NVENC (`src/nvenc`) | 1,600 | Direct NVENC encoder |
| Web UI (`src_assets/common/assets/web`) | 5,600 | Vue configuration pages |
| Tests | 3,000 | |

What Apollo adds over Sunshine, and what Leto keeps:

| Apollo feature | Where | Leto |
|---|---|---|
| Virtual display that matches the client's resolution | `platform/windows/virtual_display.*`, the SudoVDA driver. Windows only | Keep, by talking to the same SudoVDA driver. The driver itself is not rewritten |
| Per-client permissions | `crypto.h` (`PERM` bit field: inputs, clipboard, files, server commands, list, view, launch) | Keep, and add microphone and camera permissions |
| Clipboard sync, server commands, file transfer | Control stream messages 15 to 17 in `stream.cpp`, `nvhttp.cpp` | Keep, later in the host step |
| Input-only mode, per-app identifiers | `nvhttp.cpp`, `process.cpp` | Keep |
| Extra `serverinfo` fields (`Permission`, `VirtualDisplayCapable`, `VirtualDisplayDriverReady`, `currentgameuuid`) | `nvhttp.cpp` | Keep, so Artemis clients see Leto as an Apollo host |
| Web configuration UI | `confighttp.cpp`, Vue pages | **Dropped.** The Leto app is the configuration UI |

How the port maps onto Apollo's files:

| Apollo | Does | Port order |
|---|---|---|
| `nvhttp.cpp`, `crypto.cpp` | Pairing (PIN and certificates), `serverinfo`, app list, launch and resume | 1 |
| `rtsp.cpp` | Session negotiation (DESCRIBE, SETUP, ANNOUNCE, PLAY) | 2 |
| `stream.cpp` | Control stream over ENet, video and audio packets, forward error correction, encryption | 3 |
| `audio.cpp`, `platform/windows/audio.cpp` | Capture of the host's sound, Opus encoding | 4 |
| `video.cpp`, `nvenc/`, `platform/windows/display_*.cpp` | Screen capture and hardware encoding | 5 |
| `input.cpp`, `platform/windows/input.cpp` | Keyboard, mouse, touch, pen and gamepad injection | 6 |
| `process.cpp` | Starting and stopping apps | 7 |
| `display_device.cpp`, `platform/windows/virtual_display.cpp` | Display configuration and the virtual display | 8 |
| `upnp.cpp`, `system_tray.cpp`, `entry_handler.cpp`, `platform/windows/publish.cpp` | Port forwarding, tray icon, service, mDNS | 9 |

Linux and macOS host code is ported after Windows works end to end.

Apollo's HTTPS server asks for the client's certificate but gives OpenSSL no
session id context: its `after_bind` in `nvhttp.cpp` sets the verify mode and
callback, nothing else. OpenSSL then answers any resumed TLS session with an
`internal_error` alert ("session id context uninitialized"), so a client must
make a full handshake on every connection. Seen on a real Apollo: the PC
showed the pairing as done, and Leto's next request failed with that alert.
The same failure was reproduced against an OpenSSL server set up the same way,
and went away once Leto stopped resuming sessions. Sunshine, whose code this
is, most likely does the same.

Apollo makes a screen of its own for a stream when the client asks: its
`/launch` reads `virtualDisplay=1`, the `mode` every client sends (width,
height and pace) and `scaleFactor`, 100 unless said, by which it multiplies
the width and height of that screen and of the stream (`process.cpp`), to
draw more pixels than the client shows. Leto never sends it. A screen mode or "always use a virtual display" that its owner set for
the device in Apollo's pages wins over what the client asks. Read in
Apollo's source; Leto asks for it, and the stand-in host records what it was
asked (`FakeHost::screen_asked`).

### Client microphone: not in stock Apollo

Stock Apollo cannot receive the client's microphone. The feature lives in the
[Apollo microphone fork] (the work behind Apollo pull request 1428, not merged
at the commit read). What it adds:

- `stream.h`: a fourth stream, `MIC_STREAM_PORT = 12`.
- `rtsp.cpp`: the host advertises the stream in its session description and
  accepts `SETUP streamid=mic`. It disables the microphone for the session if
  the client did not negotiate microphone encryption.
- `platform/windows/mic_write.{h,cpp}` and `apollo_vmic.{h,cpp}`: Opus decoding
  and a WASAPI writer into the "Steam Streaming Microphone" device. Windows has
  no user-mode way to create a microphone, so an installed virtual audio device
  is required.
- `platform/linux/audio.cpp`: the same into a PulseAudio or PipeWire virtual sink.
- Settings `stream_mic` and `mic_backend`.

The wire format is the one moonlight-common-rust calls the "Foundation
Sunshine" microphone extension. It is described in
[return-channel.md](return-channel.md).

### Client camera: nowhere

None of the projects read forwards the client's camera to the host. Leto has
to define this itself. See [return-channel.md](return-channel.md).

## The Android client: Super Artemis

Artemis is ClassicOldSong's fork of Moonlight Android with Apollo's extras
(virtual display, permissions, clipboard, server commands). Super Artemis is a
maintained fork of Artemis that adds, among other things:

- Client microphone, end to end: `binding/audio/MicrophoneCaptureManager.java`
  (capture with `AudioRecord`), a native Opus encoder thread in
  `jni/moonlight-core/callbacks.c`, and `MicrophoneStream.c` in its fork of
  moonlight-common-c. It speaks the same microphone extension as above.
- A Material You interface, a quick menu during the stream, custom keys.
- Documentation (`docs/ARCHITECTURE.md`, `TESTING.md`, `UPSTREAM.md`) and
  11,200 lines of tests, against about 1,500 in Artemis.

Decision: the Leto Android client starts from Super Artemis, not from Artemis
and not from a blank Rust app. Video decoding on Android goes through
`MediaCodec` with years of per-device workarounds (`decoder-errata.txt`), and
that knowledge is not worth rewriting. The plan is to keep the Android app,
rebrand and simplify its interface, add the camera, and move protocol code to
the shared Rust core over time (moonlight-common-rust already ships uniffi
bindings for this).

## The client protocol core: moonlight-common-rust

Every Moonlight client uses moonlight-common-c for the protocol. A Rust
implementation already exists and is active (last commit on the day of this
inventory): moonlight-common-rust.

- Sans-IO: the protocol logic does no networking itself, so it runs on native
  sockets and in the browser (WebAssembly) alike.
- Supports Sunshine, Apollo and "Foundation Sunshine" hosts, H.264 and H.265,
  every encryption mode, and the microphone extension, encrypted or not. At
  the revision Leto uses, it sets the microphone up for Foundation Sunshine
  only: for the Apollo microphone fork, which speaks the same extension, Leto
  finds out itself and presents the host under that name.
- Modules: `http` (pairing, `serverinfo`, launch), `stream/proto` (RTSP, SDP,
  control over ENet, video, audio, microphone, FEC), `crypto`, `high` (ready
  made clients on `std` and `tokio`), `webrtc`, and `bindings` (uniffi).
- Gaps compared with moonlight-common-c: no AV1, no reference frame
  invalidation, no long-term reference frames, no Nvidia GameStream hosts.
- Not published on crates.io at the time of reading. moonlight-web-stream uses
  it as a git dependency pinned to a revision. Leto did the same, then copied
  that revision into `vendor/moonlight-common` to choose AV1, which it never
  chose (see that folder's README).

Decision: Leto's client core is built on moonlight-common-rust instead of
porting moonlight-common-c a second time. Gaps that matter (AV1 first) are
contributed upstream where possible.

Found while building on it, at commit `5a3aa1f`, and still there at
`23bbe19` unless said otherwise. None of these is reported upstream yet:

- Up to `5a3aa1f`, its ready-made HTTPS clients accepted any certificate.
  Since `23bbe19` its own HTTPS client only accepts the host's certificate
  from pairing. Leto keeps its own transport anyway, which also never resumes
  a TLS session (see [architecture.md](architecture.md)).
- The client queues the end of the control connection ahead of the host's
  goodbye message, so the reason a host gives for ending a stream never
  reaches the application: every ending looks like a lost connection.
  `leto-client` asks the host over HTTPS which app it is running to tell a
  closed app from a broken stream.
- On the host side, the audio payloader panics when audio is encrypted and
  recovery packets are on (the recovery buffers are 16 bytes longer than the
  data they protect). Only the stand-in host uses that code. It sends no audio
  recovery packets when audio is encrypted.
- Its input queue holds mouse movement and the wheel back for up to a
  millisecond, to merge them, while clicks and keys leave at once. A click
  can therefore reach the host before the movement that came before it, and
  land in the wrong place. `leto-client` sends movement and the wheel around
  that queue, in the order they were made.

## The web client: moonlight-web-stream

A browser cannot open the UDP and TCP sockets the protocol needs, so a web
client always needs a bridge. moonlight-web-stream is that bridge:

- A Rust server (`actix-web`) that pairs with the host as a normal client,
  using moonlight-common-rust, and relays the stream to the browser over
  WebRTC, or over a WebSocket with WebCodecs decoding as a fallback.
- A TypeScript browser app: stream view, input, gamepads, settings, user
  accounts and an admin page.
- It already forwards the browser's microphone
  (`web/stream/audio/microphone_pipe.ts`, `getUserMedia`).

Decision: Leto reuses the bridge design, and replaces the TypeScript interface
with the Leto app compiled to WebAssembly so the web client looks and behaves
like the desktop one. Until the Leto host exists, the bridge runs next to
Apollo. Later the Leto host serves the web client itself.

The transport, decided when the bridge was written in step 2: a WebSocket and
WebCodecs first, not WebRTC. This reverses what this document first said, for
these reasons:

- Leto's bridge runs on the network of the person's own devices. WebRTC earns
  its complexity when packets are lost or when the two ends have to find a
  path to each other, and a home network asks for neither.
- A WebSocket and the browser's own decoders are a few hundred lines on each
  side, with nothing to negotiate. A WebRTC stack in the bridge is a large
  dependency, and its browser half decides on its own how long to hold a
  picture back, which is hard to keep low.
- The cost is a TCP connection: when a packet is lost, what follows waits for
  it. The bridge drops pictures instead of queueing them when a browser falls
  behind, so the delay stays bounded.

WebRTC stays the answer for reaching a bridge from outside the home, and can
be added next to the WebSocket without changing the rest: the engine hands
the bridge encoded pictures and sound either way.

## Repository structure: Craft Anything

Not a streaming project. Leto follows how it is organised: a Cargo workspace
with logic in `crates/`, thin shells in `apps/` (graphical app, command line,
and later others), one `xtask` crate for automation, strict lint settings, an
`AGENTS.md` for contributors, and an interface with a Simple mode by default
and an Advanced mode on demand. See [architecture.md](architecture.md).
