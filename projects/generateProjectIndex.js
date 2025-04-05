const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, 'projects');
const outputPath = path.join(projectDir, 'index.html');

const folders = fs.readdirSync(projectDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Index of projects</title>
    <link rel="stylesheet" href="../../assets/styles/global.css">
    <style>
      body { font-family: monospace; padding: 2em; background: #fff; color: #000; }
      a { color: #000; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>Index of /projects</h1>
    <ul>
      <li><a href="../">../</a></li>
      ${folders.map(folder => `<li><a href="./${folder}/">${folder}/</a></li>`).join('\n      ')}
    </ul>
  </body>
</html>
`;

fs.writeFileSync(outputPath, html);
console.log(`✔ Index written to ${outputPath}`);