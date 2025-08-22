/**
 * Coletor de Logs do Supabase para Debug
 * Extrai logs e diagnósticos do Supabase
 */

import logger from '../logger';

interface SupabaseLogCollector {
  collectProjectLogs(projectId: string): Promise<void>;
  checkRLSPolicies(tableName: string): Promise<void>;
  checkUserPermissions(userId: string, tableName: string): Promise<void>;
}

export class SupabaseDebugger {
  private supabaseClient: any;

  constructor(client: any) {
    this.supabaseClient = client;
  }

  /**
   * Verifica políticas RLS para uma tabela
   */
  async checkRLSPolicies(tableName: string): Promise<void> {
    const operationId = `check_rls_${tableName}_${Date.now()}`;
    
    try {
      logger.info('Checking RLS policies', {
        operation: 'check_rls_policies',
        operation_id: operationId,
        table: tableName
      });

      // Tentar fazer um select simples para verificar RLS
      const { data, error } = await this.supabaseClient
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) {
        logger.error('RLS check failed', error, {
          operation: 'check_rls_policies',
          operation_id: operationId,
          table: tableName,
          error_code: error.code,
          error_hint: error.hint
        });
      } else {
        logger.info('RLS check passed', {
          operation: 'check_rls_policies',
          operation_id: operationId,
          table: tableName,
          can_read: true,
          rows_returned: data?.length || 0
        });
      }
    } catch (err) {
      logger.error('RLS check exception', err, {
        operation: 'check_rls_policies',
        operation_id: operationId,
        table: tableName
      });
    }
  }

  /**
   * Verifica permissões do usuário atual
   */
  async checkCurrentUserPermissions(): Promise<void> {
    const operationId = `check_user_perms_${Date.now()}`;
    
    try {
      logger.info('Checking current user permissions', {
        operation: 'check_user_permissions',
        operation_id: operationId
      });

      // Verificar usuário autenticado
      const { data: { user }, error: authError } = await this.supabaseClient.auth.getUser();

      if (authError || !user) {
        logger.error('No authenticated user found', authError, {
          operation: 'check_user_permissions',
          operation_id: operationId,
          has_auth_error: !!authError
        });
        return;
      }

      logger.info('User authenticated', {
        operation: 'check_user_permissions',
        operation_id: operationId,
        user_id: user.id,
        user_role: user.role,
        user_email_domain: user.email?.split('@')[1],
        user_metadata: Object.keys(user.user_metadata || {})
      });

      // Verificar se o usuário é admin
      const { data: userData, error: userError } = await this.supabaseClient
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (userError) {
        logger.error('Failed to check admin status', userError, {
          operation: 'check_user_permissions',
          operation_id: operationId,
          user_id: user.id
        });
      } else {
        logger.info('Admin status checked', {
          operation: 'check_user_permissions',
          operation_id: operationId,
          user_id: user.id,
          is_admin: userData?.is_admin || false
        });
      }

      // Testar operações CRUD em raffles
      await this.testCRUDPermissions('raffles', user.id);
    } catch (err) {
      logger.error('Permission check exception', err, {
        operation: 'check_user_permissions',
        operation_id: operationId
      });
    }
  }

  /**
   * Testa permissões CRUD em uma tabela
   */
  private async testCRUDPermissions(tableName: string, userId: string): Promise<void> {
    const operationId = `test_crud_${tableName}_${Date.now()}`;
    const permissions = {
      can_read: false,
      can_create: false,
      can_update: false,
      can_delete: false
    };

    // Test READ
    try {
      const { data, error } = await this.supabaseClient
        .from(tableName)
        .select('id')
        .limit(1);
      
      permissions.can_read = !error;
      
      if (error) {
        logger.debug('Read permission test failed', {
          operation: 'test_crud_permissions',
          operation_id: operationId,
          table: tableName,
          permission: 'READ',
          error_code: error.code
        });
      }
    } catch (err) {
      // Silent fail for permission test
    }

    // Test UPDATE (find a record to test)
    try {
      const { data: existingRecord } = await this.supabaseClient
        .from(tableName)
        .select('id')
        .limit(1)
        .single();

      if (existingRecord) {
        // Dry run - não fazer update real, apenas verificar se seria possível
        const { error } = await this.supabaseClient
          .from(tableName)
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingRecord.id)
          .eq('id', 'test_permission_check_12345') // Condição impossível para evitar update real
          .select();
        
        // Se o erro for "no rows returned" significa que temos permissão
        permissions.can_update = error?.code === 'PGRST116';
        
        if (error && error.code !== 'PGRST116') {
          logger.debug('Update permission test failed', {
            operation: 'test_crud_permissions',
            operation_id: operationId,
            table: tableName,
            permission: 'UPDATE',
            error_code: error.code
          });
        }
      }
    } catch (err) {
      // Silent fail for permission test
    }

    logger.info('CRUD permissions tested', {
      operation: 'test_crud_permissions',
      operation_id: operationId,
      table: tableName,
      user_id: userId,
      permissions
    });
  }

  /**
   * Coleta informações sobre a conexão com o Supabase
   */
  async collectConnectionInfo(): Promise<void> {
    const operationId = `connection_info_${Date.now()}`;
    
    try {
      logger.info('Collecting Supabase connection info', {
        operation: 'connection_info',
        operation_id: operationId
      });

      // Verificar saúde da conexão fazendo uma query simples
      const startTime = performance.now();
      const { error } = await this.supabaseClient
        .from('raffles')
        .select('count')
        .limit(1);
      
      const latency = Math.round(performance.now() - startTime);

      if (error) {
        logger.error('Connection health check failed', error, {
          operation: 'connection_info',
          operation_id: operationId,
          latency_ms: latency
        });
      } else {
        logger.info('Connection healthy', {
          operation: 'connection_info',
          operation_id: operationId,
          latency_ms: latency,
          is_healthy: true
        });

        // Log warning se latência alta
        if (latency > 500) {
          logger.warn('High Supabase latency detected', {
            operation: 'connection_info',
            operation_id: operationId,
            latency_ms: latency,
            threshold_ms: 500
          });
        }
      }
    } catch (err) {
      logger.error('Connection info collection failed', err, {
        operation: 'connection_info',
        operation_id: operationId
      });
    }
  }

  /**
   * Executa diagnóstico completo
   */
  async runFullDiagnostics(tableName: string = 'raffles'): Promise<void> {
    logger.info('Starting Supabase diagnostics', {
      operation: 'supabase_diagnostics',
      table: tableName
    });

    await this.collectConnectionInfo();
    await this.checkCurrentUserPermissions();
    await this.checkRLSPolicies(tableName);

    logger.info('Supabase diagnostics completed', {
      operation: 'supabase_diagnostics',
      table: tableName
    });
  }
}

export default SupabaseDebugger;