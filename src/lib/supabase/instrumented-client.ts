/**
 * Cliente Supabase Instrumentado com Observabilidade Completa
 */

import { createClient } from './client';
import logger from '../logger';
import type { SupabaseClient } from '@supabase/supabase-js';

class InstrumentedSupabaseClient {
  private client: ReturnType<typeof createClient>;
  private operationCounter = 0;

  constructor() {
    this.client = createClient();
  }

  private generateOperationId(): string {
    this.operationCounter++;
    return `op_${Date.now()}_${this.operationCounter}`;
  }

  private async instrumentedQuery(
    queryBuilder: any,
    table: string,
    operation: string,
    filters?: any
  ): Promise<any> {
    const operationId = this.generateOperationId();
    const startTime = performance.now();
    
    // Log início da operação
    logger.info(`Starting Supabase operation: ${operation}`, {
      operation: `${operation}_${table}`,
      db: { table },
      operation_id: operationId,
      filters: filters ? Object.keys(filters) : undefined
    });

    try {
      const result = await queryBuilder;
      const duration = Math.round(performance.now() - startTime);

      // Verificar se há erro no resultado
      if (result.error) {
        // Log detalhado para erros RLS
        if (result.error.code === '42501') {
          console.error('=== ERRO RLS DETECTADO NO CLIENTE INSTRUMENTADO ===');
          console.error('Tabela:', table);
          console.error('Operação:', operation);
          console.error('Mensagem:', result.error.message);
          console.error('Detalhes:', result.error.details);
          console.error('Hint:', result.error.hint);
          console.error('Filtros aplicados:', filters);
          
          // Verificar sessão atual
          const session = await this.client.auth.getSession();
          console.error('Sessão atual:', {
            hasSession: !!session.data.session,
            userId: session.data.session?.user?.id,
            userEmail: session.data.session?.user?.email,
            expiresAt: session.data.session?.expires_at
          });
        }

        logger.error(`Supabase operation failed: ${operation}`, result.error, {
          operation: `${operation}_${table}`,
          operation_id: operationId,
          db: {
            table,
            duration_ms: duration,
            query: operation
          },
          error: {
            type: result.error.code === '42501' ? 'RLS_VIOLATION' : 'SupabaseError',
            message: result.error.message,
            code: result.error.code,
            details: result.error.details,
            hint: result.error.hint
          },
          filters
        });
      } else {
        // Log sucesso com métricas
        logger.info(`Supabase operation completed: ${operation}`, {
          operation: `${operation}_${table}`,
          operation_id: operationId,
          db: {
            table,
            duration_ms: duration,
            query: operation,
            rows_affected: result.data ? (Array.isArray(result.data) ? result.data.length : 1) : 0
          },
          status_code: result.status,
          count: result.count
        });

        // Log de warning para operações lentas
        if (duration > 1000) {
          logger.warn(`Slow Supabase operation detected: ${operation}`, {
            operation: `${operation}_${table}`,
            operation_id: operationId,
            db: {
              table,
              duration_ms: duration,
              query: operation
            },
            threshold_ms: 1000
          });
        }
      }

      return result;
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      
      logger.error(`Supabase operation exception: ${operation}`, error, {
        operation: `${operation}_${table}`,
        operation_id: operationId,
        db: {
          table,
          duration_ms: duration,
          query: operation
        },
        filters
      });
      
      throw error;
    }
  }

  // Wrapper para select
  public from(table: string) {
    const self = this;
    const originalFrom = this.client.from(table);

    return {
      select: function(columns?: string) {
        const query = originalFrom.select(columns);
        const wrappedQuery = {
          ...query,
          eq: function(column: string, value: any) {
            const eqQuery = query.eq(column, value);
            return self.wrapQuery(eqQuery, table, 'select', { [column]: value });
          },
          single: function() {
            const singleQuery = query.single();
            return self.wrapQuery(singleQuery, table, 'select_single', {});
          },
          then: function(onfulfilled?: any, onrejected?: any) {
            return self.instrumentedQuery(query, table, 'select', {})
              .then(onfulfilled, onrejected);
          }
        };
        return wrappedQuery;
      },
      
      update: function(data: any) {
        const query = originalFrom.update(data);
        const wrappedQuery = {
          ...query,
          eq: function(column: string, value: any) {
            const eqQuery = query.eq(column, value);
            const instrumentedEq = {
              ...eqQuery,
              select: function() {
                const selectQuery = eqQuery.select();
                return self.wrapQuery(selectQuery, table, 'update', { 
                  [column]: value,
                  data_keys: Object.keys(data),
                  data_size: JSON.stringify(data).length
                });
              },
              then: function(onfulfilled?: any, onrejected?: any) {
                return self.instrumentedQuery(eqQuery, table, 'update', {
                  [column]: value,
                  data_keys: Object.keys(data),
                  data_size: JSON.stringify(data).length
                }).then(onfulfilled, onrejected);
              }
            };
            return instrumentedEq;
          }
        };
        return wrappedQuery;
      },

      insert: function(data: any) {
        // Log detalhado para INSERT - crítico para debug de RLS
        const dataArray = Array.isArray(data) ? data : [data];
        console.log(`[SUPABASE INSERT] Table: ${table}`);
        console.log('[SUPABASE INSERT] Data to insert:', JSON.stringify(dataArray, null, 2));
        
        // Verificar campos críticos para RLS
        dataArray.forEach((item, index) => {
          console.log(`[SUPABASE INSERT] Record ${index + 1}:`, {
            has_created_by: 'created_by' in item,
            created_by_value: item.created_by || 'NOT SET',
            has_user_id: 'user_id' in item,
            user_id_value: item.user_id || 'NOT SET'
          });
        });

        const query = originalFrom.insert(data);
        const wrappedQuery = {
          ...query,
          select: function(columns?: string) {
            const selectQuery = query.select(columns);
            return self.wrapQuery(selectQuery, table, 'insert', {
              data_keys: Array.isArray(data) ? Object.keys(data[0] || {}) : Object.keys(data),
              data_size: JSON.stringify(data).length,
              with_select: true,
              created_by: Array.isArray(data) ? data[0]?.created_by : data.created_by
            });
          },
          then: function(onfulfilled?: any, onrejected?: any) {
            return self.instrumentedQuery(query, table, 'insert', {
              data_keys: Array.isArray(data) ? Object.keys(data[0] || {}) : Object.keys(data),
              data_size: JSON.stringify(data).length,
              created_by: Array.isArray(data) ? data[0]?.created_by : data.created_by
            }).then(onfulfilled, onrejected);
          }
        };
        return wrappedQuery;
      },

      delete: function() {
        const query = originalFrom.delete();
        const wrappedQuery = {
          ...query,
          eq: function(column: string, value: any) {
            const eqQuery = query.eq(column, value);
            return self.wrapQuery(eqQuery, table, 'delete', { [column]: value });
          }
        };
        return wrappedQuery;
      }
    };
  }

  private wrapQuery(query: any, table: string, operation: string, filters: any) {
    const self = this;
    return {
      ...query,
      then: function(onfulfilled?: any, onrejected?: any) {
        return self.instrumentedQuery(query, table, operation, filters)
          .then(onfulfilled, onrejected);
      }
    };
  }

  // Wrapper para auth
  public get auth() {
    const originalAuth = this.client.auth;
    const self = this;

    return {
      ...originalAuth,
      getSession: async function() {
        const timer = logger.startTimer();
        const operationId = self.generateOperationId();
        
        console.log('[AUTH] Getting session...');
        
        try {
          const result = await originalAuth.getSession();
          
          console.log('[AUTH] Session result:', {
            hasSession: !!result.data.session,
            hasError: !!result.error,
            userId: result.data.session?.user?.id,
            userEmail: result.data.session?.user?.email,
            expiresAt: result.data.session?.expires_at,
            tokenType: result.data.session?.token_type,
            provider: result.data.session?.user?.app_metadata?.provider
          });
          
          if (result.error) {
            console.error('[AUTH] Session error:', result.error);
            logger.error('Failed to get session', result.error, {
              operation: 'auth_get_session',
              operation_id: operationId
            });
          } else {
            timer.end('Session retrieved', {
              operation: 'auth_get_session',
              operation_id: operationId,
              has_session: !!result.data.session
            });
          }
          
          return result;
        } catch (error) {
          console.error('[AUTH] Exception getting session:', error);
          logger.error('Exception getting session', error, {
            operation: 'auth_get_session',
            operation_id: operationId
          });
          throw error;
        }
      },

      refreshSession: async function() {
        const timer = logger.startTimer();
        const operationId = self.generateOperationId();
        
        console.log('[AUTH] Refreshing session...');
        
        try {
          const result = await originalAuth.refreshSession();
          
          console.log('[AUTH] Refresh result:', {
            hasNewSession: !!result.data.session,
            hasError: !!result.error,
            userId: result.data.session?.user?.id,
            newExpiresAt: result.data.session?.expires_at
          });
          
          if (result.error) {
            console.error('[AUTH] Refresh error:', result.error);
            logger.error('Failed to refresh session', result.error, {
              operation: 'auth_refresh_session',
              operation_id: operationId
            });
          } else {
            timer.end('Session refreshed', {
              operation: 'auth_refresh_session',
              operation_id: operationId,
              has_new_session: !!result.data.session
            });
          }
          
          return result;
        } catch (error) {
          console.error('[AUTH] Exception refreshing session:', error);
          logger.error('Exception refreshing session', error, {
            operation: 'auth_refresh_session',
            operation_id: operationId
          });
          throw error;
        }
      },

      getUser: async function() {
        const timer = logger.startTimer();
        const operationId = self.generateOperationId();
        
        console.log('[AUTH] Getting user...');
        
        logger.info('Getting authenticated user', {
          operation: 'auth_get_user',
          operation_id: operationId
        });

        try {
          const result = await originalAuth.getUser();
          
          console.log('[AUTH] User result:', {
            hasUser: !!result.data.user,
            hasError: !!result.error,
            userId: result.data.user?.id,
            userEmail: result.data.user?.email,
            userRole: result.data.user?.role,
            emailConfirmed: result.data.user?.email_confirmed_at,
            createdAt: result.data.user?.created_at,
            lastSignIn: result.data.user?.last_sign_in_at,
            provider: result.data.user?.app_metadata?.provider
          });
          
          if (result.error) {
            console.error('[AUTH] User error:', result.error);
            logger.error('Failed to get authenticated user', result.error, {
              operation: 'auth_get_user',
              operation_id: operationId,
              error: {
                type: 'AuthError',
                message: result.error.message,
                code: result.error.status
              }
            });
          } else {
            timer.end('Authenticated user retrieved', {
              operation: 'auth_get_user',
              operation_id: operationId,
              user_id_hash: result.data.user ? 
                `user_${result.data.user.id.slice(-6)}` : null
            });
          }
          
          return result;
        } catch (error) {
          console.error('[AUTH] Exception getting user:', error);
          logger.error('Exception getting authenticated user', error, {
            operation: 'auth_get_user',
            operation_id: operationId
          });
          throw error;
        }
      },

      signIn: async function(credentials: any) {
        const timer = logger.startTimer();
        const operationId = self.generateOperationId();
        
        logger.info('User sign in attempt', {
          operation: 'auth_sign_in',
          operation_id: operationId,
          method: credentials.email ? 'email' : 'phone'
        });

        try {
          const result = await originalAuth.signIn(credentials);
          
          if (result.error) {
            logger.error('Sign in failed', result.error, {
              operation: 'auth_sign_in',
              operation_id: operationId
            });
          } else {
            timer.end('Sign in successful', {
              operation: 'auth_sign_in',
              operation_id: operationId
            });
          }
          
          return result;
        } catch (error) {
          logger.error('Sign in exception', error, {
            operation: 'auth_sign_in',
            operation_id: operationId
          });
          throw error;
        }
      },

      signOut: async function() {
        const timer = logger.startTimer();
        const operationId = self.generateOperationId();
        
        logger.info('User sign out', {
          operation: 'auth_sign_out',
          operation_id: operationId
        });

        try {
          const result = await originalAuth.signOut();
          timer.end('Sign out completed', {
            operation: 'auth_sign_out',
            operation_id: operationId
          });
          return result;
        } catch (error) {
          logger.error('Sign out exception', error, {
            operation: 'auth_sign_out',
            operation_id: operationId
          });
          throw error;
        }
      }
    };
  }

  // Retornar cliente original para operações não instrumentadas
  public get rawClient() {
    return this.client;
  }
}

// Singleton
let instrumentedClient: InstrumentedSupabaseClient | null = null;

export function createInstrumentedClient(): InstrumentedSupabaseClient {
  if (!instrumentedClient) {
    instrumentedClient = new InstrumentedSupabaseClient();
  }
  return instrumentedClient;
}

export default createInstrumentedClient;