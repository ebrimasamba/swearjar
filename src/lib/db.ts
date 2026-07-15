import { createClient } from '@supabase/supabase-js';

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

// A simple utility to check if Supabase is properly configured
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

// Mock database default seed data
const SEED_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Michael Scott', avatar_color: 'bg-blue-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-2', name: 'Dwight Schrute', avatar_color: 'bg-amber-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-3', name: 'Jim Halpert', avatar_color: 'bg-emerald-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-4', name: 'Pam Beesly', avatar_color: 'bg-rose-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-5', name: 'Andy Bernard', avatar_color: 'bg-purple-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'emp-6', name: 'Angela Martin', avatar_color: 'bg-orange-500', created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
];

const generateSeedSwears = (employees: Employee[]): Swear[] => {
  const list: Swear[] = [];
  const now = new Date();
  
  // Current month helper
  const currentMonthYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Previous month helper
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentMonthYear - 1 : currentMonthYear;

  // Let's create some laughs with notes
  const michaelQuotes = [
    "That's what she said!",
    "No God please no! Nooooo!",
    "I'm not superstitious, but I am a little stitious.",
    "Broke a glass during a presentation",
    "Declared bankruptcy out loud",
    "Boom! Roasted."
  ];

  const dwightQuotes = [
    "False!",
    "Idiot.",
    "Bears. Beets. Battlestar Galactica.",
    "Question.",
    "Perfectenschlag."
  ];

  const andyQuotes = [
    "Rit-dit-dit-di-doo!",
    "Punched a hole in the wall",
    "Did I stutter?",
    "Nard Dog out!"
  ];

  const otherQuotes = [
    "Oops, slipped up",
    "Said a bad word during team meeting",
    "Spilled hot coffee and swore",
    "Frustrated with the printer"
  ];

  const randomDateInMonth = (year: number, month: number) => {
    const date = new Date(year, month, Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
    return date.toISOString();
  };

  // Generate current month swears
  // Michael (14 swears)
  for (let i = 0; i < 14; i++) {
    list.push({
      id: `swear-m-${i}`,
      employee_id: 'emp-1',
      note: michaelQuotes[i % michaelQuotes.length],
      created_at: randomDateInMonth(currentMonthYear, currentMonth)
    });
  }

  // Dwight (10 swears)
  for (let i = 0; i < 10; i++) {
    list.push({
      id: `swear-d-${i}`,
      employee_id: 'emp-2',
      note: dwightQuotes[i % dwightQuotes.length],
      created_at: randomDateInMonth(currentMonthYear, currentMonth)
    });
  }

  // Andy (6 swears)
  for (let i = 0; i < 6; i++) {
    list.push({
      id: `swear-an-${i}`,
      employee_id: 'emp-5',
      note: andyQuotes[i % andyQuotes.length],
      created_at: randomDateInMonth(currentMonthYear, currentMonth)
    });
  }

  // Angela (4 swears)
  for (let i = 0; i < 4; i++) {
    list.push({
      id: `swear-ang-${i}`,
      employee_id: 'emp-6',
      note: "Said something judgmental",
      created_at: randomDateInMonth(currentMonthYear, currentMonth)
    });
  }

  // Jim (2 swears)
  for (let i = 0; i < 2; i++) {
    list.push({
      id: `swear-j-${i}`,
      employee_id: 'emp-3',
      note: "Teased Dwight a bit too hard",
      created_at: randomDateInMonth(currentMonthYear, currentMonth)
    });
  }

  // Pam (1 swear)
  list.push({
    id: `swear-p-0`,
    employee_id: 'emp-4',
    note: "Under the breath during a call",
    created_at: randomDateInMonth(currentMonthYear, currentMonth)
  });

  // Generate some historical swears from last month
  // Michael (8 swears)
  for (let i = 0; i < 8; i++) {
    list.push({
      id: `swear-m-prev-${i}`,
      employee_id: 'emp-1',
      note: michaelQuotes[i % michaelQuotes.length],
      created_at: randomDateInMonth(prevMonthYear, prevMonth)
    });
  }

  // Dwight (12 swears)
  for (let i = 0; i < 12; i++) {
    list.push({
      id: `swear-d-prev-${i}`,
      employee_id: 'emp-2',
      note: "Dwight got angry at Jim's prank",
      created_at: randomDateInMonth(prevMonthYear, prevMonth)
    });
  }

  return list;
};

// Local storage database helpers
const getLocalData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

// Helper for generating colors
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
  // --- Employees API ---
  async getEmployees(): Promise<Employee[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const isInitialized = typeof window !== 'undefined' && localStorage.getItem('swearjar_initialized') === 'true';
      let employees = getLocalData<Employee[]>('swearjar_employees', []);
      
      if (!isInitialized && employees.length === 0) {
        employees = SEED_EMPLOYEES;
        setLocalData('swearjar_employees', employees);
        
        const swears = getLocalData<Swear[]>('swearjar_swears', []);
        if (swears.length === 0) {
          setLocalData('swearjar_swears', generateSeedSwears(employees));
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('swearjar_initialized', 'true');
        }
      }
      return employees.sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  async addEmployee(name: string, avatarColor?: string): Promise<Employee> {
    const color = avatarColor || getRandomAvatarColor();
    if (supabase) {
      const { data, error } = await supabase
        .from('employees')
        .insert([{ name, avatar_color: color }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const employees = await this.getEmployees();
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name,
        avatar_color: color,
        created_at: new Date().toISOString(),
      };
      employees.push(newEmp);
      setLocalData('swearjar_employees', employees);
      return newEmp;
    }
  },

  async updateEmployee(id: string, name: string): Promise<Employee> {
    if (supabase) {
      const { data, error } = await supabase
        .from('employees')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const employees = await this.getEmployees();
      const idx = employees.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Employee not found');
      employees[idx].name = name;
      setLocalData('swearjar_employees', employees);
      return employees[idx];
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    } else {
      const employees = await this.getEmployees();
      const updated = employees.filter((e) => e.id !== id);
      setLocalData('swearjar_employees', updated);

      // Cascade delete swears in local storage
      const swears = await this.getSwears();
      const filteredSwears = swears.filter((s) => s.employee_id !== id);
      setLocalData('swearjar_swears', filteredSwears);
    }
  },

  // --- Swears API ---
  async getSwears(): Promise<Swear[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('swears')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const isInitialized = typeof window !== 'undefined' && localStorage.getItem('swearjar_initialized') === 'true';
      const swears = getLocalData<Swear[]>('swearjar_swears', []);
      if (!isInitialized && swears.length === 0) {
        const employees = getLocalData<Employee[]>('swearjar_employees', SEED_EMPLOYEES);
        const seedSwears = generateSeedSwears(employees);
        setLocalData('swearjar_swears', seedSwears);
        return seedSwears;
      }
      return swears.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async addSwear(employee_id: string, note?: string): Promise<Swear> {
    if (supabase) {
      const { data, error } = await supabase
        .from('swears')
        .insert([{ employee_id, note: note || null }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const swears = await this.getSwears();
      const newSwear: Swear = {
        id: `swear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employee_id,
        note: note || undefined,
        created_at: new Date().toISOString(),
      };
      swears.unshift(newSwear);
      setLocalData('swearjar_swears', swears);
      return newSwear;
    }
  },

  async deleteSwear(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('swears').delete().eq('id', id);
      if (error) throw error;
    } else {
      const swears = await this.getSwears();
      const updated = swears.filter((s) => s.id !== id);
      setLocalData('swearjar_swears', updated);
    }
  },

  // --- Settings API ---
  async getPricePerSwear(): Promise<number> {
    if (supabase) {
      const { data, error } = await supabase
        .from('settings')
        .select('price_per_swear')
        .eq('id', 'default')
        .single();
      
      if (error) {
        // If row doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: inserted, error: insertError } = await supabase
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
    } else {
      return getLocalData<number>('swearjar_price_per_swear', 5);
    }
  },

  async updatePricePerSwear(price: number): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 'default', price_per_swear: price, updated_at: new Date().toISOString() });
      if (error) throw error;
    } else {
      setLocalData('swearjar_price_per_swear', price);
    }
  },

  // --- Seeding helper for Supabase ---
  async seedSupabase(): Promise<{ employees: Employee[]; swears: Swear[] }> {
    if (!supabase) return { employees: [], swears: [] };

    // Clear and seed employees
    const { data: insertedEmployees, error: empError } = await supabase
      .from('employees')
      .insert(SEED_EMPLOYEES.map(({ name, avatar_color }) => ({ name, avatar_color })))
      .select();

    if (empError) throw empError;

    // Map seed swears to the actual database generated employee IDs
    const swearsToInsert: any[] = [];
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

    // Distribute some swears among the inserted employees
    insertedEmployees.forEach((emp, index) => {
      // Different counts based on index to create leaderboard differentiation
      const count = (6 - index) * 3; // e.g. index 0 (Michael): 18 swears, index 1 (Dwight): 15, index 2: 12, etc.
      for (let i = 0; i < count; i++) {
        swearsToInsert.push({
          employee_id: emp.id,
          note: quoteTemplates[Math.floor(Math.random() * quoteTemplates.length)],
          created_at: randomDateInMonth(currentMonthYear, currentMonth)
        });
      }
      // Add historical last month swears
      const prevCount = (6 - index) * 2;
      for (let i = 0; i < prevCount; i++) {
        swearsToInsert.push({
          employee_id: emp.id,
          note: "Historical swear",
          created_at: randomDateInMonth(prevMonthYear, prevMonth)
        });
      }
    });

    const { data: insertedSwears, error: swearError } = await supabase
      .from('swears')
      .insert(swearsToInsert)
      .select();

    if (swearError) throw swearError;

    return {
      employees: insertedEmployees,
      swears: insertedSwears
    };
  },

  // Reset demo data in local storage
  resetLocalDemoData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('swearjar_employees');
    localStorage.removeItem('swearjar_swears');
    localStorage.removeItem('swearjar_price_per_swear');
    localStorage.removeItem('swearjar_initialized');
    // Reloading will trigger re-seeding
  },

  // Clear all data to start completely fresh
  async clearAllData(): Promise<void> {
    if (supabase) {
      const { error: errorSwears } = await supabase
        .from('swears')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error: errorEmployees } = await supabase
        .from('employees')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (errorSwears) throw errorSwears;
      if (errorEmployees) throw errorEmployees;
    } else {
      if (typeof window === 'undefined') return;
      setLocalData('swearjar_employees', []);
      setLocalData('swearjar_swears', []);
      localStorage.setItem('swearjar_initialized', 'true');
    }
  }
};
