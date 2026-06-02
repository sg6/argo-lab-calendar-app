import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = join(projectRoot, 'public', 'version.txt');
const version = packageJson.version;

const content = [
  'service=calendar-frontend',
  `version=${version}`,
  `image_tag=dev-${version}`,
  `built_at=${new Date().toISOString()}`,
  '',
].join('\n');

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, content, 'utf8');
