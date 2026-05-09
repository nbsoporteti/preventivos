
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const TeamCard = ({ member }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="aspect-square overflow-hidden">
        <img
          src={member.photo}
          alt={member.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-6 text-center">
        <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
        <p className="text-muted-foreground text-sm">{member.role}</p>
      </CardContent>
    </Card>
  );
};

export default TeamCard;
