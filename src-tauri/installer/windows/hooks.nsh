!macro NSIS_HOOK_PREUNINSTALL
  ${If} $UpdateMode <> 1
    nsExec::ExecToLog '"$INSTDIR\${MAINBINARYNAME}.exe" --cleanup'
  ${EndIf}
!macroend