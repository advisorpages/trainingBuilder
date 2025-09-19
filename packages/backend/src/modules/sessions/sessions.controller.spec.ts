import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { StatusUpdateDto } from './dto/status-update.dto';
import { SessionStatus } from '../../entities/session.entity';
import { UserRole } from '../../entities/user.entity';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: jest.Mocked<SessionsService>;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    role: UserRole.CONTENT_DEVELOPER,
  };

  const mockSession = {
    id: 'session-id',
    title: 'Test Session',
    description: 'Test Description',
    status: SessionStatus.DRAFT,
    authorId: 'user-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findDrafts: jest.fn(),
            findPublished: jest.fn(),
            updateStatus: jest.fn(),
            savePrompt: jest.fn(),
            generateAiContent: jest.fn(),
            integrateAiContent: jest.fn(),
            createRegistration: jest.fn(),
            getPublicSession: jest.fn(),
            generateQrCode: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<SessionsController>(SessionsController);
    service = module.get(SessionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const createSessionDto: CreateSessionDto = {
        topicId: 'topic-id',
        locationId: 'location-id',
        trainerId: 'trainer-id',
        sessionDate: '2024-12-31',
        startTime: '10:00',
        durationMinutes: 60,
        audienceId: 'audience-id',
        categoryId: 'category-id',
        toneId: 'tone-id',
      };

      service.create.mockResolvedValue(mockSession as any);

      const result = await controller.create(createSessionDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createSessionDto, mockUser.id);
      expect(result).toEqual(mockSession);
    });
  });

  describe('findAll', () => {
    it('should return all sessions for content developer', async () => {
      const mockSessions = [mockSession];
      service.findAll.mockResolvedValue(mockSessions as any);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, mockUser.role);
      expect(result).toEqual(mockSessions);
    });
  });

  describe('findOne', () => {
    it('should return a session by id', async () => {
      service.findOne.mockResolvedValue(mockSession as any);

      const result = await controller.findOne('session-id', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('session-id', mockUser.id, mockUser.role);
      expect(result).toEqual(mockSession);
    });
  });

  describe('update', () => {
    it('should update a session', async () => {
      const updateSessionDto: UpdateSessionDto = {
        title: 'Updated Title',
      };

      const updatedSession = { ...mockSession, title: 'Updated Title' };
      service.update.mockResolvedValue(updatedSession as any);

      const result = await controller.update('session-id', updateSessionDto, mockUser);

      expect(service.update).toHaveBeenCalledWith('session-id', updateSessionDto, mockUser.id);
      expect(result).toEqual(updatedSession);
    });
  });

  describe('updateStatus', () => {
    it('should update session status', async () => {
      const statusUpdateDto: StatusUpdateDto = {
        status: SessionStatus.PUBLISHED,
        reason: 'Ready for publication',
      };

      const updatedSession = { ...mockSession, status: SessionStatus.PUBLISHED };
      service.updateStatus.mockResolvedValue(updatedSession as any);

      const result = await controller.updateStatus('session-id', statusUpdateDto, mockUser);

      expect(service.updateStatus).toHaveBeenCalledWith(
        'session-id',
        statusUpdateDto.status,
        mockUser.id,
        statusUpdateDto.reason,
      );
      expect(result).toEqual(updatedSession);
    });
  });

  describe('findDrafts', () => {
    it('should return draft sessions', async () => {
      const mockDrafts = [{ ...mockSession, status: SessionStatus.DRAFT }];
      service.findDrafts.mockResolvedValue(mockDrafts as any);

      const result = await controller.findDrafts(mockUser);

      expect(service.findDrafts).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockDrafts);
    });
  });

  describe('findPublished', () => {
    it('should return published sessions', async () => {
      const mockPublished = [{ ...mockSession, status: SessionStatus.PUBLISHED }];
      service.findPublished.mockResolvedValue(mockPublished as any);

      const result = await controller.findPublished();

      expect(service.findPublished).toHaveBeenCalled();
      expect(result).toEqual(mockPublished);
    });
  });

  describe('generateQrCode', () => {
    it('should generate QR code for session', async () => {
      const mockQrResult = {
        success: true,
        qrCodeUrl: 'https://test-qr.com/test.png',
        publicUrl: 'https://app.com/sessions/session-id',
      };

      service.generateQrCode.mockResolvedValue(mockQrResult);

      const result = await controller.generateQrCode('session-id', mockUser);

      expect(service.generateQrCode).toHaveBeenCalledWith('session-id', mockUser.id);
      expect(result).toEqual(mockQrResult);
    });
  });

  describe('getPublicSession', () => {
    it('should return public session without authentication', async () => {
      const mockPublicSession = {
        id: 'session-id',
        title: 'Test Session',
        description: 'Test Description',
        sessionDate: '2024-12-31',
        startTime: '10:00',
        location: { name: 'Test Location' },
        trainer: { firstName: 'John', lastName: 'Doe' },
      };

      service.getPublicSession.mockResolvedValue(mockPublicSession as any);

      const result = await controller.getPublicSession('session-id');

      expect(service.getPublicSession).toHaveBeenCalledWith('session-id');
      expect(result).toEqual(mockPublicSession);
    });
  });

  describe('remove', () => {
    it('should remove a session', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('session-id', mockUser);

      expect(service.remove).toHaveBeenCalledWith('session-id', mockUser.id);
    });
  });
});