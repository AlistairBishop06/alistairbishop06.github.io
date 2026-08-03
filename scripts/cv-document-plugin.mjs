import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const virtualModuleId = 'virtual:cv-document';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const documentsDirectory = join(projectRoot, 'public', 'documents');

function findCvDocument() {
  if (!existsSync(documentsDirectory)) return null;

  const pdfs = readdirSync(documentsDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
    .map(entry => {
      const stats = statSync(join(documentsDirectory, entry.name));
      return { fileName: entry.name, modifiedAt: stats.mtimeMs, size: stats.size };
    })
    .sort((left, right) => right.modifiedAt - left.modifiedAt || left.fileName.localeCompare(right.fileName));

  const selected = pdfs[0];
  if (!selected) return null;

  return {
    fileName: selected.fileName,
    size: selected.size,
    url: `./documents/${encodeURIComponent(selected.fileName)}`,
  };
}

export default function cvDocumentPlugin() {
  return {
    name: 'cv-document-resolver',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return;
      const document = findCvDocument();
      const label = document ? document.fileName : 'no PDF found';
      this.info(`CV document: ${label}`);
      return `export default ${JSON.stringify(document)};`;
    },
    configureServer(server) {
      server.watcher.add(documentsDirectory);
      const reloadDocument = file => {
        if (dirname(resolve(file)) !== documentsDirectory || !file.toLowerCase().endsWith('.pdf')) return;
        const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reloadDocument);
      server.watcher.on('change', reloadDocument);
      server.watcher.on('unlink', reloadDocument);
    },
  };
}
