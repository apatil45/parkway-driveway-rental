/**
 * Supabase Client Configuration for Vercel Deployment
 * Handles database connections and real-time subscriptions
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://aqjjgmmvviozmedjgxdy.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxampnbW12dmlvem1lZGpneGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjA5MTUsImV4cCI6MjA3Njg5NjkxNX0.XCQQfVAGDTnDqC4W6RHMd8Rmj3C8UyFUmE-S18JVLWk'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database helper functions
export const db = {
  // Users
  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw error
    return data
  },

  // Driveways
  async getDriveways(filters = {}) {
    let query = supabase
      .from('driveways')
      .select(`
        *,
        owner:users(name, email)
      `)
      .eq('is_active', true)

    if (filters.location) {
      query = query.ilike('address', `%${filters.location}%`)
    }

    if (filters.priceMin) {
      query = query.gte('price_per_hour', filters.priceMin)
    }

    if (filters.priceMax) {
      query = query.lte('price_per_hour', filters.priceMax)
    }

    if (filters.size) {
      query = query.eq('driveway_size', filters.size)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getDrivewayById(id) {
    const { data, error } = await supabase
      .from('driveways')
      .select(`
        *,
        owner:users(name, email),
        bookings:bookings(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createDriveway(drivewayData) {
    const { data, error } = await supabase
      .from('driveways')
      .insert([drivewayData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateDriveway(id, updates) {
    const { data, error } = await supabase
      .from('driveways')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteDriveway(id) {
    const { error } = await supabase
      .from('driveways')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Bookings
  async getBookings(userId = null) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        driveway:driveways(address, price_per_hour),
        user:users(name, email)
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getBookingById(id) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        driveway:driveways(*),
        user:users(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createBooking(bookingData) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateBooking(id, updates) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async cancelBooking(id) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Real-time subscriptions
  subscribeToDriveways(callback) {
    return supabase
      .channel('driveways')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'driveways' },
        callback
      )
      .subscribe()
  },

  subscribeToBookings(callback) {
    return supabase
      .channel('bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        callback
      )
      .subscribe()
  },

  subscribeToUserBookings(userId, callback) {
    return supabase
      .channel(`user-bookings-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

// Auth helper functions
export const auth = {
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  async updateUser(updates) {
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) throw error
    return data
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export default supabase