
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Calendar, Shield, Loader2 } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';

const UserProfilePage = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.nombre || user?.name || '');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiServerClient.fetch(`/users/${user.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) throw new Error('Error al actualizar perfil');
      
      const data = await response.json();
      setUser({ ...user, nombre: name, name: name });
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Visualiza y actualiza tus datos</CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                  <p className="text-base font-semibold">{user?.nombre || user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
                  <p className="text-base font-semibold">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rol de Usuario</p>
                  <p className="text-base font-semibold capitalize">{user?.rol || user?.role || 'Usuario'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Miembro desde</p>
                  <p className="text-base font-semibold">{formatDate(user?.created || user?.createdAt)}</p>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                  Editar Perfil
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input 
                  id="edit-name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Correo Electrónico (No editable)</Label>
                <Input value={user?.email} disabled className="bg-muted text-muted-foreground" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Guardar'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Actualiza tu contraseña periódicamente</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success('Funcionalidad en desarrollo'); }}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input id="current-password" type="password" className="bg-background" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input id="new-password" type="password" className="bg-background" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar Nueva Contraseña</Label>
              <Input id="confirm-new-password" type="password" className="bg-background" required />
            </div>
            <div className="pt-4">
              <Button type="submit" variant="secondary" className="w-full">
                Cambiar Contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
