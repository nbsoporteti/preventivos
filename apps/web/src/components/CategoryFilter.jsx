
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield, BookOpen, MessageSquare, Grid3x3, ClipboardCheck, FileCheck } from 'lucide-react';

const CategoryFilter = ({ categories, selectedCategories, onCategoryChange }) => {
  const getIcon = (iconName) => {
    const icons = {
      Shield: Shield,
      BookOpen: BookOpen,
      MessageSquare: MessageSquare,
      Grid3x3: Grid3x3,
      ClipboardCheck: ClipboardCheck,
      FileCheck: FileCheck
    };
    const Icon = icons[iconName] || Shield;
    return <Icon className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Categorías</h3>
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center space-x-3">
            <Checkbox
              id={category.id}
              checked={selectedCategories.includes(category.name)}
              onCheckedChange={(checked) => onCategoryChange(category.name, checked)}
            />
            <Label
              htmlFor={category.id}
              className="flex items-center gap-2 cursor-pointer font-medium"
            >
              {getIcon(category.icon)}
              <span>{category.name}</span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
