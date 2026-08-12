import { 
  Home, Bot, Zap, Inbox, ShoppingBag, Megaphone, DollarSign, Store, 
  Users, PieChart, Brain, Link2, CreditCard, Settings 
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

export const UMKM_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Home', icon: Home },
  { id: 'my_agents', label: 'My AI Employees', icon: Bot },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sales', label: 'Sales', icon: ShoppingBag },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'store', label: 'Store', icon: Store },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reports', label: 'Reports', icon: PieChart },
  { id: 'knowledge', label: 'Knowledge', icon: Brain },
  { id: 'integrations', label: 'Marketplace', icon: Link2 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
];
