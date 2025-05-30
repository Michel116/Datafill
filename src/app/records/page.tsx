
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link'; // Import Link
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Trash2, ListOrdered, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// This interface should ideally be in a shared types file
interface MeasurementRecord {
  id: string;
  timestamp: string;
  serialNumber: string;
  deviceName: string;
  deviceType: string;
  selectedPointLabel: string;
  selectedPointValue: string;
  correction: number;
  measurements: number[];
  averageMeasurement: number;
  correctedAverageMeasurement: number;
  lowerLimit: number;
  upperLimit: number;
  result: 'ГОДЕН' | 'БРАК';
}

const MAX_MEASUREMENTS_DISPLAY = 3; // Should match MEASUREMENTS_COUNT from fill-data page

function RecordsContent() {
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRecords = localStorage.getItem('measurementRecords');
      if (storedRecords) {
        try {
          const parsedRecords: MeasurementRecord[] = JSON.parse(storedRecords);
          // Sort by newest first
          setRecords(parsedRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (error) {
          console.error("Failed to parse records from localStorage:", error);
          toast({ title: "Ошибка загрузки записей", description: "Не удалось прочитать сохраненные данные.", variant: "destructive" });
          setRecords([]); // Reset to empty array on error
        }
      }
    }
  }, [toast]);

  const handleDownloadCsv = () => {
    if (records.length === 0) {
      toast({ title: "Нет данных", description: "Нет записей для скачивания.", variant: "default" });
      return;
    }

    const headers = [
      "Дата и время", "Тип устройства", "Имя устройства", "Серийный номер",
      "Точка поверки", "Значение точки", "Поправка",
      ...Array.from({ length: MAX_MEASUREMENTS_DISPLAY }, (_, i) => `Измерение ${i + 1}`),
      "Среднее изм.", "Скорр. среднее",
      "Ниж. предел", "Верх. предел", "Результат (Вывод)"
    ];

    const csvRows = [
      headers.join(','),
      ...records.map(record => {
        const measurementCells = Array.from({ length: MAX_MEASUREMENTS_DISPLAY }, (_, i) =>
          record.measurements[i] !== undefined ? record.measurements[i].toString().replace('.', ',') : '' // Use comma for decimal
        );
        return [
          format(new Date(record.timestamp), "dd.MM.yyyy HH:mm:ss", { locale: ru }),
          `"${record.deviceType.replace(/"/g, '""')}"`,
          `"${record.deviceName.replace(/"/g, '""')}"`,
          `"${record.serialNumber.replace(/"/g, '""')}"`,
          `"${record.selectedPointLabel.replace(/"/g, '""')}"`,
          record.selectedPointValue.replace('.', ','),
          record.correction.toString().replace('.', ','),
          ...measurementCells,
          record.averageMeasurement.toFixed(2).replace('.', ','),
          record.correctedAverageMeasurement.toFixed(2).replace('.', ','),
          record.lowerLimit.toString().replace('.', ','),
          record.upperLimit.toString().replace('.', ','),
          record.result
        ].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `records_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Загрузка начата", description: "CSV файл с записями загружается.", variant: "default" });
    } else {
       toast({ title: "Ошибка загрузки", description: "Ваш браузер не поддерживает автоматическую загрузку.", variant: "destructive" });
    }
  };

  const handleClearRecords = () => {
    if (typeof window !== 'undefined') {
        if (window.confirm("Вы уверены, что хотите удалить все записи? Это действие необратимо.")) {
            localStorage.removeItem('measurementRecords');
            setRecords([]);
            toast({ title: "Записи удалены", description: "Все локальные записи были стерты.", variant: "default" });
        }
    }
  };

  return (
    <PageLayout pageTitle="Журнал записей">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h2 className="text-2xl font-semibold flex items-center"><ListOrdered className="mr-2 h-6 w-6 text-primary shrink-0" />Сохраненные записи</h2>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <Link href="/" passHref>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> На главную
              </Button>
            </Link>
            <Button onClick={handleDownloadCsv} disabled={records.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Скачать CSV
            </Button>
            <Button variant="destructive" onClick={handleClearRecords} disabled={records.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" /> Очистить все
            </Button>
          </div>
        </div>
        {records.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Нет сохраненных записей.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>Список всех сохраненных измерений. Данные хранятся локально в вашем браузере.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Дата и время</TableHead>
                      <TableHead className="min-w-[120px]">S/N</TableHead>
                      <TableHead className="min-w-[150px]">Устройство</TableHead>
                      <TableHead className="min-w-[120px]">Точка поверки</TableHead>
                      {Array.from({ length: MAX_MEASUREMENTS_DISPLAY }, (_, i) => (
                        <TableHead key={`mes-head-${i}`} className="min-w-[80px] text-center">Изм. {i + 1}</TableHead>
                      ))}
                      <TableHead className="min-w-[100px] text-center">Скорр. ср.</TableHead>
                      <TableHead className="min-w-[100px] text-center">Результат</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className={record.result === 'БРАК' ? 'bg-destructive/10 hover:bg-destructive/20 data-[state=selected]:bg-destructive/20' : 'data-[state=selected]:bg-muted/50'}>
                        <TableCell>{format(new Date(record.timestamp), "dd.MM.yy HH:mm", { locale: ru })}</TableCell>
                        <TableCell>{record.serialNumber}</TableCell>
                        <TableCell>{record.deviceName}</TableCell>
                        <TableCell>{record.selectedPointLabel}</TableCell>
                        {Array.from({ length: MAX_MEASUREMENTS_DISPLAY }, (_, i) => (
                          <TableCell key={`${record.id}-mes-${i}`} className="text-center">
                            {record.measurements[i] !== undefined ? record.measurements[i].toFixed(2).replace('.', ',') : '–'}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-medium">{record.correctedAverageMeasurement.toFixed(2).replace('.', ',')}°C</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                            record.result === 'ГОДЕН' ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'
                          }`}>
                            {record.result}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<PageLayout pageTitle="Загрузка записей..."><div className="text-center py-10"><p className="text-muted-foreground">Загрузка...</p></div></PageLayout>}>
      <RecordsContent />
    </Suspense>
  );
}

    
