import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface Employee {
  id: string;
  name: string;
  avatar_color: string;
  created_at: string;
}

export interface Swear {
  id: string;
  employee_id: string;
  note?: string;
  created_at: string;
}

export interface Setting {
  price_per_swear: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey.length > 0 &&
    supabaseAnonKey.length > 30
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const ensureSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
    );
  }
  return supabase;
};

const SEED_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Michael Scott', avatar_color: 'bg-blue-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-2', name: 'Dwight Schrute', avatar_color: 'bg-amber-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-3', name: 'Jim Halpert', avatar_color: 'bg-emerald-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-4', name: 'Pam Beesly', avatar_color: 'bg-rose-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-5', name: 'Andy Bernard', avatar_color: 'bg-purple-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-6', name: 'Angela Martin', avatar_color: 'bg-orange-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
];

export const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-cyan-500',
];

export const getRandomAvatarColor = () => {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
};

export const db = {
  async getEmployees(): Promise<Employee[]> {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addEmployee(name: string, avatarColor?: string): Promise<Employee> {
    const client = ensureSupabase();
    const color = avatarColor || getRandomAvatarColor();
    const { data, error } = await client
      .from('employees')
      .insert([{ name, avatar_color: color }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateEmployee(id: string, name: string): Promise<Employee> {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('employees')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteEmployee(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('employees').delete().eq('id', id);
    if (error) throw error;
  },

  async getSwears(): Promise<Swear[]> {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('swears')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addSwear(employee_id: string, note?: string): Promise<Swear> {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('swears')
      .insert([{ employee_id, note: note || null }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSwear(id: string): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client.from('swears').delete().eq('id', id);
    if (error) throw error;
  },

  async getPricePerSwear(): Promise<number> {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('settings')
      .select('price_per_swear')
      .eq('id', 'default')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: inserted, error: insertError } = await client
          .from('settings')
          .insert([{ id: 'default', price_per_swear: 5 }])
          .select('price_per_swear')
          .single();
        if (insertError) return 5;
        return Number(inserted?.price_per_swear || 5);
      }
      return 5;
    }
    return Number(data?.price_per_swear ?? 5);
  },

  async updatePricePerSwear(price: number): Promise<void> {
    const client = ensureSupabase();
    const { error } = await client
      .from('settings')
      .upsert({ id: 'default', price_per_swear: price, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  async seedSupabase(): Promise<{ employees: Employee[]; swears: Swear[] }> {
    const client = ensureSupabase();

    const { data: insertedEmployees, error: empError } = await client
      .from('employees')
      .insert(SEED_EMPLOYEES.map(({ name, avatar_color }) => ({ name, avatar_color })))
      .select();

    if (empError) throw empError;

    const swearsToInsert: { employee_id: string; note: string; created_at: string }[] = [];
    const now = new Date();
    const currentMonthYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentMonthYear - 1 : currentMonthYear;

    const randomDateInMonth = (year: number, month: number) => {
      return new Date(year, month, Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 12) + 8).toISOString();
    };

    const quoteTemplates = [
      "That's what she said!", "False!", "Bears. Beets. Battlestar Galactica.",
      "Idiot.", "Rit-dit-dit-di-doo!", "Declaring bankruptcy!", "Boom! Roasted.",
      "Said a swear word", "Under the breath", "Oops, slipped up!"
    ];

    insertedEmployees.forEach((emp, index) => {
      const count = (6 - index) * 3;
      for (let i = 0; i < count; i++) {
        swearsToInsert.push({
          employee_id: emp.id,
          note: quoteTemplates[Math.floor(Math.random() * quoteTemplates.length)],
          created_at: randomDateInMonth(currentMonthYear, currentMonth)
        });
      }
      const prevCount = (6 - index) * 2;
      for (let i = 0; i < prevCount; i++) {
        swearsToInsert.push({
          employee_id: emp.id,
          note: "Historical swear",
          created_at: randomDateInMonth(prevMonthYear, prevMonth)
        });
      }
    });

    const { data: insertedSwears, error: swearError } = await client
      .from('swears')
      .insert(swearsToInsert)
      .select();

    if (swearError) throw swearError;

    return {
      employees: insertedEmployees,
      swears: insertedSwears
    };
  },

  async clearAllData(): Promise<void> {
    const client = ensureSupabase();
    const { error: errorSwears } = await client
      .from('swears')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: errorEmployees } = await client
      .from('employees')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (errorSwears) throw errorSwears;
    if (errorEmployees) throw errorEmployees;
  }
};
