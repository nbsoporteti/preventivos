
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiServerClient from '@/lib/apiServerClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, FileStack, Tags, Loader2, UserCheck, TrendingUp, LayoutGrid, GraduationCap, FileEdit } from 'lucide-react';
import StatisticsCard from '@/components/StatisticsCard.jsx';
import AdminUsersPanel from '@/components/admin/AdminUsersPanel.jsx';
import AdminResourcesPanel from '@/components/admin/AdminResourcesPanel.jsx';
import AdminCategoriesPanel from '@/components/admin/AdminCategoriesPanel.jsx';
import AdminLmsPanel from '@/components/admin/AdminLmsPanel.jsx';
import AdminCmsPanel from '@/components/admin/AdminCmsPanel.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await apiServerClient.fetch('/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        toast.error('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      <Helmet>
        <title>Panel de Administración | Preventivos CL</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Panel de Administración</h1>
            <p className="text-muted-foreground mt-2">
              Gestión global de usuarios, recursos y configuraciones.
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-8">
            <TabsList className="bg-card border border-border/50 p-1 flex-wrap h-auto">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <BarChart3 className="w-4 h-4 mr-2" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Users className="w-4 h-4 mr-2" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <FileStack className="w-4 h-4 mr-2" />
                Recursos
              </TabsTrigger>
              <TabsTrigger value="categories" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Categorías
              </TabsTrigger>
              <TabsTrigger value="lms" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <GraduationCap className="w-4 h-4 mr-2" />
                LMS / Quizzes
              </TabsTrigger>
              <TabsTrigger value="cms" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <FileEdit className="w-4 h-4 mr-2" />
                Páginas (CMS)
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="focus-visible:outline-none space-y-8">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <StatisticsCard 
                      title="Total Usuarios" 
                      value={stats?.totalUsers || '0'} 
                      icon={Users}
                    />
                    <StatisticsCard 
                      title="Usuarios Activos (7 días)" 
                      value={stats?.activeUsersCount ?? stats?.activeUsers ?? '0'} 
                      icon={UserCheck}
                    />
                    <StatisticsCard 
                      title="Total Descargas" 
                      value={stats?.totalDownloads || '0'} 
                      icon={FileStack}
                    />
                    <StatisticsCard 
                      title="Total Recursos" 
                      value={stats?.totalResources || '0'} 
                      icon={Tags}
                    />
                  </div>

                  <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                      <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <CardTitle className="text-lg">Recursos más descargados</CardTitle>
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          Top 5 según el historial de descargas registrado.
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(stats?.topResources) && stats.topResources.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Recurso</TableHead>
                              <TableHead className="text-right w-32">Descargas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.topResources.map((row, idx) => (
                              <TableRow key={row.resourceId}>
                                <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                                <TableCell className="font-medium">
                                  {row.titulo || (
                                    <span className="text-muted-foreground font-normal italic">
                                      Recurso eliminado o no disponible
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{row.downloadCount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                          Aún no hay descargas registradas en el historial.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="users" className="focus-visible:outline-none">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Gestión de usuarios</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Busca, edita rol y estado, o elimina cuentas (no puedes eliminar la tuya).
                  </p>
                </CardHeader>
                <CardContent>
                  <AdminUsersPanel />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="resources" className="focus-visible:outline-none">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Gestión de recursos</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Alta, edición y baja de recursos del catálogo. La descarga usa la URL indicada o el archivo subido en el servidor.
                  </p>
                </CardHeader>
                <CardContent>
                  <AdminResourcesPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="focus-visible:outline-none">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Categorías del catálogo</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Nombre, descripción e icono visibles en la web. Los iconos son una lista segura definida en la aplicación.
                  </p>
                </CardHeader>
                <CardContent>
                  <AdminCategoriesPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lms" className="focus-visible:outline-none">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>LMS — Cuestionarios</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Creá actividades y preguntas desde aquí; los usuarios las ven en{' '}
                    <strong className="font-medium text-foreground">Dashboard → Aprende</strong>. Solo administradores
                    pueden editar cuestionarios.
                  </p>
                </CardHeader>
                <CardContent>
                  <AdminLmsPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cms" className="focus-visible:outline-none">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Contenido de páginas públicas</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Editá textos de casi todas las rutas públicas (inicio, biblioteca, nosotros, contacto, donar, auth,
                    plantillas de recurso/categoría, aprende en dashboard…) sin desplegar código. Los visitantes ven los
                    cambios al guardar.
                  </p>
                </CardHeader>
                <CardContent>
                  <AdminCmsPanel />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminDashboardPage;
