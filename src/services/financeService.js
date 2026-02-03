import { supabase } from './supabase';
import { auditService } from './auditService';
import { formatCurrency, formatDate } from '../utils/formatters';

export const financeService = {
  // Process driver payouts
  async processPayout(payoutId, action, processedBy, notes = '') {
    try {
      const { data: payout, error: payoutError } = await supabase
        .from('payouts')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (payoutError) throw payoutError;

      if (payout.status !== 'pending') {
        throw new Error(`Payout is already ${payout.status}`);
      }

      let updateData = {};
      let transactionData = {};

      switch (action) {
        case 'approve':
          updateData = {
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: processedBy,
            processed_at: new Date().toISOString(),
            notes
          };
          transactionData = {
            status: 'completed',
            reference_id: `PAYOUT_${payoutId}_${Date.now()}`
          };
          break;

        case 'reject':
          updateData = {
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejected_by: processedBy,
            rejection_reason: notes,
            notes
          };
          transactionData = {
            status: 'failed',
            failure_reason: notes
          };
          break;

        case 'hold':
          updateData = {
            status: 'on_hold',
            held_at: new Date().toISOString(),
            held_by: processedBy,
            hold_reason: notes,
            notes
          };
          transactionData = {
            status: 'on_hold'
          };
          break;

        default:
          throw new Error('Invalid payout action');
      }

      // Update payout status
      const { data: updatedPayout, error: updateError } = await supabase
        .from('payouts')
        .update(updateData)
        .eq('id', payoutId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update associated transaction
      if (payout.transaction_id) {
        await supabase
          .from('wallet_transactions')
          .update(transactionData)
          .eq('id', payout.transaction_id);
      }

      // If approved, update driver's wallet
      if (action === 'approve') {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', payout.driver_id)
          .eq('user_type', 'driver')
          .single();

        if (!walletError) {
          const newBalance = wallet.balance - payout.amount;
          await supabase
            .from('wallets')
            .update({
              balance: newBalance,
              last_payout_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', payout.driver_id)
            .eq('user_type', 'driver');
        }
      }

      // Log the action
      await auditService.logAdminAction({
        admin_id: processedBy,
        action_type: `payout.${action}`,
        resource_type: 'payout',
        resource_id: payoutId,
        details: {
          amount: payout.amount,
          driver_id: payout.driver_id,
          payout_method: payout.payout_method,
          notes
        }
      });

      // Send notification to driver if approved or rejected
      if (action === 'approve' || action === 'reject') {
        await supabase
          .from('notifications')
          .insert({
            title: `Payout ${action === 'approve' ? 'Approved' : 'Rejected'}`,
            message: `Your payout request of ${formatCurrency(payout.amount, payout.currency)} has been ${action === 'approve' ? 'approved and processed' : 'rejected'}.${notes ? ` Reason: ${notes}` : ''}`,
            type: action === 'approve' ? 'success' : 'warning',
            recipient_type: 'specific',
            recipient_ids: [payout.driver_id],
            sender_id: processedBy,
            sender_type: 'admin'
          });
      }

      return { data: updatedPayout, error: null };
    } catch (error) {
      console.error('Error processing payout:', error);
      return { data: null, error };
    }
  },

  // Process payment refunds
  async processRefund(refundData) {
    try {
      const { 
        trip_id, 
        amount, 
        reason, 
        processed_by, 
        refund_method = 'original',
        notes = ''
      } = refundData;

      // Get trip details
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('total_amount, passenger_id, payment_status, payment_id')
        .eq('id', trip_id)
        .single();

      if (tripError) throw tripError;

      if (trip.payment_status !== 'paid') {
        throw new Error('Trip payment is not paid, cannot process refund');
      }

      if (amount > trip.total_amount) {
        throw new Error('Refund amount cannot exceed trip total amount');
      }

      // Create refund transaction
      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert({
          trip_id,
          user_id: trip.passenger_id,
          user_type: 'passenger',
          type: 'refund',
          amount: -amount, // Negative amount for refund
          status: 'completed',
          payment_method: refund_method,
          reference_id: `REFUND_${trip_id}_${Date.now()}`,
          notes: `${reason}. ${notes}`,
          processed_by,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transError) throw transError;

      // Update trip payment status
      const { data: updatedTrip, error: updateError } = await supabase
        .from('trips')
        .update({
          payment_status: 'refunded',
          refund_amount: amount,
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
          refunded_by: processed_by,
          admin_notes: notes
        })
        .eq('id', trip_id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update payment record if exists
      if (trip.payment_id) {
        await supabase
          .from('payments')
          .update({
            status: 'refunded',
            refund_amount: amount,
            refund_reason: reason
          })
          .eq('id', trip.payment_id);
      }

      // Update passenger's wallet if refunding to wallet
      if (refund_method === 'wallet') {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', trip.passenger_id)
          .eq('user_type', 'passenger')
          .single();

        if (!walletError) {
          const newBalance = wallet.balance + amount;
          await supabase
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', trip.passenger_id)
            .eq('user_type', 'passenger');
        }
      }

      await auditService.logAdminAction({
        admin_id: processed_by,
        action_type: 'payment.refund',
        resource_type: 'trip',
        resource_id: trip_id,
        details: {
          amount,
          reason,
          refund_method,
          trip_amount: trip.total_amount
        }
      });

      // Send notification to passenger
      await supabase
        .from('notifications')
        .insert({
          title: 'Refund Processed',
          message: `Your refund of ${formatCurrency(amount, 'USD')} has been processed.${notes ? ` Notes: ${notes}` : ''}`,
          type: 'info',
          recipient_type: 'specific',
          recipient_ids: [trip.passenger_id],
          sender_id: processed_by,
          sender_type: 'admin'
        });

      return { 
        data: {
          transaction,
          trip: updatedTrip,
          refund_amount: amount,
          refund_method
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { data: null, error };
    }
  },

  // Get financial reports
  async getFinancialReports(filters = {}) {
    try {
      const { report_type = 'daily', ...otherFilters } = filters;
      
      let startDate = new Date();
      let groupBy = 'date';

      switch (report_type) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 30);
          groupBy = 'date';
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 90);
          groupBy = 'week';
          break;
        case 'monthly':
          startDate.setFullYear(startDate.getFullYear() - 1);
          groupBy = 'month';
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Get revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .from('trips')
        .select('created_at, total_amount, commission_amount, driver_earning, currency')
        .eq('status', 'completed')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (revenueError) throw revenueError;

      // Get transaction data
      const { data: transactionData, error: transError } = await supabase
        .from('transactions')
        .select('created_at, amount, type, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (transError) throw transError;

      // Get payout data
      const { data: payoutData, error: payoutError } = await supabase
        .from('payouts')
        .select('created_at, amount, status, payout_method')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (payoutError) throw payoutError;

      // Process data into reports
      const reports = this.processFinancialData(
        revenueData || [],
        transactionData || [],
        payoutData || [],
        groupBy,
        report_type
      );

      // Calculate summary statistics
      const summary = this.calculateFinancialSummary(reports);

      return {
        data: {
          reports,
          summary,
          report_type,
          period: {
            start_date: startDate.toISOString(),
            end_date: new Date().toISOString()
          },
          generated_at: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      return { data: null, error };
    }
  },

  // Adjust wallet balance
  async adjustWalletBalance(walletId, adjustmentData) {
    try {
      const { 
        amount, 
        type, // 'credit' or 'debit'
        reason, 
        reference_id, 
        notes, 
        adjusted_by 
      } = adjustmentData;

      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance, user_id, user_type')
        .eq('id', walletId)
        .single();

      if (walletError) throw walletError;

      // Calculate new balance
      const adjustmentAmount = type === 'credit' ? amount : -amount;
      const newBalance = wallet.balance + adjustmentAmount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance for debit adjustment');
      }

      // Create adjustment transaction
      const { data: transaction, error: transError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletId,
          user_id: wallet.user_id,
          user_type: wallet.user_type,
          type: 'adjustment',
          amount: adjustmentAmount,
          status: 'completed',
          reference_id: reference_id || `ADJUST_${walletId}_${Date.now()}`,
          description: reason,
          notes: notes || `Manual adjustment by admin. Type: ${type}, Amount: ${amount}`,
          metadata: {
            adjusted_by,
            adjustment_type: type,
            previous_balance: wallet.balance,
            new_balance: newBalance
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transError) throw transError;

      // Update wallet balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
          last_adjusted_at: new Date().toISOString(),
          last_adjusted_by: adjusted_by
        })
        .eq('id', walletId)
        .select()
        .single();

      if (updateError) throw updateError;

      await auditService.logAdminAction({
        admin_id: adjusted_by,
        action_type: 'wallet.adjust',
        resource_type: 'wallet',
        resource_id: walletId,
        details: {
          user_id: wallet.user_id,
          user_type: wallet.user_type,
          type,
          amount,
          previous_balance: wallet.balance,
          new_balance: newBalance,
          reason,
          notes
        }
      });

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          title: 'Wallet Balance Adjusted',
          message: `Your wallet balance has been ${type === 'credit' ? 'increased' : 'decreased'} by ${formatCurrency(amount, 'USD')}.${notes ? ` Notes: ${notes}` : ''}`,
          type: 'info',
          recipient_type: 'specific',
          recipient_ids: [wallet.user_id],
          sender_id: adjusted_by,
          sender_type: 'admin'
        });

      return { 
        data: {
          transaction,
          wallet: updatedWallet,
          adjustment: {
            type,
            amount,
            previous_balance: wallet.balance,
            new_balance: newBalance
          }
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error adjusting wallet balance:', error);
      return { data: null, error };
    }
  },

  // Get revenue statistics
  async getRevenueStatistics(timeRange = '30d') {
    try {
      let startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Get completed trips with payments
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('created_at, total_amount, commission_amount, driver_earning, currency')
        .eq('status', 'completed')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (tripsError) throw tripsError;

      // Get transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('created_at, amount, type')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (transError) throw transError;

      // Get payouts
      const { data: payouts, error: payoutError } = await supabase
        .from('payouts')
        .select('created_at, amount, status')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'approved')
        .order('created_at');

      if (payoutError) throw payoutError;

      // Calculate statistics
      const totalRevenue = trips.reduce((sum, trip) => sum + trip.total_amount, 0);
      const totalCommission = trips.reduce((sum, trip) => sum + trip.commission_amount, 0);
      const totalDriverEarnings = trips.reduce((sum, trip) => sum + trip.driver_earning, 0);
      const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);
      
      const revenueByDay = this.groupByDay(trips, 'total_amount');
      const commissionByDay = this.groupByDay(trips, 'commission_amount');
      const payoutsByDay = this.groupByDay(payouts, 'amount');

      // Calculate daily averages
      const days = Object.keys(revenueByDay).length || 1;
      const avgDailyRevenue = totalRevenue / days;
      const avgDailyCommission = totalCommission / days;

      // Calculate growth (compare last period to previous period)
      const growth = await this.calculateRevenueGrowth(startDate, timeRange);

      return {
        data: {
          time_range: timeRange,
          totals: {
            revenue: totalRevenue,
            commission: totalCommission,
            driver_earnings: totalDriverEarnings,
            payouts: totalPayouts,
            net_profit: totalCommission - totalPayouts,
            formatted_revenue: formatCurrency(totalRevenue, trips[0]?.currency || 'USD'),
            formatted_commission: formatCurrency(totalCommission, trips[0]?.currency || 'USD'),
            formatted_payouts: formatCurrency(totalPayouts, trips[0]?.currency || 'USD')
          },
          averages: {
            daily_revenue: avgDailyRevenue,
            daily_commission: avgDailyCommission,
            formatted_daily_revenue: formatCurrency(avgDailyRevenue, trips[0]?.currency || 'USD'),
            formatted_daily_commission: formatCurrency(avgDailyCommission, trips[0]?.currency || 'USD')
          },
          by_day: {
            revenue: revenueByDay,
            commission: commissionByDay,
            payouts: payoutsByDay
          },
          growth,
          transaction_types: this.groupByType(transactions),
          last_updated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching revenue statistics:', error);
      return { data: null, error };
    }
  },

  // Export financial data
  async exportFinancialData(format = 'csv', filters = {}) {
    try {
      const { data: reports, error } = await this.getFinancialReports(filters);
      
      if (error) throw error;
      if (!reports || !reports.data) {
        throw new Error('No data to export');
      }

      if (format === 'csv') {
        const csvContent = this.convertFinancialDataToCSV(reports.data);
        return {
          data: csvContent,
          filename: `financial_report_${filters.report_type || 'daily'}_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      } else if (format === 'json') {
        return {
          data: JSON.stringify(reports.data, null, 2),
          filename: `financial_report_${filters.report_type || 'daily'}_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      } else if (format === 'pdf') {
        // For PDF, prepare data for PDF generation
        return {
          data: this.prepareFinancialDataForPDF(reports.data),
          filename: `financial_report_${filters.report_type || 'daily'}_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting financial data:', error);
      return { data: null, error };
    }
  },

  // Get transaction history
  async getTransactionHistory(filters = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          trip:trips (id, pickup_address, dropoff_address),
          user:drivers!transactions_user_id_fkey (name),
          passenger:passengers!transactions_user_id_fkey (name)
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(
          `id.ilike.%${filters.search}%,reference_id.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.user_type) {
        query = query.eq('user_type', filters.user_type);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }

      // Date range filters
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters.min_amount) {
        query = query.gte('amount', filters.min_amount);
      }

      if (filters.max_amount) {
        query = query.lte('amount', filters.max_amount);
      }

      // Pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      // Sorting
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder !== 'desc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Format the data
      const formattedData = (data || []).map(transaction => ({
        ...transaction,
        formatted_amount: formatCurrency(Math.abs(transaction.amount), 'USD'),
        amount_type: transaction.amount >= 0 ? 'credit' : 'debit',
        created_at_formatted: formatDate(transaction.created_at, 'datetime'),
        user_name: transaction.user?.name || transaction.passenger?.name || 'Unknown'
      }));

      return { 
        data: formattedData, 
        count,
        error: null 
      };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return { data: null, count: 0, error };
    }
  },

  // Get wallet details
  async getWalletDetails(walletId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          *,
          user:drivers!wallets_user_id_fkey (name, email, phone),
          passenger:passengers!wallets_user_id_fkey (name, email, phone),
          transactions:wallet_transactions (*)
        `)
        .eq('id', walletId)
        .single();

      if (error) throw error;

      // Calculate statistics
      const transactions = data.transactions || [];
      const totalDeposits = transactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const totalTransactions = transactions.length;
      const lastTransaction = transactions.length > 0 
        ? transactions[transactions.length - 1] 
        : null;

      const formattedData = {
        ...data,
        formatted_balance: formatCurrency(data.balance, data.currency),
        user_name: data.user?.name || data.passenger?.name || 'Unknown',
        user_email: data.user?.email || data.passenger?.email || 'Unknown',
        user_phone: data.user?.phone || data.passenger?.phone || 'Unknown',
        statistics: {
          total_deposits: totalDeposits,
          total_withdrawals: totalWithdrawals,
          total_transactions: totalTransactions,
          formatted_total_deposits: formatCurrency(totalDeposits, data.currency),
          formatted_total_withdrawals: formatCurrency(totalWithdrawals, data.currency),
          last_transaction: lastTransaction ? {
            ...lastTransaction,
            formatted_amount: formatCurrency(Math.abs(lastTransaction.amount), data.currency),
            formatted_date: formatDate(lastTransaction.created_at, 'datetime')
          } : null
        },
        created_at_formatted: formatDate(data.created_at, 'full'),
        updated_at_formatted: formatDate(data.updated_at, 'full')
      };

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error fetching wallet details:', error);
      return { data: null, error };
    }
  },

  // Create payout batch
  async createPayoutBatch(batchData) {
    try {
      const { driver_ids, amount_per_driver, payout_method, notes, created_by } = batchData;

      if (!driver_ids || driver_ids.length === 0) {
        throw new Error('No drivers specified for payout batch');
      }

      if (amount_per_driver <= 0) {
        throw new Error('Invalid amount per driver');
      }

      const batchId = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const payouts = [];
      const errors = [];

      // Create payout for each driver
      for (const driverId of driver_ids) {
        try {
          // Check driver's wallet balance
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', driverId)
            .eq('user_type', 'driver')
            .single();

          if (walletError) {
            errors.push(`Driver ${driverId}: Wallet not found`);
            continue;
          }

          if (wallet.balance < amount_per_driver) {
            errors.push(`Driver ${driverId}: Insufficient balance (${wallet.balance} < ${amount_per_driver})`);
            continue;
          }

          // Create payout record
          const payout = {
            driver_id: driverId,
            amount: amount_per_driver,
            currency: 'USD',
            payout_method,
            status: 'pending',
            batch_id: batchId,
            notes: notes || `Batch payout from admin`,
            created_by,
            created_at: new Date().toISOString()
          };

          payouts.push(payout);
        } catch (error) {
          errors.push(`Driver ${driverId}: ${error.message}`);
        }
      }

      if (payouts.length === 0) {
        throw new Error('No valid payouts could be created. Errors: ' + errors.join('; '));
      }

      // Insert all payouts
      const { data, error } = await supabase
        .from('payouts')
        .insert(payouts)
        .select();

      if (error) throw error;

      // Create batch record
      await supabase
        .from('payout_batches')
        .insert({
          id: batchId,
          total_drivers: driver_ids.length,
          successful_payouts: payouts.length,
          failed_payouts: errors.length,
          total_amount: amount_per_driver * payouts.length,
          payout_method,
          status: 'created',
          notes,
          created_by,
          created_at: new Date().toISOString()
        });

      await auditService.logAdminAction({
        admin_id: created_by,
        action_type: 'payout.batch_create',
        resource_type: 'payout_batch',
        resource_id: batchId,
        details: {
          batch_id: batchId,
          total_drivers: driver_ids.length,
          successful_payouts: payouts.length,
          failed_payouts: errors.length,
          amount_per_driver,
          total_amount: amount_per_driver * payouts.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });

      return { 
        data: {
          batch_id: batchId,
          payouts: data,
          summary: {
            total_drivers: driver_ids.length,
            successful_payouts: payouts.length,
            failed_payouts: errors.length,
            total_amount: amount_per_driver * payouts.length
          },
          errors: errors.length > 0 ? errors : undefined
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error creating payout batch:', error);
      return { data: null, error };
    }
  },

  // Get pending payouts
  async getPendingPayouts(filters = {}) {
    try {
      let query = supabase
        .from('payouts')
        .select(`
          *,
          driver:drivers (name, email, phone, bank_account_details)
        `, { count: 'exact' })
        .eq('status', 'pending');

      // Apply filters
      if (filters.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }

      if (filters.payout_method) {
        query = query.eq('payout_method', filters.payout_method);
      }

      if (filters.min_amount) {
        query = query.gte('amount', filters.min_amount);
      }

      if (filters.max_amount) {
        query = query.lte('amount', filters.max_amount);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      // Pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Format the data
      const formattedData = (data || []).map(payout => ({
        ...payout,
        formatted_amount: formatCurrency(payout.amount, payout.currency),
        created_at_formatted: formatDate(payout.created_at, 'datetime'),
        driver_name: payout.driver?.name || 'Unknown'
      }));

      // Calculate totals
      const totalAmount = formattedData.reduce((sum, payout) => sum + payout.amount, 0);

      return { 
        data: formattedData, 
        count,
        totals: {
          amount: totalAmount,
          formatted_amount: formatCurrency(totalAmount, 'USD')
        },
        error: null 
      };
    } catch (error) {
      console.error('Error fetching pending payouts:', error);
      return { data: null, count: 0, error };
    }
  },

  // Helper methods
  processFinancialData(revenueData, transactionData, payoutData, groupBy, reportType) {
    const reports = {};
    const currency = 'USD'; // Assuming USD for simplicity

    // Process revenue data
    revenueData.forEach(trip => {
      const dateKey = this.getDateKey(trip.created_at, groupBy);
      if (!reports[dateKey]) {
        reports[dateKey] = {
          date: dateKey,
          revenue: 0,
          commission: 0,
          driver_earnings: 0,
          transactions: 0,
          payouts: 0,
          net_profit: 0
        };
      }

      reports[dateKey].revenue += trip.total_amount;
      reports[dateKey].commission += trip.commission_amount || 0;
      reports[dateKey].driver_earnings += trip.driver_earning || 0;
    });

    // Process transaction data
    transactionData.forEach(transaction => {
      const dateKey = this.getDateKey(transaction.created_at, groupBy);
      if (reports[dateKey]) {
        reports[dateKey].transactions += transaction.amount;
      }
    });

    // Process payout data
    payoutData.forEach(payout => {
      const dateKey = this.getDateKey(payout.created_at, groupBy);
      if (reports[dateKey]) {
        reports[dateKey].payouts += payout.amount;
      }
    });

    // Calculate net profit and format
    const formattedReports = Object.values(reports).map(report => {
      report.net_profit = report.commission - report.payouts;
      
      return {
        ...report,
        formatted_revenue: formatCurrency(report.revenue, currency),
        formatted_commission: formatCurrency(report.commission, currency),
        formatted_driver_earnings: formatCurrency(report.driver_earnings, currency),
        formatted_transactions: formatCurrency(report.transactions, currency),
        formatted_payouts: formatCurrency(report.payouts, currency),
        formatted_net_profit: formatCurrency(report.net_profit, currency)
      };
    });

    // Sort by date
    formattedReports.sort((a, b) => new Date(a.date) - new Date(b.date));

    return formattedReports;
  },

  getDateKey(dateString, groupBy) {
    const date = new Date(dateString);
    
    switch (groupBy) {
      case 'date':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekNumber = Math.ceil(date.getDate() / 7);
        return `${date.getFullYear()}-W${weekNumber}`;
      case 'month':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  },

  calculateFinancialSummary(reports) {
    if (!reports || reports.length === 0) {
      return {
        total_revenue: 0,
        total_commission: 0,
        total_payouts: 0,
        net_profit: 0,
        avg_daily_revenue: 0,
        avg_daily_commission: 0
      };
    }

    const totalRevenue = reports.reduce((sum, report) => sum + report.revenue, 0);
    const totalCommission = reports.reduce((sum, report) => sum + report.commission, 0);
    const totalPayouts = reports.reduce((sum, report) => sum + report.payouts, 0);
    const netProfit = totalCommission - totalPayouts;
    const days = reports.length;

    return {
      total_revenue: totalRevenue,
      total_commission: totalCommission,
      total_payouts: totalPayouts,
      net_profit: netProfit,
      avg_daily_revenue: totalRevenue / days,
      avg_daily_commission: totalCommission / days,
      avg_daily_payouts: totalPayouts / days,
      formatted_total_revenue: formatCurrency(totalRevenue, 'USD'),
      formatted_total_commission: formatCurrency(totalCommission, 'USD'),
      formatted_total_payouts: formatCurrency(totalPayouts, 'USD'),
      formatted_net_profit: formatCurrency(netProfit, 'USD'),
      formatted_avg_daily_revenue: formatCurrency(totalRevenue / days, 'USD'),
      formatted_avg_daily_commission: formatCurrency(totalCommission / days, 'USD')
    };
  },

  groupByDay(data, amountField) {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = 0;
      }
      grouped[date] += item[amountField] || 0;
    });

    return grouped;
  },

  groupByType(transactions) {
    const grouped = {};
    
    transactions.forEach(transaction => {
      if (!grouped[transaction.type]) {
        grouped[transaction.type] = {
          count: 0,
          amount: 0
        };
      }
      grouped[transaction.type].count++;
      grouped[transaction.type].amount += transaction.amount;
    });

    // Format amounts
    Object.keys(grouped).forEach(type => {
      grouped[type].formatted_amount = formatCurrency(grouped[type].amount, 'USD');
    });

    return grouped;
  },

  async calculateRevenueGrowth(startDate, timeRange) {
    try {
      const previousStartDate = new Date(startDate);
      let previousEndDate = new Date(startDate);
      
      // Calculate previous period based on timeRange
      switch (timeRange) {
        case '24h':
          previousStartDate.setDate(previousStartDate.getDate() - 2);
          previousEndDate.setDate(previousEndDate.getDate() - 1);
          break;
        case '7d':
          previousStartDate.setDate(previousStartDate.getDate() - 14);
          previousEndDate.setDate(previousEndDate.getDate() - 7);
          break;
        case '30d':
          previousStartDate.setDate(previousStartDate.getDate() - 60);
          previousEndDate.setDate(previousEndDate.getDate() - 30);
          break;
        default:
          previousStartDate.setDate(previousStartDate.getDate() - 60);
          previousEndDate.setDate(previousEndDate.getDate() - 30);
      }

      // Get current period revenue
      const { data: currentTrips } = await supabase
        .from('trips')
        .select('total_amount')
        .eq('status', 'completed')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString());

      const currentRevenue = currentTrips?.reduce((sum, trip) => sum + trip.total_amount, 0) || 0;

      // Get previous period revenue
      const { data: previousTrips } = await supabase
        .from('trips')
        .select('total_amount')
        .eq('status', 'completed')
        .eq('payment_status', 'paid')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString());

      const previousRevenue = previousTrips?.reduce((sum, trip) => sum + trip.total_amount, 0) || 0;

      // Calculate growth percentage
      const growth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : currentRevenue > 0 ? 100 : 0;

      return {
        current_revenue: currentRevenue,
        previous_revenue: previousRevenue,
        growth_percentage: parseFloat(growth.toFixed(2)),
        formatted_current_revenue: formatCurrency(currentRevenue, 'USD'),
        formatted_previous_revenue: formatCurrency(previousRevenue, 'USD'),
        is_positive: growth > 0
      };
    } catch (error) {
      console.error('Error calculating revenue growth:', error);
      return {
        current_revenue: 0,
        previous_revenue: 0,
        growth_percentage: 0,
        formatted_current_revenue: formatCurrency(0, 'USD'),
        formatted_previous_revenue: formatCurrency(0, 'USD'),
        is_positive: false
      };
    }
  },

  convertFinancialDataToCSV(data) {
    if (!data.reports || data.reports.length === 0) {
      return '';
    }

    const headers = [
      'Date', 'Revenue', 'Commission', 'Driver Earnings', 'Transactions', 
      'Payouts', 'Net Profit', 'Formatted Revenue', 'Formatted Commission',
      'Formatted Driver Earnings', 'Formatted Transactions', 'Formatted Payouts',
      'Formatted Net Profit'
    ];

    const rows = data.reports.map(report => [
      report.date,
      report.revenue,
      report.commission,
      report.driver_earnings,
      report.transactions,
      report.payouts,
      report.net_profit,
      report.formatted_revenue,
      report.formatted_commission,
      report.formatted_driver_earnings,
      report.formatted_transactions,
      report.formatted_payouts,
      report.formatted_net_profit
    ]);

    // Add summary row
    rows.push([
      'TOTAL/AVERAGE',
      data.summary.total_revenue,
      data.summary.total_commission,
      '', // Driver earnings total not calculated separately
      '', // Transactions total not calculated separately
      data.summary.total_payouts,
      data.summary.net_profit,
      data.summary.formatted_total_revenue,
      data.summary.formatted_total_commission,
      '',
      '',
      data.summary.formatted_total_payouts,
      data.summary.formatted_net_profit
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  prepareFinancialDataForPDF(data) {
    return {
      title: 'Financial Report',
      period: data.period,
      report_type: data.report_type,
      generated_at: data.generated_at,
      summary: data.summary,
      reports: data.reports,
      charts: {
        revenue_trend: this.generateChartData(data.reports, 'revenue'),
        commission_trend: this.generateChartData(data.reports, 'commission'),
        net_profit_trend: this.generateChartData(data.reports, 'net_profit')
      }
    };
  },

  generateChartData(reports, field) {
    return reports.map(report => ({
      date: report.date,
      value: report[field],
      formatted_value: report[`formatted_${field}`]
    }));
  }
};

export default financeService;