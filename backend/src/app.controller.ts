import { Controller, Get } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type PackageInfo = {
  version: string;
};

const packageInfo = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
) as PackageInfo;

@Controller()
export class AppController {
  @Get()
  health() {
    return { ok: true, service: 'calendar-api' };
  }

  @Get('version')
  version() {
    return {
      service: 'calendar-api',
      version: packageInfo.version,
      imageTag: `dev-${packageInfo.version}`,
    };
  }
}
