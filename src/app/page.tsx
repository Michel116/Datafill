
'use client';

import Link from 'next/link';
import { Thermometer, Smartphone, ListOrdered } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AppOption { // Renamed from DeviceOption for clarity
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  href: string; // Added href for flexibility
}

const deviceOptions: AppOption[] = [
  {
    id: 'thermometer',
    name: 'Термометры',
    icon: Thermometer,
    description: 'Ввод данных для термометров.',
    href: '/fill-data?device=thermometer&deviceName=Термометры',
  },
  {
    id: 'alcotest',
    name: 'Алкотестер е-200',
    icon: Smartphone,
    description: 'Ввод данных для алкотестеров.',
    href: '/fill-data?device=alcotest&deviceName=Алкотестер%20е-200',
  },
];

const utilityOptions: AppOption[] = [
   {
    id: 'records',
    name: 'Журнал записей',
    icon: ListOrdered,
    description: 'Просмотр и скачивание сохраненных данных.',
    href: '/records',
  }
];


export default function HomePage() {
  const renderOptionCard = (option: AppOption) => (
    <Link key={option.id} href={option.href} passHref legacyBehavior>
      <a className="block transform transition-all hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl">
        <Card className="h-full flex flex-col items-center text-center hover:shadow-xl cursor-pointer bg-card hover:bg-secondary/50 transition-colors duration-200">
          <CardHeader className="pb-3 flex flex-col items-center">
            <div className="p-3 bg-primary/10 rounded-full inline-block mb-3">
              <option.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-xl font-semibold">{option.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription>{option.description}</CardDescription>
          </CardContent>
        </Card>
      </a>
    </Link>
  );

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Выберите действие
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            С какого устройства будут вводиться данные или просмотрите журнал.
          </p>
        </div>
        
        <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl text-center">Заполнение данных</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {deviceOptions.map(renderOptionCard)}
        </div>

        <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl text-center pt-4">Утилиты</h3>
        <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto"> {/* Centered for single item, always single column */}
           {utilityOptions.map(renderOptionCard)}
        </div>
      </div>
    </PageLayout>
  );
}

