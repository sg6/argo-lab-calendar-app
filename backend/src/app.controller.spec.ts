import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status', () => {
      expect(appController.health()).toEqual({ ok: true, service: 'calendar-api' });
    });
  });

  describe('version', () => {
    it('should return package version information', () => {
      expect(appController.version()).toEqual({
        service: 'calendar-api',
        version: '0.0.3',
        imageTag: 'dev-0.0.3',
      });
    });
  });
});
