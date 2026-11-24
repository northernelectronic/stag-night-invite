# Stag Night invite (SAMPLE) — Playfair Fun & Games

"You're Invited to Play." Sample invitation game: the groom (Dave) runs a hotel floor, throws sausages at cartoon escorts, drinks beers for health, grabs blue pills for 5-second SUPER sausages, beats the Diva and reaches the elevator to open the invite.

All names, dates and venue in `config.json` are placeholders (`"sample": true` shows a "Sample invite" badge).
`rsvpEndpoint` is `"local"`: RSVPs are saved only on the guest's device (localStorage key `playfair-stag-sample-rsvp`). Set an HTTPS endpoint to receive JSON POSTs (guestName, attending, stayingOver, message, eventName, date, time, location, hostName, submittedAt).

Run locally: `python3 -m http.server 8771` then open http://127.0.0.1:8771/. Page is noindex/nofollow. No ads, no tracking, no third-party requests.
