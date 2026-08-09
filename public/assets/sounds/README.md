# Classic sound mapping

The website maps these local files in `src/hooks/useSound.ts`:

- `xpstartup.wav`, `xplogon.wav`, `xplogoff.wav`, `xpshutdn.wav` - session lifecycle
- `xpmenu.wav` - buttons and menu commands
- `xpmin.wav`, `xprestor.wav` - minimise, maximise, restore and Show Desktop
- `xpding.wav` - opening folders and project files
- `xpnotify.wav`, `xpexcl.wav`, `xperror.wav`, `xpcrtstp.wav` - information, warning, error and critical dialogs
- `xprecycl.wav` - deleting or emptying Recycle Bin items
- `xpprint.wav` - Print commands
- `xphdinst.wav`, `xphdrem.wav`, `xphdfail.wav` - hardware-style events available to portfolio features
- `xpballn.wav`, `xpdef.wav` - balloon and default notification cues
- `xpbatlow.wav`, `xpbatcrt.wav` - low and critical battery cues
- `xpringin.wav`, `xprngout.wav` - incoming and outgoing communication cues

Only interaction-relevant cues are preloaded. Long lifecycle clips use a shared channel so startup, logon, logoff and shutdown sounds cannot play over one another. Muting immediately stops active audio.
