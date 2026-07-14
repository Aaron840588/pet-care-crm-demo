$lines = Get-Content 'src\views\DashboardView.jsx'
$out = $lines[0..265] + $lines[327..($lines.Length - 1)]
$out | Set-Content 'src\views\DashboardView.jsx' -Encoding UTF8
