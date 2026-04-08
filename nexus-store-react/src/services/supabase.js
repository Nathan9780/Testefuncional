import { createClient } from '@supabase/supabase-js';

// COLOQUE SEUS DADOS REAIS AQUI
const supabaseUrl = 'https://uytghnfuggyjpbwmkizo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dGdobmZ1Z2d5anBid21raXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDgyMzMsImV4cCI6MjA5MTE4NDIzM30.S8jXqHx7b38P1mFkYKVWrFNJ7kaplo-PaZ8P4_27S7A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);