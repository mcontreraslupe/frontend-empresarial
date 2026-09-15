const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const report = path.resolve(process.cwd(), 'executive-report', 'index.html');
if (!fs.existsSync(report)) {
  console.error('No existe un reporte ejecutivo. Ejecuta primero una suite de Playwright.');
  process.exitCode = 1;
} else {
  const command =
    process.platform === 'win32'
      ? { executable: 'cmd', arguments: ['/c', 'start', '', report] }
      : process.platform === 'darwin'
        ? { executable: 'open', arguments: [report] }
        : { executable: 'xdg-open', arguments: [report] };
  const child = spawn(command.executable, command.arguments, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref();
}
