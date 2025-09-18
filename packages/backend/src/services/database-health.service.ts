import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async checkHealth(): Promise<{
    status: string;
    connected: boolean;
    entities: number;
    schemaVersion?: string;
    tableCounts?: Record<string, number>;
    connectionInfo: {
      host: string;
      database: string;
      type: string;
    };
  }> {
    try {
      // Check basic connection
      const isConnected = this.dataSource.isInitialized;

      if (!isConnected) {
        return {
          status: 'disconnected',
          connected: false,
          entities: 0,
          connectionInfo: {
            host: 'unknown',
            database: 'unknown',
            type: 'postgres',
          },
        };
      }

      // Get entity count
      const entities = this.dataSource.entityMetadatas.length;

      // Get schema version from system settings
      let schemaVersion: string | undefined;
      try {
        const versionResult = await this.dataSource.query(
          "SELECT value FROM system_settings WHERE key = 'schema_version'"
        );
        schemaVersion = versionResult[0]?.value;
      } catch (error) {
        this.logger.warn('Could not retrieve schema version', error);
      }

      // Get table counts for verification
      const tableCounts: Record<string, number> = {};
      const tableNames = [
        'users', 'roles', 'sessions', 'locations', 'trainers',
        'topics', 'registrations', 'incentives', 'coaching_tips'
      ];

      for (const tableName of tableNames) {
        try {
          const countResult = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM ${tableName}`
          );
          tableCounts[tableName] = parseInt(countResult[0]?.count || '0');
        } catch (error) {
          this.logger.warn(`Could not count table ${tableName}`, error);
          tableCounts[tableName] = -1; // Indicates error
        }
      }

      return {
        status: 'healthy',
        connected: true,
        entities,
        schemaVersion,
        tableCounts,
        connectionInfo: {
          host: (this.dataSource.options as any).host || 'unknown',
          database: (this.dataSource.options as any).database || 'unknown',
          type: this.dataSource.options.type,
        },
      };

    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'error',
        connected: false,
        entities: 0,
        connectionInfo: {
          host: 'error',
          database: 'error',
          type: 'postgres',
        },
      };
    }
  }

  async testEntityRelationships(): Promise<{
    status: string;
    tests: Array<{ name: string; passed: boolean; details?: string }>;
  }> {
    const tests: Array<{ name: string; passed: boolean; details?: string }> = [];

    try {
      // Test 1: User-Role relationship
      try {
        const userWithRole = await this.dataSource.query(`
          SELECT u.email, r.name as role_name
          FROM users u
          JOIN roles r ON u.role_id = r.id
          LIMIT 1
        `);
        tests.push({
          name: 'User-Role Relationship',
          passed: userWithRole.length > 0,
          details: userWithRole.length > 0 ? `Found user: ${userWithRole[0]?.email}` : 'No users with roles found'
        });
      } catch (error) {
        tests.push({
          name: 'User-Role Relationship',
          passed: false,
          details: `Error: ${error.message}`
        });
      }

      // Test 2: Session-Author relationship
      try {
        const sessionWithAuthor = await this.dataSource.query(`
          SELECT s.title, u.email as author_email
          FROM sessions s
          JOIN users u ON s.author_id = u.id
          LIMIT 1
        `);
        tests.push({
          name: 'Session-Author Relationship',
          passed: sessionWithAuthor.length > 0,
          details: sessionWithAuthor.length > 0 ? `Found session: ${sessionWithAuthor[0]?.title}` : 'No sessions with authors found'
        });
      } catch (error) {
        tests.push({
          name: 'Session-Author Relationship',
          passed: false,
          details: `Error: ${error.message}`
        });
      }

      // Test 3: Session-Topics many-to-many
      try {
        const sessionTopics = await this.dataSource.query(`
          SELECT s.title, t.name as topic_name
          FROM sessions s
          JOIN session_topics st ON s.id = st.session_id
          JOIN topics t ON st.topic_id = t.id
          LIMIT 1
        `);
        tests.push({
          name: 'Session-Topics Many-to-Many',
          passed: sessionTopics.length > 0,
          details: sessionTopics.length > 0 ? `Found session-topic: ${sessionTopics[0]?.title} - ${sessionTopics[0]?.topic_name}` : 'No session-topic relationships found'
        });
      } catch (error) {
        tests.push({
          name: 'Session-Topics Many-to-Many',
          passed: false,
          details: `Error: ${error.message}`
        });
      }

      // Test 4: Registration-Session relationship
      try {
        const registrationWithSession = await this.dataSource.query(`
          SELECT r.name, r.email, s.title as session_title
          FROM registrations r
          JOIN sessions s ON r.session_id = s.id
          LIMIT 1
        `);
        tests.push({
          name: 'Registration-Session Relationship',
          passed: registrationWithSession.length > 0,
          details: registrationWithSession.length > 0 ? `Found registration: ${registrationWithSession[0]?.name}` : 'No registrations found'
        });
      } catch (error) {
        tests.push({
          name: 'Registration-Session Relationship',
          passed: false,
          details: `Error: ${error.message}`
        });
      }

      const passedTests = tests.filter(t => t.passed).length;
      const totalTests = tests.length;

      return {
        status: passedTests === totalTests ? 'all_passed' : 'some_failed',
        tests,
      };

    } catch (error) {
      this.logger.error('Entity relationship tests failed', error);
      return {
        status: 'error',
        tests: [{
          name: 'Global Test',
          passed: false,
          details: `Error: ${error.message}`
        }],
      };
    }
  }
}