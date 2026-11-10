; Remove only the legacy duplicate that points at this installed executable.
!macro customInstall
  Push $0
  Push $1
  nsExec::ExecToStack '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -WindowStyle Hidden -Command "$$p = $\'$SMPROGRAMS\Royesh (2).lnk$\'; if (Test-Path -LiteralPath $$p) { $$w = New-Object -ComObject WScript.Shell; $$l = $$w.CreateShortcut($$p); if ($$l.TargetPath -eq $\'$INSTDIR\Royesh.exe$\') { Remove-Item -LiteralPath $$p } }"'
  Pop $0
  Pop $1
  Pop $1
  Pop $0
!macroend
