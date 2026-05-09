
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Download, Building2 } from 'lucide-react';

const StatCard = ({ stat }) => {
  const getIcon = (iconName) => {
    const icons = {
      FileText: FileText,
      Users: Users,
      Download: Download,
      Building2: Building2
    };
    const Icon = icons[iconName] || FileText;
    return <Icon className="w-8 h-8 text-primary" />;
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-6 text-center">
        <div className="flex justify-center mb-3">
          {getIcon(stat.icon)}
        </div>
        <div className="text-4xl font-bold text-primary mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {stat.value}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
      </CardContent>
    </Card>
  );
};

export default StatCard;
