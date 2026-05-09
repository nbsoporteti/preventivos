
const generateResources = () => {
  const categories = [
    {
      id: 'seguridad',
      name: 'Seguridad',
      titles: ['Manual de Seguridad Básica', 'Guía de Riesgos Químicos', 'Protocolo de Trabajo en Altura', 'Seguridad en Espacios Confinados', 'Manejo de Cargas Manuales', 'Prevención de Incendios', 'Uso Correcto de Extintores', 'Señalización de Seguridad', 'Ergonomía en Oficina', 'Seguridad Eléctrica Básica']
    },
    {
      id: 'normativas',
      name: 'Normativas',
      titles: ['Ley 16.744 Actualizada', 'Decreto Supremo 594', 'Norma ISO 45001:2018', 'Reglamento Interno de Orden', 'Ley 20.949 (Ley del Saco)', 'Decreto 40 sobre Prevención', 'Normativa de Ruido Laboral', 'Protocolo MINSAL Radiación UV', 'Ley 20.001 Peso Máximo', 'Decreto 54 Comités Paritarios']
    },
    {
      id: 'charlas',
      name: 'Charlas de 5 Minutos',
      titles: ['Importancia del Autocuidado', 'Uso Correcto de EPP', 'Peligros del Celular al Caminar', 'Orden y Limpieza (5S)', 'Prevención de Caídas', 'Cuidado de las Manos', 'Riesgos Psicosociales', 'Hidratación en el Trabajo', 'Reporte de Cuasi Accidentes', 'Trabajo en Equipo y Seguridad']
    },
    {
      id: 'matrices',
      name: 'Matrices IPER',
      titles: ['Matriz IPER Construcción', 'Matriz IPER Minería', 'Matriz IPER Oficinas', 'Matriz IPER Bodegas', 'Matriz IPER Transporte', 'Matriz IPER Cocina Industrial', 'Matriz IPER Mantenimiento', 'Matriz IPER Trabajo en Altura', 'Matriz IPER Soldadura', 'Matriz IPER Laboratorio']
    },
    {
      id: 'formatos',
      name: 'Formatos de Inspección',
      titles: ['Checklist de Extintores', 'Inspección de Botiquines', 'Revisión de Arnés de Seguridad', 'Checklist de Vehículos', 'Inspección de Herramientas', 'Formato Entrega de EPP', 'Checklist de Andamios', 'Inspección de Tableros Eléctricos', 'Revisión de Orden y Aseo', 'Checklist de Maquinaria Pesada']
    },
    {
      id: 'procedimientos',
      name: 'Procedimientos',
      titles: ['Procedimiento de Bloqueo (LOTO)', 'Reporte de Incidentes', 'Evacuación de Emergencia', 'Trabajo en Caliente', 'Manejo de Sustancias Peligrosas', 'Procedimiento de Izaje', 'Rescate en Espacios Confinados', 'Investigación de Accidentes', 'Manejo de Residuos', 'Procedimiento de Primeros Auxilios']
    }
  ];

  const fileTypes = ['PDF', 'DOCX', 'XLSX', 'PPT'];
  const resources = [];
  let idCounter = 1;

  categories.forEach(cat => {
    cat.titles.forEach((title, index) => {
      // Assign file types based on category for realism
      let fileType = 'PDF';
      if (cat.id === 'matrices' || cat.id === 'formatos') fileType = index % 2 === 0 ? 'XLSX' : 'DOCX';
      if (cat.id === 'charlas') fileType = index % 3 === 0 ? 'PPT' : 'PDF';

      let fileIcon = 'FileText';
      if (fileType === 'XLSX') fileIcon = 'FileSpreadsheet';
      if (fileType === 'PPT') fileIcon = 'Presentation';

      // Generate a random date within the last year
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));

      resources.push({
        id: idCounter++,
        title: title,
        description: `Documento detallado sobre ${title.toLowerCase()} para la gestión de prevención de riesgos. Incluye lineamientos actualizados y mejores prácticas.`,
        categoryId: cat.id,
        category: cat.name,
        fileType: fileType,
        fileIcon: fileIcon,
        uploadDate: date.toISOString(),
        fileSize: (Math.random() * 4 + 0.5).toFixed(1) // Size between 0.5 and 4.5 MB
      });
    });
  });

  return resources;
};

export const mockResources = generateResources();

export const categories = [
  { id: 'seguridad', name: 'Seguridad', icon: 'Shield' },
  { id: 'normativas', name: 'Normativas', icon: 'BookOpen' },
  { id: 'charlas', name: 'Charlas de 5 Minutos', icon: 'MessageSquare' },
  { id: 'matrices', name: 'Matrices IPER', icon: 'Grid3x3' },
  { id: 'formatos', name: 'Formatos de Inspección', icon: 'ClipboardCheck' },
  { id: 'procedimientos', name: 'Procedimientos', icon: 'FileCheck' }
];
