"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabase } from '@/components/providers/supabase-provider';
import { User } from '@/lib/types';
import { UserPlus } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ email: '', role: 'operator', airport_codes: [] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { supabase } = useSupabase();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, [supabase]);

  const handleCreateUser = async () => {
    const { error } = await supabase.auth.signUp({
      email: newUser.email,
      password: Math.random().toString(36).slice(-8),
    });

    if (!error) {
      await supabase.from('users').insert([{
        email: newUser.email,
        role: newUser.role,
        airport_codes: newUser.airport_codes
      }]);

      setDialogOpen(false);
      setNewUser({ email: '', role: 'operator', airport_codes: [] });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>User Management</div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser}>Create User</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {users.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="grid gap-1">
                <div className="font-semibold">{user.email}</div>
                <div className="text-sm text-muted-foreground">
                  Role: {user.role}
                </div>
              </div>
              <div className="text-sm">
                {user.airport_codes.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}