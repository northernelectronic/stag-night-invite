# Stag Night invite (SAMPLE) — Playfair Fun & Games

"You're Invited to Play." Sample invitation game: the groom (Dave) runs a hotel floor, throws sausages at cartoon escorts, drinks beers for health, grabs blue pills for 5-second SUPER sausages, beats the Diva and reaches the elevator to open the invite.

All names, dates and venue in `config.json` are placeholders (`"sample": true` shows a "Sample invite" badge).
`rsvpEndpoint` is `"local"`: RSVPs are saved only on the guest's device (localStorage key `playfair-stag-sample-rsvp`). Set an HTTPS endpoint to receive JSON POSTs (guestName, attending, stayingOver, message, eventName, date, time, location, hostName, submittedAt).

Run locally: `python3 -m http.server 8771` then open http://127.0.0.1:8771/. Page is noindex/nofollow. No ads, no tracking, no third-party requests.

## v2: first-person graphics

The game now runs first-person by default. It uses a raycast hotel floor with baked warm lighting from the sconces, ceiling lights, ice machine and elevator, soft ambient occlusion, fog depth, a patterned carpet with a border, damask wallpaper over wainscoting, numbered brass door plates and props. Escort sprites are outlined and animated, and there's a sausage-hand viewmodel, a glowing super-sausage trail and particles.

- `?view=topdown`: the original v1 top-down version.
- `?q=0|1|2`: forces a quality tier (render scale 0.8 / 0.6 / 0.45). Without it, the game drops a tier automatically when frames average over ~20 ms.

## v3: voices + landing how-to + new win gag

- The how-to-play copy now sits on the landing screen; Play goes straight into the level.
- Voice clips in `audio/` (15 short mono MP3s, ~180 KB total) were generated offline on the build box with open-source Parler-TTS models (Apache-2.0 weights): `parler-tts-mini-expresso` (expressive Talia/Elisabeth/Jerry voices; note its Expresso training data is CC-BY-NC), `parler-tts-mini-v1` (described flirty voices) and `parler-tts-mini-multilingual-v1.1` (Italian-voiced "Mamma mia"). Several takes per line were scored with Whisper transcription + pitch-variation checks and the best kept, then trimmed, compressed, given a light hallway reverb and loudness-normalised to about -16 LUFS. No accounts or online TTS services were used. They're decoded with WebAudio after the first tap (iOS unlock), follow the HUD mute toggle and have cooldowns so they don't spam.
