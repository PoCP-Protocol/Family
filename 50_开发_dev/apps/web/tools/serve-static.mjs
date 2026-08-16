import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT ?? 5173);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.ts', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);

/**
 * 本地/沙箱开发服务器：项目历史入口是 JS，而 Family Platform 新模块使用 TS。
 * 为避免另建一份浏览器客户端，这里仅在开发时按请求即时转译相对 TS 模块；生产仍须走正式构建链。
 */
function resolveFile(relativePath) {
  const requested = normalize(join(root, relativePath));
  if (!requested.startsWith(root)) return null;
  if (existsSync(requested)) return requested;
  // 浏览器的 ESM 无扩展名导入由此映射到现有 .ts 源模块。
  if (!extname(requested) && existsSync(`${requested}.ts`)) return `${requested}.ts`;
  return null;
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const relativePath = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const filePath = resolveFile(relativePath);

  if (!filePath) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const extension = extname(filePath);
  if (extension === '.ts') {
    const source = readFileSync(filePath, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        verbatimModuleSyntax: true,
      },
      fileName: filePath,
    }).outputText;
    response.writeHead(200, { 'Content-Type': contentTypes.get('.ts'), 'Cache-Control': 'no-store' });
    response.end(output);
    return;
  }

  response.writeHead(200, { 'Content-Type': contentTypes.get(extension) ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Family web listening on http://localhost:${port}`);
});
