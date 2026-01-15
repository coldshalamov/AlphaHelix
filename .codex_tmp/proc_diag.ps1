 = @('antigravity','cursor','code','gravity')
 = foreach ( in ) {
   = ('Name LIKE ''%{0}%''' -f )
  Get-CimInstance Win32_Process -Filter  -ErrorAction SilentlyContinue |
    Select-Object Name, ProcessId, CommandLine
}
 | Sort-Object Name, ProcessId | Format-Table -AutoSize
